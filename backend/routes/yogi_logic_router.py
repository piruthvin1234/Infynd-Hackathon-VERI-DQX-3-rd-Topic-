from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.data_quality import run_pipeline
from yoge_logics.duplicates import check_duplicates
from yoge_logics.mailcheck import process_emails
from yoge_logics.pverify import process_phone_validation
from yoge_logics.missing_cols import check_missing_cols
from yoge_logics.semantic_llm import check_semantic_inconsistency
from yoge_logics.job_classifier import classify_job_titles
from pydantic import BaseModel
import io
import json
from utils import sanitize_for_json
import uuid
from datetime import datetime
import pandas as pd

router = APIRouter()

@router.post("/unified-clean")
async def unified_clean(
    file: UploadFile = File(...),
    config: str = Form(...) 
):
    """
    Unified cleaning endpoint that uses Yoge Logics based on configuration.
    Config is a JSON string:
    {
        "features": {
            "duplicates": { "enabled": true, "columns": ["email"] },
            "email_validation": { "enabled": true, "column": "email" },
            "phone_validation": { "enabled": true, "column": "phone", "region": "GB" },
            "missing_values": { "enabled": true },
            "consistency_check": { "enabled": true, "column": "job_title" }
        }
    }
    """
    try:
        config_dict = json.loads(config)
        features = config_dict.get("features", {})
        
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents), dtype=str)
        
        # Ensure we don't have NaNs that break things
        df = df.fillna("")
        
        summary_stats = {}

        # Keep track of original
        original_data = json.loads(df.to_json(orient='records'))
        
        # 1. Duplicates
        dup_config = features.get("duplicates", {})
        if dup_config.get("enabled"):
            cols = dup_config.get("columns")
            # If no columns, use all
            subset = cols if cols and len(cols) > 0 else None
            
            # Find duplicates
            # We want to FLAG them, not necessarily remove them in this view?
            # Or assume the 'Data Quality Copilot' expects a report.
            
            # Use yoge_logics function
            duplicates_df = check_duplicates(df, subset=subset)
            
            # Mark duplicates in main df
            if not duplicates_df.empty:
                # Assuming index alignment
                df["is_duplicate"] = df.index.isin(duplicates_df.index)
            else:
                df["is_duplicate"] = False
            
            summary_stats["duplicates"] = {
                "count": len(duplicates_df),
                "columns_checked": subset or "all"
            }
                
        # 2. Email Validation
        email_config = features.get("email_validation", {})
        if email_config.get("enabled"):
            col = email_config.get("column")
            if col and col in df.columns:
                df, _ = process_emails(df, col)
                # Compute stats
                email_counts = df["email_status"].value_counts().to_dict() if "email_status" in df.columns else {}
                summary_stats["email_validation"] = {
                    "breakdown": email_counts,
                    "column": col
                }
            else:
                print(f"Email column {col} not found")

        # 3. Phone Validation
        phone_config = features.get("phone_validation", {})
        if phone_config.get("enabled"):
            col = phone_config.get("column")
            region = phone_config.get("region", "GB")
            if col and col in df.columns:
                df, _ = process_phone_validation(df, col, region)
                phone_counts = df["phone_status"].value_counts().to_dict() if "phone_status" in df.columns else {}
                summary_stats["phone_validation"] = {
                    "breakdown": phone_counts,
                    "column": col,
                    "region": region
                }
            else:
                 print(f"Phone column {col} not found")
                 
        # 4. Missing Field Check
        missing_config = features.get("missing_values", {})
        if missing_config.get("enabled"):
            # This logic just counts them, maybe we can flag rows with missing critical fields?
            # For now, let's just make sure we populate a 'missing_count' per row if needed
            # or relying on missing_cols.py which returns global stats.
            # Let's augment the DF to flag rows with missing values in ANY column or specified columns.
            
            # missing_cols.py returns aggregate stats. Let's adapt it or use it as is?
            # User asked to use missing_cols.py.
            missing_stats = check_missing_cols(df)
            summary_stats["missing_values"] = {
                "by_column": missing_stats,
                "total_missing_cells": sum(missing_stats.values())
            }
            
            # Also calculate per-row missing count for frontend display or filtering
            empty_vals = ["", "nan", "none", "null"]
            df["missing_count"] = df.apply(lambda x: sum(1 for v in x if str(v).strip().lower() in empty_vals), axis=1)
            
        # 5. Title Inconsistency Check (Semantic LLM)
        consistency_config = features.get("consistency_check", {})
        if consistency_config.get("enabled"):
            col = consistency_config.get("column")
            if col and col in df.columns:
                try:
                    df, unified_map = check_semantic_inconsistency(df, col)
                    # Count actual changes
                    changes = {k:v for k,v in unified_map.items() if k != v}
                    summary_stats["consistency_check"] = {
                        "inconsistencies_found": len(changes),
                        "column": col,
                        "mappings": {k:v for k,v in list(changes.items())[:50]} # Top 50 to avoid payload bloat
                    }
                except ValueError:
                    # Fallback if the tuple unpack fails (e.g. if the helper wasn't updated correctly or reloaded)
                    print("Warning: ensure semantic_llm.py returns tuple")
            else:
                 print(f"Consistency check column {col} not found")

        # Prepare response format compatible with Frontend
        # Frontend expects:
        # results: [ { row, company_name, email, email_status, ... } ]
        
        results = []
        for idx, row in df.iterrows():
            item = row.to_dict()
            item["row"] = idx + 1
            
            # normalize for frontend
            # Frontend checks: email_status, phone_status, email_fix, email_confidence, formatted_phone
            
            # Yoge Logic map:
            # mailcheck.py -> sets "email_status" -> VALID, INVALID, TEMP_EMAIL_BLOCKED, MISSING
            # pverify.py -> sets "phone_status" (VALID, INVALID), "phone_clean" (formatted)
            
            if "phone_clean" in item:
                item["formatted_phone"] = item["phone_clean"]
                
            results.append(item)
            
        return sanitize_for_json({
            "results": results, 
            "summary": summary_stats
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class JobAnalysisRequest(BaseModel):
    titles: list[str]

@router.post("/job-analysis")
async def perform_job_analysis(request: JobAnalysisRequest):
    try:
        summary = classify_job_titles(request.titles)
        return {"job_function_summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
