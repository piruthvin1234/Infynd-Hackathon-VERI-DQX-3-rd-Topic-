import pandas as pd
from src.validators import is_valid_email, is_missing
from src.corrector import suggest_domain_fix, suggest_company_fix, standardize_job_title, fix_invalid_email
from src.job_mapper import map_job_title
from src.scorer import calculate_quality_score
from src.phone_verification import validate_phone, fix_phone_number
from src.email_verification import validate_email, fix_email
import uuid
from datetime import datetime


def run_pipeline(file_path, auto_apply=True, verify_emails_api=False):
    """
    Run the data quality pipeline.
    
    Args:
        file_path: Path to the CSV file
        auto_apply: If True, auto-apply high confidence fixes. If False, only collect changes for review.
        verify_emails_api: If True, use external API to verify email existence (slower but more accurate)
    
    Returns:
        tuple: (cleaned_df, report_dict)
    """
    try:
        # Handle malformed CSVs with inconsistent columns
        df = pd.read_csv(file_path, on_bad_lines='warn')
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return None, {"error": f"Invalid CSV: {str(e)}"}

    if df.empty:
        return None, {"error": "CSV file is empty"}

    # Store original dataframe for comparison
    original_df = df.copy()
    
    issues = 0
    fixes = 0
    
    # Track all changes for human-in-the-loop review
    changes = []
    
    # Track verification stats
    phone_verified = 0
    phone_invalid = 0
    email_verified = 0
    email_invalid = 0
    
    # Get column names for dynamic detection
    columns_lower = {col.lower(): col for col in df.columns}

    for idx, row in df.iterrows():
        row_changes = []
        
        # ========== 1. COMPANY NAME FIX ==========
        company_col = None
        for col in df.columns:
            if 'company' in col.lower() or 'name' in col.lower():
                company_col = col
                break
        
        if company_col:
            original_company = str(row.get(company_col, ""))
            if original_company and original_company.lower() != "nan":
                fixed_company, conf = suggest_company_fix(original_company)
                if fixed_company != original_company:
                    change = {
                        "id": str(uuid.uuid4()),
                        "row_index": int(idx),
                        "column": company_col,
                        "original_value": original_company,
                        "cleaned_value": fixed_company,
                        "confidence": float(conf),
                        "fix_type": "company",
                        "status": "auto_accepted" if conf >= 0.7 and auto_apply else "needs_review",
                        "applied": conf >= 0.7 and auto_apply,
                        "timestamp": datetime.now().isoformat(),
                        "manual_override": None,
                        "override_reason": None,
                        "modified_by": None
                    }
                    changes.append(change)
                    
                    if conf >= 0.7 and auto_apply:
                        df.at[idx, company_col] = fixed_company
                        fixes += 1

        # ========== 2. DOMAIN FIX ==========
        domain_col = None
        for col in df.columns:
            if 'domain' in col.lower():
                domain_col = col
                break
        
        current_domain = ""
        if domain_col:
            current_domain = str(row.get(domain_col, ""))
            if current_domain and current_domain.lower() != "nan":
                fixed_domain, conf = suggest_domain_fix(current_domain)
                if fixed_domain != current_domain:
                    change = {
                        "id": str(uuid.uuid4()),
                        "row_index": int(idx),
                        "column": domain_col,
                        "original_value": current_domain,
                        "cleaned_value": fixed_domain,
                        "confidence": float(conf),
                        "fix_type": "domain",
                        "status": "auto_accepted" if conf > 0.7 and auto_apply else "needs_review",
                        "applied": conf > 0.7 and auto_apply,
                        "timestamp": datetime.now().isoformat(),
                        "manual_override": None,
                        "override_reason": None,
                        "modified_by": None
                    }
                    changes.append(change)
                    
                    if conf > 0.7 and auto_apply:
                        df.at[idx, domain_col] = fixed_domain
                        fixes += 1
                    current_domain = fixed_domain if conf > 0.7 else current_domain

        # ========== 3. PHONE NUMBER VERIFICATION ==========
        phone_col = None
        for col in df.columns:
            if 'phone' in col.lower() or 'mobile' in col.lower() or 'cell' in col.lower():
                phone_col = col
                break
        
        if phone_col:
            original_phone = str(row.get(phone_col, ""))
            if original_phone and original_phone.lower() != "nan":
                # Validate the phone number
                phone_result = validate_phone(original_phone)
                
                if phone_result["valid"]:
                    phone_verified += 1
                    # Format the phone number to E164 standard
                    if phone_result["formatted"] != original_phone:
                        conf = phone_result["confidence"]
                        change = {
                            "id": str(uuid.uuid4()),
                            "row_index": int(idx),
                            "column": phone_col,
                            "original_value": original_phone,
                            "cleaned_value": phone_result["formatted"],
                            "confidence": float(conf),
                            "fix_type": "phone",
                            "status": "auto_accepted" if conf >= 0.7 and auto_apply else "needs_review",
                            "applied": conf >= 0.7 and auto_apply,
                            "timestamp": datetime.now().isoformat(),
                            "manual_override": None,
                            "override_reason": None,
                            "modified_by": None,
                            "extra_info": {
                                "country": phone_result["country"],
                                "verification": "valid"
                            }
                        }
                        changes.append(change)
                        
                        if conf >= 0.7 and auto_apply:
                            df.at[idx, phone_col] = phone_result["formatted"]
                            fixes += 1
                else:
                    # Invalid phone number
                    phone_invalid += 1
                    issues += 1
                    
                    # Try to fix the phone number
                    fixed_phone, conf, error = fix_phone_number(original_phone)
                    
                    change = {
                        "id": str(uuid.uuid4()),
                        "row_index": int(idx),
                        "column": phone_col,
                        "original_value": original_phone,
                        "cleaned_value": fixed_phone if conf > 0 else original_phone,
                        "confidence": float(conf) if conf > 0 else 0.1,
                        "fix_type": "phone",
                        "status": "needs_review",  # Always needs review for invalid phones
                        "applied": False,
                        "timestamp": datetime.now().isoformat(),
                        "manual_override": None,
                        "override_reason": None,
                        "modified_by": None,
                        "extra_info": {
                            "error": phone_result["error"],
                            "verification": "invalid"
                        }
                    }
                    changes.append(change)

        # ========== 4. EMAIL VERIFICATION ==========
        email_col = None
        for col in df.columns:
            if 'email' in col.lower():
                email_col = col
                break
        
        if email_col:
            original_email = str(row.get(email_col, ""))
            if original_email and original_email.lower() != "nan":
                # Validate email (with optional API check)
                email_result = validate_email(original_email, use_api=verify_emails_api)
                
                if email_result["valid"]:
                    email_verified += 1
                    # Check for disposable email warning
                    if email_result.get("is_disposable"):
                        issues += 1
                        change = {
                            "id": str(uuid.uuid4()),
                            "row_index": int(idx),
                            "column": email_col,
                            "original_value": original_email,
                            "cleaned_value": original_email,
                            "confidence": 0.5,
                            "fix_type": "email",
                            "status": "needs_review",
                            "applied": False,
                            "timestamp": datetime.now().isoformat(),
                            "manual_override": None,
                            "override_reason": None,
                            "modified_by": None,
                            "extra_info": {
                                "warning": "Disposable email domain detected",
                                "verification": "disposable"
                            }
                        }
                        changes.append(change)
                else:
                    # Invalid email
                    email_invalid += 1
                    issues += 1
                    
                    # Try to fix the email
                    fixed_email, conf, fix_applied = fix_email(original_email, current_domain)
                    
                    change = {
                        "id": str(uuid.uuid4()),
                        "row_index": int(idx),
                        "column": email_col,
                        "original_value": original_email,
                        "cleaned_value": fixed_email,
                        "confidence": float(conf),
                        "fix_type": "email",
                        "status": "auto_accepted" if conf >= 0.7 and auto_apply else "needs_review",
                        "applied": conf >= 0.7 and auto_apply,
                        "timestamp": datetime.now().isoformat(),
                        "manual_override": None,
                        "override_reason": None,
                        "modified_by": None,
                        "extra_info": {
                            "error": email_result.get("error"),
                            "fix_applied": fix_applied,
                            "verification": "invalid"
                        }
                    }
                    changes.append(change)
                    
                    if conf >= 0.7 and auto_apply:
                        df.at[idx, email_col] = fixed_email
                        fixes += 1
            else:
                # Missing email - use old fix method
                if not is_valid_email(original_email):
                    issues += 1
                    fixed_email, conf = fix_invalid_email(original_email, current_domain)
                    if fixed_email != original_email:
                        change = {
                            "id": str(uuid.uuid4()),
                            "row_index": int(idx),
                            "column": email_col,
                            "original_value": original_email,
                            "cleaned_value": fixed_email,
                            "confidence": float(conf),
                            "fix_type": "email",
                            "status": "auto_accepted" if conf >= 0.7 and auto_apply else "needs_review",
                            "applied": conf >= 0.7 and auto_apply,
                            "timestamp": datetime.now().isoformat(),
                            "manual_override": None,
                            "override_reason": None,
                            "modified_by": None
                        }
                        changes.append(change)
                        
                        if conf >= 0.7 and auto_apply:
                            df.at[idx, email_col] = fixed_email
                            fixes += 1

        # ========== 5. JOB TITLE STANDARDIZATION ==========
        job_col = None
        for col in df.columns:
            if 'job' in col.lower() or 'title' in col.lower():
                job_col = col
                break
        
        if job_col:
            original_title = str(row.get(job_col, ""))
            if original_title and original_title.lower() != "nan":
                standardized_title, conf = standardize_job_title(original_title)
                if standardized_title != original_title:
                    change = {
                        "id": str(uuid.uuid4()),
                        "row_index": int(idx),
                        "column": job_col,
                        "original_value": original_title,
                        "cleaned_value": standardized_title,
                        "confidence": float(conf),
                        "fix_type": "job_title",
                        "status": "auto_accepted" if conf >= 0.7 and auto_apply else "needs_review",
                        "applied": conf >= 0.7 and auto_apply,
                        "timestamp": datetime.now().isoformat(),
                        "manual_override": None,
                        "override_reason": None,
                        "modified_by": None
                    }
                    changes.append(change)
                    
                    if conf >= 0.7 and auto_apply:
                        df.at[idx, job_col] = standardized_title
                        fixes += 1

        # ========== 6. ROLE FUNCTION MAPPING ==========
        if job_col:
            current_title = str(df.at[idx, job_col]) if job_col else ""
            role, _ = map_job_title(current_title)
            df.at[idx, "role_function"] = role

        # ========== 7. CHECK FOR MISSING VALUES ==========
        for col in df.columns:
            if is_missing(row.get(col)):
                issues += 1

    # Calculate quality score
    total_cells = len(df) * len(df.columns)
    quality_score = calculate_quality_score(total_cells, issues)
    
    # Prepare original data as list of dicts for frontend
    original_data = original_df.to_dict(orient='records')
    cleaned_data = df.to_dict(orient='records')
    
    return df, {
        "issues_found": issues,
        "fixes_applied": fixes,
        "quality_score": quality_score,
        "rows_processed": len(df),
        "columns": list(df.columns),
        "changes": changes,
        "original_data": original_data,
        "cleaned_data": cleaned_data,
        "total_changes": len(changes),
        "auto_accepted_count": len([c for c in changes if c["status"] == "auto_accepted"]),
        "needs_review_count": len([c for c in changes if c["status"] == "needs_review"]),
        # New verification stats
        "verification_stats": {
            "phone_verified": phone_verified,
            "phone_invalid": phone_invalid,
            "email_verified": email_verified,
            "email_invalid": email_invalid
        }
    }

