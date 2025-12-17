# phone_verification.py

import phonenumbers
from phonenumbers.phonenumberutil import NumberParseException


def normalize_phone(phone):
    """
    Normalize phone number by removing spaces, dashes, and parentheses.
    """
    if phone is None:
        return None

    phone = str(phone).strip()
    if phone == "":
        return None

    phone = (
        phone.replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )
    return phone


def validate_phone(phone, country_code="IN"):
    """
    Validate phone number and return detailed result.
    
    INPUT:
        phone -> string or None
        country_code -> default country code for parsing (default: "IN" for India)
    OUTPUT:
        dict with validation result:
        - valid: bool
        - formatted: E164 formatted number if valid
        - country: country code if valid
        - error: error message if invalid
        - confidence: confidence score (0.0 to 1.0)
    """

    result = {
        "valid": False,
        "formatted": None,
        "country": None,
        "error": None,
        "confidence": 0.0
    }

    phone = normalize_phone(phone)

    # ❌ Missing phone number
    if phone is None:
        result["error"] = "Missing phone number"
        return result

    try:
        parsed = phonenumbers.parse(phone, country_code)

        # ❌ Invalid phone number
        if not phonenumbers.is_valid_number(parsed):
            result["error"] = "Invalid phone number"
            result["confidence"] = 0.3  # Low confidence - might be typo
            return result

        # ✅ Valid phone number
        result["valid"] = True
        result["formatted"] = phonenumbers.format_number(
            parsed,
            phonenumbers.PhoneNumberFormat.E164
        )
        result["country"] = phonenumbers.region_code_for_number(parsed)
        result["confidence"] = 1.0

    except NumberParseException as e:
        result["error"] = f"Invalid phone number format: {str(e)}"
        result["confidence"] = 0.1

    return result


def fix_phone_number(phone, country_code="IN"):
    """
    Attempt to fix/format a phone number.
    Returns tuple: (fixed_phone, confidence, error)
    """
    result = validate_phone(phone, country_code)
    
    if result["valid"]:
        return result["formatted"], result["confidence"], None
    else:
        # Return original with low confidence if can't fix
        return phone, 0.0, result["error"]
