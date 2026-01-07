import pandas as pd
import re
from rapidfuzz import process, fuzz
from collections import Counter

# ---------------- CONFIG ----------------
INPUT_FILE = r"D:\VETRI-DQX-main\Company_Issues(Company_Issues) (1).xlsx"
COLUMN = "job_title" 
SIMILARITY_THRESHOLD = 80 # Changed to 80 for partial_ratio
# ----------------------------------------

# -----------------------------
# 1. Standard job functions + keywords
# -----------------------------
JOB_FUNCTIONS = {
    "Management": [
        "director", "managing director", "md", "manager", "general manager",
        "executive", "partner", "owner", "co owner", "founder", "ceo",
        "chief", "registered manager", "supervisor", "lead", "head", "vp", "president"
    ],
    "Sales": [
        "sales", "account executive", "account manager", "sales director",
        "business development", "negotiator", "commercial", "bdr", "sdr"
    ],
    "Engineering": [
        "engineer", "civil", "mechanical", "electrical", "software",
        "architect", "lab engineer", "engg", "technician", "mechanic", "electrician", "plumber"
    ],
    "Marketing": [
        "marketing", "media planner", "social media", "digital media",
        "brand", "market", "content", "communications"
    ],
    "Finance": [
        "accountant", "finance", "financial", "payroll", "analyst",
        "company secretary", "auditor", "controller", "treasurer"
    ],
    "HR": [
        "hr", "human resources", "recruitment", "recruiter", "talent", "people"
    ],
    "Medical": [
        "nurse", "doctor", "dentist", "rheumatologist", "pharmacy",
        "health care", "matron", "otolaryngologist", "medical", "clinical", "practitioner", "therapist", "care"
    ],
    "Legal": [
        "lawyer", "solicitor", "legal", "attorney", "counsel", "paralegal"
    ],
    "Education": [
        "teacher", "educator", "school", "tuition", "lecturer", "coach", "professor", "tutor", "instructor", "trainer"
    ],
    "Operations": [
        "operations", "facilities", "warehouse", "site services", "ops", "logistics", "supply chain"
    ],
    "Admin": [
        "admin", "administrator", "receptionist", "office", "clerk", "assistant", "secretary"
    ],
    "IT": [
        "information technology", "it", "computer", "software", "developer", "sde", "programmer", "coder"
    ],
    "RND": [
        "scientist", "research", "astrophysicist", "r&d"
    ],
    "Production": [
        "production", "media production", "editor"
    ],
    "Consulting": [
        "consultant", "advisor"
    ],
    "Design": [
        "designer", "ui/ux", "creative", "artist"
    ],
    "Hospitality": [
        "chef", "cook", "baker", "catering", "waiter", "bartender"
    ],
    "Driver": [
        "driver", "courier", "chauffeur", "delivery"
    ],
    "Real Estate": [
        "real estate", "realtor", "agent", "property"
    ]
}

# Flatten keyword list for fuzzy matching
KEYWORD_TO_FUNCTION = {
    kw: fn
    for fn, kws in JOB_FUNCTIONS.items()
    for kw in kws
}

KEYWORDS = list(KEYWORD_TO_FUNCTION.keys())

# -----------------------------
# 2. Cleaning function
# -----------------------------
def clean_title(title: str) -> str:
    if not isinstance(title, str):
        return ""
    title = title.lower()
    title = re.sub(r"[^a-z\s]", " ", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title

# -----------------------------
# 3. Main classifier
# -----------------------------
def unify_job_title(title: str) -> str:
    if not title or len(str(title).strip()) < 2:
        return "Other"

    cleaned = clean_title(str(title))

    # Rule-based match (Exact keyword in string)
    # Priority: longer keywords first to avoid partial matches like "it" inside "architect" acting weird?
    # Actually, iterate through dictionary logic
    
    # Let's check direct keyword presence 
    # Use exact word boundary regex for short keywords to be safe
    for kw, fn in KEYWORD_TO_FUNCTION.items():
        if len(kw) <= 3:
             if re.search(r'\b' + re.escape(kw) + r'\b', cleaned):
                 return fn
        else:
            if kw in cleaned:
                return fn

    # Fuzzy fallback
    match_result = process.extractOne(
        cleaned, KEYWORDS, scorer=fuzz.partial_ratio
    )
    
    if match_result:
        match, score, _ = match_result
        if score >= SIMILARITY_THRESHOLD:
            return KEYWORD_TO_FUNCTION[match]

    return title # Keep original if no broad category found? Or "Other"? 
                 # User request implies "unify job title", so maybe "Other" or original.
                 # User code returns "Other". But usually users prefer keeping original if not mapped.
                 # Let's return Original to be safe, or "Unclassified".
                 # Actually, looking at user request: "Ba" -> "BA".
                 # If we return "Other", we lose data. 
                 # Let's return the Title Case of the original if no match found.
    
    return title

def check_semantic_inconsistency(df, column, threshold=SIMILARITY_THRESHOLD):
    """
    Applies the unify_job_title logic to the specified column.
    """
    if column not in df.columns:
        print(f"Column {column} not found in dataframe.")
        return df, {}

    print(f"📥 Processing column: {column} with RapidFuzz logic...")
    
    raw_values = df[column].dropna().unique().tolist()
    unified_map = {}
    
    for val in raw_values:
        unified = unify_job_title(val)
        
        # If the function returned a Category (e.g. "Management"), we use that.
        # If it returned the original string (because no match), we stick with original.
        unified_map[val] = unified

    # ---------------- APPLY ----------------
    unified_col = f"{column}_unified"
    df[unified_col] = df[column].map(
        lambda x: unified_map.get(str(x), x) if pd.notna(x) else x
    )
    
    # Also flag if it was changed
    df[f"{column}_is_inconsistent"] = df.apply(
        lambda row: row[column] != row[unified_col] if pd.notna(row[column]) and pd.notna(row[unified_col]) else False,
        axis=1
    )

    print(f"✅ Standardization complete. Mapped {len(unified_map)} unique values.")
    
    # Sample print
    for k, v in list(unified_map.items())[:10]:
        if k != v:
            print(f"{k} -> {v}")

    return df, unified_map

def main():
    print("Test run...")
    titles = [
        "Managing Director",
        "Scientist In Residence",
        "Sales Managet",
        "BA",
        "Andy Smith",
        "Civil Engineer",
        "Marketing Assistant",
        "Lawyer",
        "Nurse"
    ]
    
    for t in titles:
        print(f"{t:35} → {unify_job_title(t)}")

if __name__ == "__main__":
    main()
