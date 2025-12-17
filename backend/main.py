from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import shutil
import os
import json
from datetime import datetime
import models
import schemas
import auth
from database import SessionLocal, engine
from services.data_quality import run_pipeline
from routes.projects import router as projects_router
from routes.files import router as files_router
from routes.verification import router as verification_router
import pandas as pd
from utils import sanitize_for_json

# Create Tables
models.Base.metadata.create_all(bind=engine)


# DataGuardian AI API
app = FastAPI(title="DataGuardian AI")

# Include routers
app.include_router(projects_router, prefix="/api")
app.include_router(files_router)
app.include_router(verification_router)
from routes.upload import router as upload_csv_router
app.include_router(upload_csv_router, prefix="/api")

# CORS - Allow frontend origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

UPLOAD_DIR = "data/uploads"
CLEAN_DIR = "data/cleaned"
CHANGELOG_DIR = "data/changelogs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CLEAN_DIR, exist_ok=True)
os.makedirs(CHANGELOG_DIR, exist_ok=True)

# In-memory storage for pending reviews (in production, use database)
pending_reviews = {}

# Pydantic models for review workflow
class ChangeAction(BaseModel):
    change_id: str
    action: str  # "accept", "reject", "override"
    override_value: Optional[str] = None
    reason: Optional[str] = None
    modified_by: Optional[str] = None

class ApplyChangesRequest(BaseModel):
    session_id: str
    changes: List[ChangeAction]

class ChangeLogEntry(BaseModel):
    change_id: str
    row_index: int
    column: str
    original_value: str
    final_value: str
    action: str
    reason: Optional[str] = None
    modified_by: Optional[str] = None
    timestamp: str

