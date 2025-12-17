import pandas as pd
import os
import json

file_path = r"d:\VETRI-DQX\backend\data\uploads\project_4_run_9_20251218_030116_yogi.csv"
cleaned_path = r"d:\VETRI-DQX\backend\data\cleaned\cleaned_project_4_run_9_20251218_030116_yogi.csv"

def test_read(path):
    print(f"Testing {path}")
    if not os.path.exists(path):
        print("File does not exist")
        return

    try:
        df = pd.read_csv(path)
        print("Read success")
        print(df.head())
        
        offset = 0
        limit = 50
        df_page = df.iloc[offset : offset + limit]
        
        print("Slice success")
        
        # This is the suspicious line
        df_page = df_page.where(pd.notnull(df_page), None)
        print("Where success")
        
        records = df_page.to_dict(orient='records')
        print("To Dict success")
        
        # Test JSON serialization
        json_output = json.dumps(records)
        print("JSON dumps success")
        
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()

test_read(file_path)
test_read(cleaned_path)
