# routes/projects.py
# API routes for Projects and Runs management

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime
import os
import shutil
import uuid
import pandas as pd
import json

import models
import schemas
from database import SessionLocal
from auth import get_password_hash, verify_password, create_access_token
from services.data_quality import run_pipeline
from utils import sanitize_for_json

router = APIRouter(prefix="/projects", tags=["Projects"])

# Directories
UPLOAD_DIR = "data/uploads"
CLEAN_DIR = "data/cleaned"
CHANGELOG_DIR = "data/changelogs"

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============== PROJECT ENDPOINTS ==============

@router.post("/", response_model=schemas.ProjectResponse)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new project/workspace."""
    # Extract user_id from request body
    user_id = project.user_id
    
    # Verify user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create project
    db_project = models.Project(
        name=project.name,
        description=project.description,
        owner_id=user_id,
        config=project.config.model_dump() if project.config else {
            "confidence_threshold": 0.7,
            "auto_apply_high_confidence": True,
            "email_verification_api": False,
            "default_country_code": "IN"
        }
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    return _project_to_response(db_project, db)


@router.get("/", response_model=schemas.ProjectListResponse)
def list_projects(
    user_id: int = Query(..., description="User ID"),
    skip: int = 0,
    limit: int = 20,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """List all projects for a user."""
    query = db.query(models.Project).filter(models.Project.owner_id == user_id)
    
    if not include_inactive:
        query = query.filter(models.Project.is_active == True)
    
    total = query.count()
    projects = query.order_by(desc(models.Project.updated_at)).offset(skip).limit(limit).all()
    
    return {
        "projects": [_project_to_response(p, db) for p in projects],
        "total": total
    }


@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a specific project by ID."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return _project_to_response(project, db)


@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update a project."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == "config" and value:
            setattr(project, key, value.model_dump() if hasattr(value, 'model_dump') else value)
        else:
            setattr(project, key, value)
    
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    
    return _project_to_response(project, db)


@router.delete("/{project_id}")
def delete_project(project_id: int, hard_delete: bool = False, db: Session = Depends(get_db)):
    """Delete a project (soft delete by default)."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if hard_delete:
        # Delete all runs first
        db.query(models.Run).filter(models.Run.project_id == project_id).delete()
        db.delete(project)
    else:
        project.is_active = False
        project.updated_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Project deleted successfully"}


# ============== RUN ENDPOINTS ==============

