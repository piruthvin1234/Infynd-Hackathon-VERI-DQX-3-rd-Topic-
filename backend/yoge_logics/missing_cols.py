import pandas as pd

# Load your Excel file
INPUT_FILE = r'D:\VETRI-DQX-main\Company_Issues(Company_Issues) (1).xlsx'

def check_missing_cols(df):
    """
    Checks for missing values in the dataframe.
    Returns:
        dict: {column_name: missing_count} for columns with missing values
    """
    # Count missing values per column
    # Since we often read as dtype=str, we need to check for "nan", "", None
    missing_counts = df.apply(lambda x: x.astype(str).str.strip().str.lower().isin(["", "nan", "none", "null"])).sum()
    
    # Filter only those with missing vals
    missing_dict = missing_counts[missing_counts > 0].to_dict()
    
    print("===== Missing Values Per Column =====")
    print(missing_dict)
    
    return missing_dict

def main():
    df = pd.read_excel(INPUT_FILE)
    check_missing_cols(df)

if __name__ == "__main__":
    main()
