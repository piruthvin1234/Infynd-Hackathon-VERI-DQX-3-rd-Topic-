# email_verification.py

import requests
import re
from typing import Optional

# External API for real email verification
API_URL = "https://rapid-email-verifier.fly.dev/api/validate"

# Basic email regex pattern
EMAIL_REGEX = re.compile(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
)

# Known disposable email domains
DISPOSABLE_DOMAINS = {
    "tempmail.com", "throwaway.email", "guerrillamail.com", 
    "10minutemail.com", "mailinator.com", "temp-mail.org",
    "fakeinbox.com", "tempail.com", "dispostable.com"
}


def validate_email_format(email: str) -> dict:
    """
    Basic email format validation without API call.
    Good for quick checks.
    """
    result = {
        "valid": False,
        "email": email,
        "error": None,
        "confidence": 0.0,
        "is_disposable": False
    }
    
    if email is None or str(email).strip() == "":
        result["error"] = "Missing email"
        return result
    
    email = str(email).strip().lower()
    result["email"] = email
    
    # Check format with regex
    if not EMAIL_REGEX.match(email):
        result["error"] = "Invalid email format"
        result["confidence"] = 0.2
        return result
    
    # Extract domain
    domain = email.split("@")[1] if "@" in email else ""
    
    # Check for disposable email domains
    if domain in DISPOSABLE_DOMAINS:
        result["is_disposable"] = True
        result["error"] = "Disposable email domain detected"
        result["confidence"] = 0.4
        return result
    
    # Basic validation passed
    result["valid"] = True
    result["confidence"] = 0.7  # Medium confidence without API verification
    return result


def validate_email_api(email: str, timeout: int = 10) -> dict:
    """
    Full email validation using external API.
    Checks if email actually exists.
    
    INPUT:
        email -> string
        timeout -> API request timeout in seconds
    OUTPUT:
        dict with validation result
    """
    result = {
        "valid": False,
        "email": email,
        "error": None,
        "confidence": 0.0,
        "is_disposable": False,
        "api_response": None
    }
    
    # First do basic format check
    basic_check = validate_email_format(email)
    if not basic_check["valid"]:
        return basic_check
    
    try:
        params = {"email": email}
        response = requests.get(API_URL, params=params, timeout=timeout)
        response.raise_for_status()
        api_result = response.json()
        
        result["api_response"] = api_result
        
        # Parse API response
        # The API typically returns fields like: valid, disposable, deliverable, etc.
        if api_result.get("valid", False) or api_result.get("deliverable", False):
            result["valid"] = True
            result["confidence"] = 0.95
        else:
            result["valid"] = False
            result["error"] = api_result.get("reason", "Email verification failed")
            result["confidence"] = 0.3
            
        result["is_disposable"] = api_result.get("disposable", False)
        
    except requests.Timeout:
        # If API times out, fall back to basic validation
        result["valid"] = basic_check["valid"]
        result["confidence"] = 0.6
        result["error"] = "API timeout - using basic validation"
        
    except requests.RequestException as e:
        # If API fails, fall back to basic validation
        result["valid"] = basic_check["valid"]
        result["confidence"] = 0.5
        result["error"] = f"API error - using basic validation: {str(e)}"
        
    except Exception as e:
        result["error"] = f"Validation error: {str(e)}"
        result["confidence"] = 0.0
        
    return result


def validate_email(email: str, use_api: bool = False) -> dict:
    """
    Main entry point for email validation.
    
    INPUT:
        email -> string
        use_api -> if True, uses external API for verification (slower but more accurate)
    OUTPUT:
        dict with validation result
    """
    if use_api:
        return validate_email_api(email)
    else:
        return validate_email_format(email)


def fix_email(email: str, domain_hint: str = None) -> tuple:
    """
    Attempt to fix common email issues.
    Returns tuple: (fixed_email, confidence, fix_applied)
    """
    if email is None or str(email).strip() == "":
        if domain_hint:
            return f"unknown@{domain_hint}", 0.1, "generated_placeholder"
        return "unknown@example.com", 0.0, "generated_placeholder"
    
    email = str(email).strip().lower()
    original = email
    fix_applied = None
    
    # Common typo fixes
    typo_fixes = {
        "@gmial.com": "@gmail.com",
        "@gmal.com": "@gmail.com",
        "@gmail.co": "@gmail.com",
        "@gmaill.com": "@gmail.com",
        "@outlok.com": "@outlook.com",
        "@outloo.com": "@outlook.com",
        "@hotmal.com": "@hotmail.com",
        "@hotmai.com": "@hotmail.com",
        "@yaho.com": "@yahoo.com",
        "@yahooo.com": "@yahoo.com",
    }
    
    for typo, correct in typo_fixes.items():
        if typo in email:
            email = email.replace(typo, correct)
            fix_applied = f"fixed_typo:{typo}->{correct}"
            break
    
    # Check if fixed email is valid
    result = validate_email_format(email)
    
    if result["valid"]:
        confidence = 0.8 if fix_applied else 0.9
        return email, confidence, fix_applied
    else:
        # If still invalid and we have a domain hint, use it
        if domain_hint and "@" in original:
            local_part = original.split("@")[0]
            fixed = f"{local_part}@{domain_hint}"
            return fixed, 0.5, "domain_corrected"
        
        return original, 0.2, None
