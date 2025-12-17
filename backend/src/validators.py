import re

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

def is_valid_email(email):
    if not isinstance(email, str):
        return False
    return re.match(EMAIL_REGEX, email) is not None

def is_missing(value):
    return value is None or str(value).strip() == "" or str(value).lower() == "nan"
