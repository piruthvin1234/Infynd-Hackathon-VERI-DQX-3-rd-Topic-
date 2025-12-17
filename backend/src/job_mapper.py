JOB_FUNCTIONS = {
    "Engineering": ["engineer", "civil", "mechanical", "electrical"],
    "Management": ["manager", "director", "vp", "chief", "head", "lead", "president", "managing"],
    "Sales": ["sales", "account", "business development", "ae", "sdr"],
    "Marketing": ["marketing", "growth", "seo", "content", "brand"],
    "IT": ["developer", "software", "it", "tech", "data", "sysadmin", "programmer"],
    "HR": ["hr", "human resource", "talent", "recruiter", "people", "payroll"],
    "Finance": ["finance", "accountant", "CFO", "financial", "audit", "tax"],
    "Legal": ["legal", "lawyer", "attorney", "counsel", "jurist"],
    "Medical": ["medical", "doctor", "nurse", "physician", "surgeon", "clinic"],
    "Education": ["teacher", "professor", "educator", "tutor", "academic", "lecturer"],
    "Operations": ["operations", "ops", "logistics", "supply chain"],
    "Admin": ["admin", "assistant", "clerk", "secretary", "receptionist"],
    "Production": ["production", "manufacturing", "plant", "operator"],
    "R&D": ["research", "scientist", "r&d", "lab"],
    "Consulting": ["consultant", "advisor"]
}

def map_job_title(title):
    if not isinstance(title, str):
        return "Unknown", 0.0
        
    title_lower = title.lower()
    for function, keywords in JOB_FUNCTIONS.items():
        if any(word in title_lower for word in keywords):
            return function, 0.9
    return "Other", 0.5