@app.post("/auth/signup")
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = auth.get_password_hash(user.password)
        new_user = models.User(email=user.email, name=user.name, password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        access_token = auth.create_access_token(data={"sub": new_user.email})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@app.get("/auth/me")
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current logged-in user info."""
    try:
        payload = auth.decode_token(token)
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

@app.post("/upload-and-clean/")
async def upload_and_clean(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
        # Save uploaded file
        file_path = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process the file (auto-apply mode)
        cleaned_df, report = run_pipeline(file_path, auto_apply=True)
        
        if cleaned_df is None:
            error_msg = report.get("error", "Could not process file")
            raise HTTPException(status_code=400, detail=error_msg)

        # Save cleaned file
        cleaned_path = f"{CLEAN_DIR}/cleaned_{file.filename}"
        cleaned_df.to_csv(cleaned_path, index=False)
        
        # Generate session ID for review workflow
        import uuid
        session_id = str(uuid.uuid4())
        
        # Store for review
        pending_reviews[session_id] = {
            "original_file": file_path,
            "cleaned_file": cleaned_path,
            "changes": report.get("changes", []),
            "original_data": report.get("original_data", []),
            "cleaned_data": report.get("cleaned_data", []),
            "columns": report.get("columns", []),
            "filename": file.filename
        }

        return sanitize_for_json({
            "message": "File cleaned successfully",
            "qa_report": report,
            "cleaned_file_path": cleaned_path,
            "session_id": session_id
        })
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/upload-for-review/")
async def upload_for_review(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    """Upload file and analyze without auto-applying changes - for human-in-the-loop review"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
        file_path = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process without auto-applying changes
        cleaned_df, report = run_pipeline(file_path, auto_apply=False)
        
        if cleaned_df is None:
            error_msg = report.get("error", "Could not process file")
            raise HTTPException(status_code=400, detail=error_msg)

        import uuid
        session_id = str(uuid.uuid4())
        
        # Store for review
        pending_reviews[session_id] = {
            "original_file": file_path,
            "changes": report.get("changes", []),
            "original_data": report.get("original_data", []),
            "cleaned_data": report.get("cleaned_data", []),
            "columns": report.get("columns", []),
            "filename": file.filename
        }

        return sanitize_for_json({
            "message": "File analyzed - ready for review",
            "session_id": session_id,
            "qa_report": report
        })
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload for review error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/review/{session_id}")
async def get_review_data(
    session_id: str, 
    filters: Optional[str] = Query(None),
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    """Get pending review data for a session with optional filtering."""
    review = None
    
    # 1. Check in-memory pending reviews (Legacy/Direct Upload)
    if session_id in pending_reviews:
        review = pending_reviews[session_id].copy()
    
    # 2. Check Database for Project Runs
    else:
        try:
            run_id = int(session_id)
            run = db.query(models.Run).filter(models.Run.id == run_id).first()
            
            if run and run.report_data:
                report = run.report_data
                review = {
                    "changes": report.get("changes", []),
                    "original_data": report.get("original_data", []),
                    "cleaned_data": report.get("cleaned_data", []),
                    "columns": report.get("columns", []),
                    "filename": run.file_name
                }
        except ValueError:
            pass # Not an integer
            
    if not review:
        raise HTTPException(status_code=404, detail="Review session not found")
        
    # Apply Filters
    if filters:
        try:
            filter_dict = json.loads(filters)
            if any(filter_dict.values()):
                changes = review["changes"]
                original_data = review["original_data"]
                
                filtered_changes = []
                relevant_indices = set()
                
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
                        filtered_changes.append(c)
                        relevant_indices.add(c["row_index"])
                
                # Update review object
                review["changes"] = filtered_changes
                
                # Filter original data rows if they are list of dicts (with 'row_index' implied by position?)
                # original_data is usually a list of records. Index corresponds to row_index.
                # However, original_data might be needed for context even if no change?
                # "Review Page: Filters control which issues... displayed"
                # If we filter changes, we should probably filter data view too?
                # But implementation of ReviewUI might depend on array index.
                # Let's KEEP original_data intact because changing indices might break frontend 
                # if it uses list index as row index.
                # Or filter it but re-map indices? 
                # Re-reading: "Filters control which issues and suggestions are displayed".
                # Filtering 'changes' list suffices for the list of suggestions.
                # The data grid might show all data or valid data.
                pass
                
        except json.JSONDecodeError:
            pass
            
    return sanitize_for_json({
        "session_id": session_id,
        "changes": review["changes"],
        "original_data": review["original_data"],
        "cleaned_data": review.get("cleaned_data", []),
        "columns": review["columns"],
        "filename": review["filename"]
    })

@app.post("/review/{session_id}/apply")
async def apply_review_changes(
    session_id: str, 
    request: ApplyChangesRequest, 
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Apply reviewed changes to create final cleaned file (supports both in-memory and database Runs)"""
    
    review_source = None # 'memory' or 'db'
    run_obj = None
    
    # 1. Resolve Session Source
    if session_id in pending_reviews:
        review_source = 'memory'
        review = pending_reviews[session_id]
        original_file = review["original_file"]
        filename = review["filename"]
        # Use existing changes from source of truth
        stored_changes = review["changes"]
        # Define output path
        cleaned_path = f"{CLEAN_DIR}/reviewed_{filename}"
        
    else:
        # Check DB
        try:
            run_id = int(session_id)
            run_obj = db.query(models.Run).filter(models.Run.id == run_id).first()
            if run_obj and run_obj.original_file_path:
                review_source = 'db'
                original_file = run_obj.original_file_path
                filename = run_obj.file_name
                stored_changes = run_obj.report_data.get("changes", [])
                cleaned_path = run_obj.cleaned_file_path or f"{CLEAN_DIR}/cleaned_{filename}"
            else:
                 raise HTTPException(status_code=404, detail="Run not found or missing file")
        except ValueError:
             raise HTTPException(status_code=404, detail="Review session not found")

    try:
        # Load original data
        if not os.path.exists(original_file):
             raise HTTPException(status_code=404, detail="Original file invalid or missing")
             
        df = pd.read_csv(original_file)
        
        # Build a map of changes by ID
        changes_map = {c["id"]: c for c in stored_changes}
        
        # Process actions and track change log
        change_log = []
        
        for action in request.changes:
            if action.change_id not in changes_map:
                continue
            
            change = changes_map[action.change_id]
            row_idx = change["row_index"]
            col = change["column"]
            
            log_entry = {
                "change_id": action.change_id,
                "row_index": row_idx,
                "column": col,
                "original_value": change["original_value"],
                "suggested_value": change["cleaned_value"],
                "action": action.action,
                "reason": action.reason,
                "modified_by": action.modified_by,
                "timestamp": datetime.now().isoformat()
            }
            
            if action.action == "accept":
                df.at[row_idx, col] = change["cleaned_value"]
                log_entry["final_value"] = change["cleaned_value"]
            elif action.action == "override":
                df.at[row_idx, col] = action.override_value
                log_entry["final_value"] = action.override_value
            elif action.action == "reject":
                # Keep original value
                log_entry["final_value"] = change["original_value"]
                # Revert change in DF if it was ALREADY modified? 
                # Note: df is read from ORIGINAL file, so it starts with original values.
                # Only 'accept' or 'override' modifies it. 'reject' does nothing to df.
                pass
            
            change_log.append(log_entry)
        
        # Save cleaned file
        df.to_csv(cleaned_path, index=False)
        
        # Save change log
        log_path = f"{CHANGELOG_DIR}/changelog_{session_id}.json"
        with open(log_path, "w") as f:
            json.dump(change_log, f, indent=2)
        
        # Finalization based on source
        if review_source == 'memory':
            del pending_reviews[session_id]
        elif review_source == 'db' and run_obj:
            run_obj.status = "completed"
            run_obj.completed_at = datetime.utcnow()
            run_obj.changelog_path = log_path
            # Update metrics - strictly we accept what user did
            accepted_count = len([a for a in request.changes if a.action == "accept"])
            manual_count = len([a for a in request.changes if a.action == "override"])
            
            run_obj.total_fixes = accepted_count + manual_count
            run_obj.manual_overrides = manual_count
            
            db.commit()
        
        return sanitize_for_json({
            "message": "Changes applied successfully",
            "cleaned_file_path": cleaned_path,
            "changelog_path": log_path,
            "changes_applied": len([a for a in request.changes if a.action == "accept"]),
            "changes_overridden": len([a for a in request.changes if a.action == "override"]),
            "changes_rejected": len([a for a in request.changes if a.action == "reject"])
        })
    except Exception as e:
        print(f"Apply changes error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error applying changes: {str(e)}")

@app.get("/changelog/{session_id}")
async def get_changelog(session_id: str, token: str = Depends(oauth2_scheme)):
    """Get change log for a completed review"""
    log_path = f"{CHANGELOG_DIR}/changelog_{session_id}.json"
    
    if not os.path.exists(log_path):
        raise HTTPException(status_code=404, detail="Change log not found")
    
    with open(log_path, "r") as f:
        change_log = json.load(f)
    
    return sanitize_for_json({"session_id": session_id, "changelog": change_log})

@app.get("/review/{session_id}/stats")
async def get_review_stats(session_id: str, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get statistics for the heptagonal chart"""
    changes = []
    
    # 1. Check in-memory pending reviews
    if session_id in pending_reviews:
        changes = pending_reviews[session_id]["changes"]
    else:
        # 2. Check Database
        try:
            run_id = int(session_id)
            run = db.query(models.Run).filter(models.Run.id == run_id).first()
            if run and run.report_data:
                changes = run.report_data.get("changes", [])
            else:
                 raise HTTPException(status_code=404, detail="Review session not found")
        except ValueError:
            raise HTTPException(status_code=404, detail="Review session not found")

    if not changes:
        return [
            { "label": "Potential Duplicates", "value": 0 },
            { "label": "Pending Reviews", "value": 0 },
            { "label": "Total Suggestions", "value": 0 },
            { "label": "Map Job Titles", "value": 0 },
            { "label": "Avg Confidence", "value": "0%" },
            { "label": "Review Progress", "value": "0%" },
            { "label": "Remaining Issues", "value": 0 }
        ]

    # Get total rows for context
    total_rows = 0
    if session_id in pending_reviews:
        total_rows = len(pending_reviews[session_id].get("original_data", []))
    elif run and run.report_data:
        total_rows = len(run.report_data.get("original_data", []))
        
    total_changes = len(changes)
    
    # Metrics calculation
    
    # 1. Potential Duplicates (Placeholder logic)
    # Using a dummy logic or 0 if not actually implemented in pipeline yet
    potential_duplicates_count = 0 
    potential_duplicates_pct = 0
    
    # 2. Pending Reviews
    # Relative to total changes
    invalid_count = len([c for c in changes if c.get("status") == 'needs_review'])
    pending_reviews_pct = round((invalid_count / total_changes * 100)) if total_changes else 0
    
    # 3. Total Suggestions
    # Relative to total rows (how much of the dataset needed fixing)
    suggested_count = total_changes
    suggestions_pct = round((suggested_count / total_rows * 100)) if total_rows else 0
    
    # 4. Map Job Titles
    # Relative to total changes
    map_job_titles_count = len([c for c in changes if c.get("fix_type") == 'job_title'])
    job_titles_pct = round((map_job_titles_count / total_changes * 100)) if total_changes else 0
    
    # 5. Avg Confidence
    total_confidence = sum(float(c.get("confidence", 0)) for c in changes)
    avg_confidence = round((total_confidence / total_changes) * 100) if total_changes else 0
    
    # 6. Review Progress
    # Handled means it's not 'needs_review'
    handled_count = len([c for c in changes if c.get("status") in ['accepted', 'auto_accepted', 'overridden', 'rejected']])
    quality_score = round((handled_count / total_changes) * 100) if total_changes else 0
    
    # 7. Remaining Issues
    # Same as pending reviews
    issue_count = invalid_count
    issues_pct = pending_reviews_pct

    return [
        { "label": "Potential Duplicates", "value": f"{potential_duplicates_pct}%" },
        { "label": "Pending Reviews", "value": f"{pending_reviews_pct}%" },
        { "label": "Total Suggestions", "value": f"{suggestions_pct}%" },
        { "label": "Map Job Titles", "value": f"{job_titles_pct}%" },
        { "label": "Avg Confidence", "value": f"{avg_confidence}%" },
        { "label": "Review Progress", "value": f"{quality_score}%" },
        { "label": "Remaining Issues", "value": f"{issues_pct}%" }
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
