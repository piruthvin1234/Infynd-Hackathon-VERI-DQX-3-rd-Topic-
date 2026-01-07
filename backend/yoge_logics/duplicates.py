import pandas as pd

INPUT_FILE = r"D:\VETRI-DQX-main\Company_Issues(Company_Issues) (1).xlsx"
OUTPUT_FILE_DUPLICATES = "Company_List_duplicates.xlsx"

def check_duplicates(df, subset=None):
    """
    Checks for duplicates in the dataframe.
    Args:
        df: pandas DataFrame
        subset: list of columns to check for duplicates (optional)
    Returns:
        DataFrame containing only the duplicates (all occurrences)
    """
    print(f"🔍 Checking for duplicates in columns: {subset if subset else 'ALL'}")
    
    # Find duplicates (keep=False marks all duplicates, not just the second occurrence)
    if subset:
        duplicates = df[df.duplicated(subset=subset, keep=False)]
    else:
        duplicates = df[df.duplicated(keep=False)]
        
    return duplicates

def main():
    # Load data
    df = pd.read_excel(INPUT_FILE, dtype=str)

    duplicates = check_duplicates(df)

    if not duplicates.empty:
        # Get actual Excel row numbers (header row is 1)
        duplicate_rows = (duplicates.index + 2).tolist()
        print(f"⚠️ Found {len(duplicates)} duplicate row(s) at Excel rows:", duplicate_rows)
        print("\nDuplicate rows:")
        print(duplicates)

        # Save duplicates to Excel
        duplicates.to_excel(OUTPUT_FILE_DUPLICATES, index=False)
        print(f"✅ Duplicates exported to: {OUTPUT_FILE_DUPLICATES}")
    else:
        print("✅ No duplicates found!")

if __name__ == "__main__":
    main()
