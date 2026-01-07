import pandas as pd
import phonenumbers
from phonenumbers import NumberParseException

INPUT_FILE = r"D:\VETRI-DQX-main\Company_Issues(Company_Issues) (1).xlsx"
PHONE_COLUMN = "phone"
REGION = "GB"


def validate_phone(phone, region=REGION):
    if pd.isna(phone) or str(phone).strip() == "":
        return "", "MISSING"

    phone_str = str(phone).strip()

    if phone_str.endswith(".0"):
        phone_str = phone_str[:-2]

    digits = "".join(ch for ch in phone_str if ch.isdigit())

    # Naive assumption for GB? Or generic? 
    # original code: if len(digits) == 10: digits = "0" + digits
    if len(digits) == 10:
        digits = "0" + digits

    try:
        parsed = phonenumbers.parse(digits, region)

        if phonenumbers.is_valid_number(parsed):
            return (
                phonenumbers.format_number(
                    parsed, phonenumbers.PhoneNumberFormat.E164
                ),
                "VALID",
            )
        else:
            return digits, "INVALID"

    except NumberParseException:
        return digits, "INVALID"

def process_phone_validation(df, phone_col, region=REGION):
    """
    Applies phone validation to the dataframe.
    """
    if phone_col not in df.columns:
        return df, {"error": f"Column {phone_col} not found"}
        
    print(f"🚀 Phone validation started for region {region}...")

    results = df[phone_col].apply(lambda x: validate_phone(x, region))
    df["phone_clean"] = results.apply(lambda x: x[0])
    df["phone_status"] = results.apply(lambda x: x[1])
    
    return df, {}

def main():
    df = pd.read_excel(INPUT_FILE, dtype=str)

    df, _ = process_phone_validation(df, PHONE_COLUMN, REGION)

    # ---- SUMMARY ----
    print("\n📊 PHONE VALIDATION SUMMARY")
    print(df["phone_status"].value_counts())

    # ---- SHOW INVALID ROWS ----
    invalid_df = df[df["phone_status"] == "INVALID"]

    if invalid_df.empty:
        print("\n🎉 No INVALID phone numbers found!")
    else:
        print(f"\n❌ INVALID PHONE NUMBERS ({len(invalid_df)})\n")
        for idx, row in invalid_df.iterrows():
            print(
                f"Row {idx + 2}: "
                f"Original = {row[PHONE_COLUMN]} | "
                f"Cleaned = {row['phone_clean']}"
            )


if __name__ == "__main__":
    main()
