import pandas as pd
import re

# ---------------- CONFIG ----------------
INPUT_FILE = r"D:\VETRI-DQX-main\Company_Issues(Company_Issues) (1).xlsx"
OUTPUT_FILE = "Company_Issues_email_verified_all.xlsx"
EMAIL_COLUMN = "company_email"

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)

# Known temporary/disposable email domains
TEMP_EMAIL_PROVIDERS = {
    "mailinator.com",
    "10minutemail.com",
    "tempmail.com",
    "guerrillamail.com",
    "getnada.com",
    "dispostable.com",
    "throwawaymail.com",
    "yopmail.com",
    "maildrop.cc",
    "temp-mail.org",
    "fakeinbox.com"
}
# ----------------------------------------

def validate_email(email):
    if pd.isna(email) or str(email).strip() == "":
        return "MISSING"
    
    email = str(email).strip().lower()

    if not EMAIL_REGEX.match(email):
        return "INVALID"

    try:
        domain = email.split("@")[1]
        if domain in TEMP_EMAIL_PROVIDERS:
            return "TEMP_EMAIL_BLOCKED"  # 🚫 Temporary email
    except IndexError:
        return "INVALID"

    return "VALID"

def process_emails(df, email_col):
    """
    Applies email validation to the dataframe.
    """
    if email_col not in df.columns:
        return df, {"error": f"Column {email_col} not found"}
        
    print("🚀 Fast email validation started...")
    
    # Apply validation
    df["email_status"] = df[email_col].apply(validate_email)
    
    return df, {}

def main():
    df = pd.read_excel(INPUT_FILE, dtype=str)

    df, _ = process_emails(df, EMAIL_COLUMN)

    print("✅ Email validation completed")
    print("\n📊 Summary:")
    print(df["email_status"].value_counts())

    # Get row numbers of invalid emails (for easy Excel reference)
    invalid_rows = df.index[df["email_status"].isin(["INVALID", "TEMP_EMAIL_BLOCKED"])].tolist()
    if invalid_rows:
        print("\n⚠️ Invalid/Blocked email found at Excel row(s):", [i + 2 for i in invalid_rows])

    # Save results
    df.to_excel(OUTPUT_FILE, index=False)
    print(f"\n✅ Output saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
