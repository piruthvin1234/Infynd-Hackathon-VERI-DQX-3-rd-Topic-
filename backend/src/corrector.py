from rapidfuzz import process, fuzz

# Known correct domains
KNOWN_DOMAINS = ["google.com", "microsoft.com", "amazon.com", "meta.com", "apple.com", "netflix.com", "tesla.com", "salesforce.com"]

# Known correct company names
KNOWN_COMPANIES = {
    "google": "Google",
    "gogle": "Google",
    "googl": "Google",
    "microsoft": "Microsoft",
    "microsft": "Microsoft",
    "micosoft": "Microsoft",
    "amazon": "Amazon",
    "amazn": "Amazon",
    "meta": "Meta",
    "facebook": "Meta",
    "apple": "Apple",
    "aplle": "Apple",
    "aple": "Apple",
    "netflix": "Netflix",
    "netflx": "Netflix",
    "netfix": "Netflix",
    "tesla": "Tesla",
    "tesle": "Tesla",
    "salesforce": "Salesforce",
    "salesforcce": "Salesforce",
}

# Job title standardization mapping
JOB_TITLE_STANDARDS = {
    # CEO variants
    "ceo": "Chief Executive Officer",
    "chief executive officer": "Chief Executive Officer",
    "chief exec": "Chief Executive Officer",
    # CTO variants
    "cto": "Chief Technology Officer",
    "chief technology officer": "Chief Technology Officer",
    "chief tech officer": "Chief Technology Officer",
    # Developer variants
    "sr. developer": "Senior Developer",
    "sr developer": "Senior Developer",
    "senior developer": "Senior Developer",
    "sr. dev": "Senior Developer",
    "software engineer": "Software Engineer",
    "software dev": "Software Engineer",
    "sw engineer": "Software Engineer",
    # Founder variants
    "founder": "Founder",
    "co-founder": "Co-Founder",
    "cofounder": "Co-Founder",
    # Sales variants
    "account executive": "Account Executive",
    "account exec": "Account Executive",
    "ae": "Account Executive",
    "sales rep": "Sales Representative",
    "sales representative": "Sales Representative",
    # Marketing variants
    "growth marketer": "Growth Marketer",
    "marketing manager": "Marketing Manager",
    "growth hacker": "Growth Marketer",
    # HR variants
    "hr business partner": "HR Business Partner",
    "hr manager": "HR Manager",
    "human resources": "HR Manager",
}


def suggest_domain_fix(domain):
    """Fix domain typos using fuzzy matching."""
    if not isinstance(domain, str) or not domain.strip():
        return domain, 0.0
    
    domain = domain.lower().strip()
    match, score, _ = process.extractOne(domain, KNOWN_DOMAINS, scorer=fuzz.ratio)
    confidence = score / 100
    return match, confidence


def suggest_company_fix(company_name):
    """Fix company name typos using dictionary lookup and fuzzy matching."""
    if not isinstance(company_name, str) or not company_name.strip():
        return company_name, 0.0
    
    company_lower = company_name.lower().strip()
    
    # Direct dictionary lookup
    if company_lower in KNOWN_COMPANIES:
        return KNOWN_COMPANIES[company_lower], 1.0
    
    # Fuzzy match against known companies
    known_list = list(KNOWN_COMPANIES.keys())
    match, score, _ = process.extractOne(company_lower, known_list, scorer=fuzz.ratio)
    confidence = score / 100
    
    if confidence > 0.7:
        return KNOWN_COMPANIES[match], confidence
    
    # Return original with title case if no match
    return company_name.title(), 0.5


def standardize_job_title(title):
    """Standardize job titles to consistent format."""
    if not isinstance(title, str) or not title.strip():
        return title, 0.0
    
    title_lower = title.lower().strip()
    
    # Direct lookup
    if title_lower in JOB_TITLE_STANDARDS:
        return JOB_TITLE_STANDARDS[title_lower], 1.0
    
    # Fuzzy match
    known_titles = list(JOB_TITLE_STANDARDS.keys())
    match, score, _ = process.extractOne(title_lower, known_titles, scorer=fuzz.ratio)
    confidence = score / 100
    
    if confidence > 0.7:
        return JOB_TITLE_STANDARDS[match], confidence
    
    # Return original with title case
    return title.title(), 0.5


def fix_invalid_email(email, domain):
    """Fix or replace invalid emails."""
    if not isinstance(email, str):
        return f"unknown@{domain}" if domain else "unknown@example.com", 0.0
    
    email = email.strip()
    
    # Check if valid email format
    if "@" in email and "." in email.split("@")[-1]:
        return email, 1.0
    
    # Invalid email - create placeholder
    if domain:
        return f"unknown@{domain}", 0.3
    else:
        return "unknown@example.com", 0.1