@router.get("/{project_id}/runs", response_model=schemas.RunListResponse)
def list_runs(
    project_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List all runs for a project."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    query = db.query(models.Run).filter(models.Run.project_id == project_id)
    total = query.count()
    runs = query.order_by(desc(models.Run.created_at)).offset(skip).limit(limit).all()
    
    return {
        "runs": [_run_to_response(r) for r in runs],
        "total": total,
        "project_name": project.name
    }


@router.get("/{project_id}/runs/{run_id}", response_model=schemas.RunResponse)
def get_run(project_id: int, run_id: int, db: Session = Depends(get_db)):
    """Get a specific run."""
    run = db.query(models.Run).filter(
        models.Run.id == run_id,
        models.Run.project_id == project_id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return _run_to_response(run)


@router.post("/{project_id}/runs/upload")
async def create_run_with_upload(
    project_id: int,
    file: UploadFile = File(...),
    mode: str = Query("auto", description="Processing mode: 'auto' or 'review'"),
    run_by: str = Query(None, description="User email who ran this"),
    db: Session = Depends(get_db)
):
    """
    Upload a file and create a new run in the project.
    This is the main entry point for data cleaning within a project.
    """
    # Verify project exists
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Get next run number for this project
        last_run = db.query(models.Run).filter(
            models.Run.project_id == project_id
        ).order_by(desc(models.Run.run_number)).first()
        
        next_run_number = (last_run.run_number + 1) if last_run else 1
        
        # Save uploaded file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"project_{project_id}_run_{next_run_number}_{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(file_path)
        
        # Get project config
        config = project.config or {}
        auto_apply = mode == "auto" and config.get("auto_apply_high_confidence", True)
        verify_emails_api = config.get("email_verification_api", False)
        
        # Run the pipeline
        cleaned_df, report = run_pipeline(
            file_path, 
            auto_apply=auto_apply,
            verify_emails_api=verify_emails_api
        )
        
        if cleaned_df is None:
            raise HTTPException(status_code=400, detail=report.get("error", "Processing failed"))
        
        # Save cleaned file
        cleaned_filename = f"cleaned_{unique_filename}"
        cleaned_path = os.path.join(CLEAN_DIR, cleaned_filename)
        cleaned_df.to_csv(cleaned_path, index=False)
        
        # Calculate issue breakdown
        issue_breakdown = {
            "invalid_emails": report.get("verification_stats", {}).get("email_invalid", 0),
            "invalid_phones": report.get("verification_stats", {}).get("phone_invalid", 0),
            "missing_fields": 0,
            "duplicates": report.get("duplicates_found", 0),
            "company_fixes": len([c for c in report.get("changes", []) if c.get("fix_type") == "company"]),
            "domain_fixes": len([c for c in report.get("changes", []) if c.get("fix_type") == "domain"]),
            "job_title_fixes": len([c for c in report.get("changes", []) if c.get("fix_type") == "job_title"])
        }
        
        # Create run record
        db_run = models.Run(
            run_number=next_run_number,
            project_id=project_id,
            file_name=file.filename,
            file_size=file_size,
            row_count=report.get("rows_processed", 0),
            column_count=len(report.get("columns", [])),
            columns=report.get("columns", []),
            quality_score_before=0.0,  # Could calculate from original
            quality_score_after=report.get("quality_score", 0.0),
            total_issues=report.get("issues_found", 0),
            total_fixes=report.get("fixes_applied", 0),
            issue_breakdown=issue_breakdown,
            total_changes=report.get("total_changes", 0),
            auto_accepted_count=report.get("auto_accepted_count", 0),
            needs_review_count=report.get("needs_review_count", 0),
            manual_overrides=0,
            mode=mode,
            original_file_path=file_path,
            cleaned_file_path=cleaned_path,
            status="completed" if mode == "auto" else "pending_review",
            report_data=report,
            verification_stats=report.get("verification_stats", {}),
            completed_at=datetime.utcnow() if mode == "auto" else None,
            run_by=run_by
        )
        
        db.add(db_run)
        
        # Update project timestamp
        project.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_run)
        
        return {
            "run": _run_to_response(db_run),
            "report": report,
            "session_id": str(db_run.id) if mode == "review" else None
        }
        
    except Exception as e:
        print(f"ERROR in create_run_with_upload: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{project_id}/runs/{run_id}/notes")
def update_run_notes(
    project_id: int,
    run_id: int,
    notes_update: schemas.RunUpdateNotes,
    db: Session = Depends(get_db)
):
    """Update notes for a run."""
    run = db.query(models.Run).filter(
        models.Run.id == run_id,
        models.Run.project_id == project_id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    run.notes = notes_update.notes
    db.commit()
    
    return {"message": "Notes updated successfully"}


@router.delete("/{project_id}/runs/{run_id}")
def delete_run(
    project_id: int, 
    run_id: int, 
    db: Session = Depends(get_db)
):
    """Delete a specific run."""
    run = db.query(models.Run).filter(
        models.Run.id == run_id,
        models.Run.project_id == project_id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Optional: Delete associated physical files if they exist
    if run.original_file_path and os.path.exists(run.original_file_path):
        try:
            os.remove(run.original_file_path)
        except OSError:
            pass
            
    if run.cleaned_file_path and os.path.exists(run.cleaned_file_path):
        try:
            os.remove(run.cleaned_file_path)
        except OSError:
            pass
    
    db.delete(run)
    db.commit()
    
    return {"message": "Run deleted successfully"}


@router.get("/{project_id}/runs/{run_id}/download")
def download_run_file(
    project_id: int, 
    run_id: int, 
    type: str = Query("cleaned", enum=["original", "cleaned"]),
    db: Session = Depends(get_db)
):
    """Download the original or cleaned file for a run."""
    run = db.query(models.Run).filter(
        models.Run.id == run_id,
        models.Run.project_id == project_id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    file_path = run.cleaned_file_path if type == "cleaned" else run.original_file_path
    
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    filename = os.path.basename(file_path)
    return FileResponse(
        path=file_path, 
        filename=filename, 
        media_type='text/csv'
    )


@router.get("/{project_id}/runs/{run_id}/data")
def get_run_data_preview(
    project_id: int,
    run_id: int,
    type: str = Query("cleaned", enum=["original", "cleaned"]),
    filters: Optional[str] = Query(None),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get a JSON preview of the data for a run with optional filtering.
    Filters provided as a JSON string.
    """
    run = db.query(models.Run).filter(
        models.Run.id == run_id,
        models.Run.project_id == project_id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    file_path = run.cleaned_file_path if type == "cleaned" else run.original_file_path
    
    if not file_path or not os.path.exists(file_path):
        # Fallback if cleaned doesn't exist yet but requested (shouldn't happen for completed runs)
        if type == "cleaned" and run.original_file_path and os.path.exists(run.original_file_path):
             return {"columns": [], "data": [], "total": 0, "message": "Cleaned file not found"}
        raise HTTPException(status_code=404, detail="File not found on server")
    
    try:
        # Read CSV
        # We assume headers exist
        df = pd.read_csv(file_path)
        
        # Apply Filters if present
        if filters:
            try:
                filter_dict = json.loads(filters)
                # filters: { duplicate, email, phone, unify, job_normalization, fake_domain, missing_fields }
                
                # Check if any filter is active (true)
                if any(filter_dict.values()):
                    # Use run.report_data to find relevant rows
                    report = run.report_data or {}
                    changes = report.get("changes", [])
                    
                    relevant_indices = set()
                    
                    # 1. Filter by Changes (Metadata)
                    for c in changes:
                        ft = c.get("fix_type")
                        
                        is_relevant = False
                        if filter_dict.get("duplicate") and ft == "duplicate": is_relevant = True
                        elif filter_dict.get("email") and ft == "email": is_relevant = True
                        elif filter_dict.get("phone") and ft == "phone": is_relevant = True
                        elif filter_dict.get("unify") and ft == "company": is_relevant = True
                        elif filter_dict.get("job_normalization") and ft == "job_title": is_relevant = True
                        elif filter_dict.get("fake_domain") and ft == "domain": is_relevant = True
                        
                        if is_relevant:
                            relevant_indices.add(c["row_index"])

                    # Dynamic Duplicate Check
                    if filter_dict.get("duplicate") and filter_dict.get("duplicate_columns"):
                        dup_cols = filter_dict["duplicate_columns"]
                        # Verify columns exist
                        valid_cols = [c for c in dup_cols if c in df.columns]
                        if valid_cols:
                            # Normalize for comparison
                            temp_df = df.copy()
                            for col in valid_cols:
                                temp_df[col] = temp_df[col].astype(str).str.strip().str.lower()
                            
                            duplicates = temp_df[temp_df.duplicated(subset=valid_cols, keep=False)]
                            relevant_indices.update(duplicates.index.tolist())
                            
                    # 2. Filter by Missing Fields (Data Scan)
                    if filter_dict.get("missing_fields"):
                        # Find rows with any null/empty values
                        # Replace empty strings with NaN for consistent check
                        missing_mask = df.replace(r'^\s*$', float('nan'), regex=True).isnull().any(axis=1)
                        missing_indices = df.index[missing_mask].tolist()
                        relevant_indices.update(missing_indices)
                    
                    # Apply filter to DataFrame
                    # We only keep rows that matched AT LEAST ONE selected filter
                    df = df[df.index.isin(relevant_indices)]
                    
            except json.JSONDecodeError:
                pass # Ignore malformed filter JSON
        
        # Pagination
        total_rows = len(df)
        df_page = df.iloc[offset : offset + limit]
        
        records = df_page.to_dict(orient='records')
        columns = list(df.columns)
        
        return sanitize_for_json({
            "total": total_rows,
            "columns": columns,
            "data": records,
            "offset": offset,
            "limit": limit
        })
    except Exception as e:
        print(f"Error reading CSV: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read data: {str(e)}")


@router.get("/{project_id}/runs/{run_id}/job-summary")
def get_run_job_summary(
    project_id: int,
    run_id: int,
    db: Session = Depends(get_db)
):
    """Get the job function summary for a run."""
    run = db.query(models.Run).filter(
        models.Run.id == run_id,
        models.Run.project_id == project_id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    report = run.report_data or {}
    summary = report.get("job_function_summary", [])
    
    # If summary is missing (legacy runs or failed extraction), try to compute it on the fly
    if not summary and run.cleaned_file_path and os.path.exists(run.cleaned_file_path):
        try:
            df = pd.read_csv(run.cleaned_file_path)
            
            # Identify job column
            job_col = None
            for col in df.columns:
                if 'job' in col.lower() or 'title' in col.lower():
                    job_col = col
                    break
            
            if job_col:
                # We need the map_job_title function
                from src.job_mapper import map_job_title
                
                summary_dict = {}
                for idx, row in df.iterrows():
                    # Check if role_function exists, otherwise map it
                    if "role_function" in df.columns:
                        role = str(row.get("role_function", "Other"))
                    else:
                        role, _ = map_job_title(str(row.get(job_col, "")))
                        
                    title = str(row.get(job_col, "Unknown"))
                    
                    if role not in summary_dict:
                        summary_dict[role] = {"titles": set(), "count": 0}
                    
                    summary_dict[role]["titles"].add(title)
                    summary_dict[role]["count"] += 1
                
                for role, data in summary_dict.items():
                    summary.append({
                        "job_function": role,
                        "job_titles": sorted(list(data["titles"])),
                        "count": data["count"]
                    })
                
                summary.sort(key=lambda x: x["count"], reverse=True)
        except Exception as e:
            print(f"Failed to compute on-the-fly summary: {e}")

    return {"job_function_summary": summary}


# ============== COMPARISON & TIMELINE ==============

@router.post("/{project_id}/compare", response_model=schemas.RunComparisonResponse)
def compare_runs(
    project_id: int,
    comparison: schemas.RunComparisonRequest,
    db: Session = Depends(get_db)
):
    """Compare two runs within a project."""
    run1 = db.query(models.Run).filter(
        models.Run.id == comparison.run_id_1,
        models.Run.project_id == project_id
    ).first()
    
    run2 = db.query(models.Run).filter(
        models.Run.id == comparison.run_id_2,
        models.Run.project_id == project_id
    ).first()
    
    if not run1 or not run2:
        raise HTTPException(status_code=404, detail="One or both runs not found")
    
    # Calculate comparison metrics
    metrics = []
    
    # Quality Score
    metrics.append({
        "metric_name": "Quality Score",
        "run_1_value": run1.quality_score_after,
        "run_2_value": run2.quality_score_after,
        "difference": round(run2.quality_score_after - run1.quality_score_after, 2),
        "improvement": run2.quality_score_after > run1.quality_score_after
    })
    
    # Issues Found
    metrics.append({
        "metric_name": "Issues Found",
        "run_1_value": run1.total_issues,
        "run_2_value": run2.total_issues,
        "difference": run2.total_issues - run1.total_issues,
        "improvement": run2.total_issues < run1.total_issues
    })
    
    # Invalid Emails %
    run1_email_pct = (run1.issue_breakdown.get("invalid_emails", 0) / max(run1.row_count, 1)) * 100
    run2_email_pct = (run2.issue_breakdown.get("invalid_emails", 0) / max(run2.row_count, 1)) * 100
    metrics.append({
        "metric_name": "Invalid Emails %",
        "run_1_value": round(run1_email_pct, 2),
        "run_2_value": round(run2_email_pct, 2),
        "difference": round(run2_email_pct - run1_email_pct, 2),
        "improvement": run2_email_pct < run1_email_pct
    })
    
    # Invalid Phones %
    run1_phone_pct = (run1.issue_breakdown.get("invalid_phones", 0) / max(run1.row_count, 1)) * 100
    run2_phone_pct = (run2.issue_breakdown.get("invalid_phones", 0) / max(run2.row_count, 1)) * 100
    metrics.append({
        "metric_name": "Invalid Phones %",
        "run_1_value": round(run1_phone_pct, 2),
        "run_2_value": round(run2_phone_pct, 2),
        "difference": round(run2_phone_pct - run1_phone_pct, 2),
        "improvement": run2_phone_pct < run1_phone_pct
    })
    
    # Manual Overrides
    metrics.append({
        "metric_name": "Manual Overrides",
        "run_1_value": run1.manual_overrides,
        "run_2_value": run2.manual_overrides,
        "difference": run2.manual_overrides - run1.manual_overrides,
        "improvement": True  # More overrides means more human oversight
    })
    
    # Fixes Applied
    metrics.append({
        "metric_name": "Fixes Applied",
        "run_1_value": run1.total_fixes,
        "run_2_value": run2.total_fixes,
        "difference": run2.total_fixes - run1.total_fixes,
        "improvement": run2.total_fixes >= run1.total_fixes
    })
    
    # Generate summary
    improvements = sum(1 for m in metrics if m["improvement"])
    if improvements >= 4:
        summary = f"Run #{run2.run_number} shows significant improvement over Run #{run1.run_number}"
    elif improvements >= 2:
        summary = f"Run #{run2.run_number} shows mixed results compared to Run #{run1.run_number}"
    else:
        summary = f"Run #{run2.run_number} shows some regression compared to Run #{run1.run_number}"
    
    return {
        "run_1": _run_to_response(run1),
        "run_2": _run_to_response(run2),
        "metrics": metrics,
        "summary": summary
    }


@router.get("/{project_id}/timeline", response_model=schemas.ProjectTimelineResponse)
def get_project_timeline(project_id: int, db: Session = Depends(get_db)):
    """Get quality score timeline for a project - for charts."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    runs = db.query(models.Run).filter(
        models.Run.project_id == project_id,
        models.Run.status == "completed"
    ).order_by(models.Run.run_number).all()
    
    data_points = []
    for run in runs:
        data_points.append({
            "run_number": run.run_number,
            "run_id": run.id,
            "created_at": run.created_at,
            "quality_score": run.quality_score_after,
            "issues_found": run.total_issues,
            "fixes_applied": run.total_fixes
        })
    
    # Calculate average and trend
    if len(data_points) >= 2:
        scores = [dp["quality_score"] for dp in data_points]
        avg_score = sum(scores) / len(scores)
        
        # Simple trend: compare last 3 to first 3
        first_half = scores[:len(scores)//2] if len(scores) >= 4 else scores[:1]
        second_half = scores[len(scores)//2:] if len(scores) >= 4 else scores[-1:]
        
        first_avg = sum(first_half) / max(len(first_half), 1)
        second_avg = sum(second_half) / max(len(second_half), 1)
        
        if second_avg > first_avg + 2:
            trend = "improving"
        elif second_avg < first_avg - 2:
            trend = "declining"
        else:
            trend = "stable"
    else:
        avg_score = data_points[0]["quality_score"] if data_points else 0
        trend = "stable"
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "data_points": data_points,
        "average_quality_score": round(avg_score, 2),
        "quality_trend": trend
    }


# ============== HELPER FUNCTIONS ==============

def _project_to_response(project: models.Project, db: Session) -> dict:
    """Convert Project model to response dict."""
    run_count = db.query(models.Run).filter(models.Run.project_id == project.id).count()
    
    latest_run = db.query(models.Run).filter(
        models.Run.project_id == project.id,
        models.Run.status == "completed"
    ).order_by(desc(models.Run.created_at)).first()
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "owner_id": project.owner_id,
        "config": project.config or {},
        "custom_rules": project.custom_rules or [],
        "field_mappings": project.field_mappings or {},
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "is_active": project.is_active,
        "run_count": run_count,
        "latest_quality_score": latest_run.quality_score_after if latest_run else None
    }


def _run_summary_to_response(run: models.Run) -> dict:
    """Convert Run model to summary response dict (excludes heavy report_data)."""
    return {
        "id": run.id,
        "run_number": run.run_number,
        "project_id": run.project_id,
        "file_name": run.file_name,
        "file_size": run.file_size,
        "row_count": run.row_count,
        "column_count": run.column_count,
        "columns": run.columns or [],
        "quality_score_before": run.quality_score_before or 0,
        "quality_score_after": run.quality_score_after or 0,
        "total_issues": run.total_issues or 0,
        "total_fixes": run.total_fixes or 0,
        "issue_breakdown": run.issue_breakdown or {},
        "total_changes": run.total_changes or 0,
        "auto_accepted_count": run.auto_accepted_count or 0,
        "needs_review_count": run.needs_review_count or 0,
        "manual_overrides": run.manual_overrides or 0,
        "mode": run.mode,
        "status": run.status,
        "verification_stats": run.verification_stats or {},
        "created_at": run.created_at,
        "completed_at": run.completed_at,
        "run_by": run.run_by,
        "notes": run.notes
        # report_data excluded
    }


def _run_to_response(run: models.Run) -> dict:
    """Convert Run model to response dict."""
    return {
        "id": run.id,
        "run_number": run.run_number,
        "project_id": run.project_id,
        "file_name": run.file_name,
        "file_size": run.file_size,
        "row_count": run.row_count,
        "column_count": run.column_count,
        "columns": run.columns or [],
        "quality_score_before": run.quality_score_before or 0,
        "quality_score_after": run.quality_score_after or 0,
        "total_issues": run.total_issues or 0,
        "total_fixes": run.total_fixes or 0,
        "issue_breakdown": run.issue_breakdown or {},
        "total_changes": run.total_changes or 0,
        "auto_accepted_count": run.auto_accepted_count or 0,
        "needs_review_count": run.needs_review_count or 0,
        "manual_overrides": run.manual_overrides or 0,
        "mode": run.mode,
        "status": run.status,
        "verification_stats": run.verification_stats or {},
        "created_at": run.created_at,
        "completed_at": run.completed_at,
        "run_by": run.run_by,
        "notes": run.notes,
        "report_data": run.report_data or {}
    }
