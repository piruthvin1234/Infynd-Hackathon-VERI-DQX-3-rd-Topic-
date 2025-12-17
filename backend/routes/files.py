from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import json
import pandas as pd
from datetime import datetime
import uuid

import models
import schemas
import auth
from dependencies import get_db, get_current_active_user
from services.data_quality import run_pipeline

router = APIRouter(
    prefix="/files",
    tags=["files"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_DIR = "data/uploads"
CLEAN_DIR = "data/cleaned"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CLEAN_DIR, exist_ok=True)

def sanitize_for_json(obj):
    import math
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    return obj

@router.post("/upload", response_model=List[schemas.UploadedFileResponse])
async def upload_files(
    files: List[UploadFile] = File(...),
    project_id: Optional[int] = Query(None),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload multiple CSV files.
    """
    uploaded_files_records = []

    for file in files:
        if not file.filename.endswith('.csv'):
            continue  # Skip non-csv files for now or raise error

        # Generate unique filename
        file_uuid = str(uuid.uuid4())
        safe_filename = f"{file_uuid}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Basic stats
        df = pd.read_csv(file_path)
        row_count = len(df)
        file_size = os.path.getsize(file_path)

        # Create DB record
        db_file = models.UploadedFile(
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            row_count=row_count,
            user_id=current_user.id,
            project_id=project_id,
            status=models.ProcessingStatus.PENDING
        )
        db.add(db_file)
        db.flush() # Get ID

        # Store Raw Records (Batch insert for performance)
        # Note: For very large files, this should be done in background task
        raw_records = []
        for idx, row in df.iterrows():
            # Convert row to dict and sanitize
            row_data = sanitize_for_json(row.to_dict())
            raw_records.append(models.RawRecord(
                file_id=db_file.id,
                row_index=idx,
                data=row_data
            ))
        
        # Determine batch size - SQLALchemy bulk_save_objects is faster
        db.bulk_save_objects(raw_records)
        
        uploaded_files_records.append(db_file)

    db.commit()
    return uploaded_files_records

@router.post("/{file_id}/analyze")
def analyze_file(
    file_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Run analysis pipeline on the file (Test Mode).
    Generates ReviewSuggestions.
    """
    db_file = db.query(models.UploadedFile).filter(
        models.UploadedFile.id == file_id,
        models.UploadedFile.user_id == current_user.id
    ).first()

    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    # Update status
    db_file.status = models.ProcessingStatus.PROCESSING
    db.commit()

    try:
        # Run pipeline WITHOUT auto-apply to get suggestions
        cleaned_df, report = run_pipeline(db_file.file_path, auto_apply=False)

        # Clear existing suggestions
        db.query(models.ReviewSuggestion).filter(models.ReviewSuggestion.file_id == file_id).delete()
        
        suggestions = []
        for change in report.get("changes", []):
            suggestion = models.ReviewSuggestion(
                file_id=file_id,
                row_index=change["row_index"],
                column_name=change["column"],
                original_value=str(change["original_value"]),
                suggested_value=str(change["cleaned_value"]),
                confidence_score=change["confidence"],
                issue_type=change["fix_type"],
                status="pending"
            )
            suggestions.append(suggestion)
        
        db.bulk_save_objects(suggestions)
        
        db_file.status = models.ProcessingStatus.ANALYZED
        db.commit()
        
        return {
            "message": "Analysis processing complete",
            "issues_found": report.get("issues_found", 0),
            "suggestions_count": len(suggestions)
        }

    except Exception as e:
        db_file.status = models.ProcessingStatus.FAILED
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

from sqlalchemy import func, desc, or_

# ... (rest of imports)

@router.get("/{file_id}/review", response_model=schemas.PaginatedRecords)
def get_review_data(
    file_id: int,
    page: int = 1,
    page_size: int = 50,
    filters: Optional[str] = Query(None),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get raw data merged with suggestions for the review UI.
    """
    # Verify ownership
    db_file = db.query(models.UploadedFile).filter(
        models.UploadedFile.id == file_id,
        models.UploadedFile.user_id == current_user.id
    ).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    # Base Query
    query = db.query(models.RawRecord).filter(models.RawRecord.file_id == file_id)

    # Apply Filters
    if filters:
        try:
            filter_dict = json.loads(filters)
            if any(filter_dict.values()):
                conditions = []
                
                # Dynamic Duplicate Check Logic
                # If duplicate_columns are provided, we need to find row_indices that are duplicates based on these columns
                duplicate_indices = set()
                if filter_dict.get("duplicate") and filter_dict.get("duplicate_columns"):
                    dup_cols = filter_dict["duplicate_columns"]
                    # We need to fetch data to check for duplicates. 
                    # Optimization: Fetch only necessary columns from JSON if possible, but here we fetch all raw records for this file.
                    # Warning: Performance impact on large files.
                    all_records = db.query(models.RawRecord).filter(models.RawRecord.file_id == file_id).all()
                    if all_records:
                        data_list = [{"row_index": r.row_index, **r.data} for r in all_records]
                        df = pd.DataFrame(data_list)
                        
                        # Normalize and Check
                        valid_cols = [c for c in dup_cols if c in df.columns]
                        if valid_cols:
                            for col in valid_cols:
                                df[col] = df[col].astype(str).str.strip().str.lower()
                            
                            dupes = df[df.duplicated(subset=valid_cols, keep=False)]
                            duplicate_indices = set(dupes["row_index"].tolist())
                
                # Standard Filters
                if filter_dict.get("duplicate") and not filter_dict.get("duplicate_columns"): 
                    conditions.append(models.ReviewSuggestion.issue_type == "duplicate")
                
                if filter_dict.get("email"): conditions.append(models.ReviewSuggestion.issue_type == "email")
                if filter_dict.get("phone"): conditions.append(models.ReviewSuggestion.issue_type == "phone")
                if filter_dict.get("unify"): conditions.append(models.ReviewSuggestion.issue_type == "company")
                if filter_dict.get("job_normalization"): conditions.append(models.ReviewSuggestion.issue_type == "job_title")
                if filter_dict.get("fake_domain"): conditions.append(models.ReviewSuggestion.issue_type == "domain")

                if conditions or duplicate_indices:
                    # Find relevant row_indices from ReviewSuggestion
                    subquery = db.query(models.ReviewSuggestion.row_index).filter(
                        models.ReviewSuggestion.file_id == file_id,
                        or_(*conditions) if conditions else True
                    ).distinct()
                    
                    # Combine indices
                    # If we have strict duplicate search, we usually want OR Logic with other filters, or AND?
                    # Usually Filters are AND or OR? 
                    # "Review" usually shows logical OR of issues.
                    
                    relevant_indices = set([r[0] for r in subquery.all()]) if conditions else set()
                    relevant_indices.update(duplicate_indices)
                    
                    if relevant_indices:
                        query = query.filter(models.RawRecord.row_index.in_(relevant_indices))
                    else:
                        # Filters active but no matches
                        query = query.filter(models.RawRecord.row_index == -1) # return empty

                elif filter_dict.get("missing_fields"):
                     pass
        except Exception as e:
            print(f"Filter Error: {e}")
            pass

    # Pagination
    total = query.count()
    skip = (page - 1) * page_size
    
    raw_records = query.offset(skip).limit(page_size).all()
    
    # Fetch suggestions for these rows
    if raw_records:
        row_indices = [r.row_index for r in raw_records]
        suggestions = db.query(models.ReviewSuggestion).filter(
            models.ReviewSuggestion.file_id == file_id,
            models.ReviewSuggestion.row_index.in_(row_indices)
        ).all()
    else:
        suggestions = []
    
    # Map suggestions by row_index
    suggestions_map = {}
    for s in suggestions:
        if s.row_index not in suggestions_map:
            suggestions_map[s.row_index] = []
        suggestions_map[s.row_index].append({
            "id": s.id,
            "column": s.column_name,
            "original": s.original_value,
            "suggested": s.suggested_value,
            "confidence": s.confidence_score,
            "type": s.issue_type,
            "status": s.status
        })

    # Merge
    result_data = []
    for r in raw_records:
        row_obj = {
            "row_index": r.row_index,
            **r.data,
            "_suggestions": suggestions_map.get(r.row_index, [])
        }
        result_data.append(row_obj)
        
    return {
        "total": total,
        "data": result_data,
        "page": page,
        "page_size": page_size
    }

# ... (bulk_review_decisions and finalize_cleaning unchanged) ...

@router.get("/{file_id}/cleaned", response_model=schemas.PaginatedRecords)
def get_cleaned_data(
    file_id: int,
    page: int = 1,
    page_size: int = 50,
    filters: Optional[str] = Query(None),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get paginated cleaned data.
    """
    db_file = db.query(models.UploadedFile).filter(
        models.UploadedFile.id == file_id,
        models.UploadedFile.user_id == current_user.id
    ).first()
    
    if not db_file or db_file.status != models.ProcessingStatus.CLEANED:
         raise HTTPException(status_code=404, detail="Cleaned data not found or not ready")

    # Base Query
    query = db.query(models.CleanedRecord).filter(models.CleanedRecord.file_id == file_id)

    # Apply Filters (Same logic as Review to show correlated rows)
    if filters:
        try:
            filter_dict = json.loads(filters)
            if any(filter_dict.values()):
                conditions = []
                if filter_dict.get("duplicate"): conditions.append(models.ReviewSuggestion.issue_type == "duplicate")
                if filter_dict.get("email"): conditions.append(models.ReviewSuggestion.issue_type == "email")
                if filter_dict.get("phone"): conditions.append(models.ReviewSuggestion.issue_type == "phone")
                if filter_dict.get("unify"): conditions.append(models.ReviewSuggestion.issue_type == "company")
                if filter_dict.get("job_normalization"): conditions.append(models.ReviewSuggestion.issue_type == "job_title")
                if filter_dict.get("fake_domain"): conditions.append(models.ReviewSuggestion.issue_type == "domain")

                if conditions:
                    subquery = db.query(models.ReviewSuggestion.row_index).filter(
                        models.ReviewSuggestion.file_id == file_id,
                        or_(*conditions)
                    ).distinct()
                    query = query.filter(models.CleanedRecord.row_index.in_(subquery))
        except:
             pass

    total = query.count()
    skip = (page - 1) * page_size
    
    records = query.offset(skip).limit(page_size).all()
    
    return {
        "total": total,
        "data": [r.data for r in records],
        "page": page,
        "page_size": page_size
    }
