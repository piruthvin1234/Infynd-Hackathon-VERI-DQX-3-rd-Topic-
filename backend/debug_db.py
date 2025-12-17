from database import SessionLocal
import models
import pandas as pd
import os
import json

def test_run_15():
    db = SessionLocal()
    try:
        run = db.query(models.Run).filter(models.Run.id == 15).first()
        if not run:
            print("Run 15 not found")
            return
        
        print(f"Run 15 found via DB: Project={run.project_id}, RunNumber={run.run_number}")
        print(f"Original: {run.original_file_path}")
        print(f"Cleaned: {run.cleaned_file_path}")
        
        paths = [run.original_file_path, run.cleaned_file_path]
        
        for p in paths:
            if not p:
                print("Path is None")
                continue
                
            print(f"Testing {p}")
            if not os.path.exists(p):
                print("File does not exist")
                continue
                
            try:
                df = pd.read_csv(p)
                print(f"Read success. Shape: {df.shape}")
                
                 # Test logic
                offset = 0
                limit = 50
                df_page = df.iloc[offset : offset + limit]
                
                # The logic in api
                df_page = df_page.where(pd.notnull(df_page), None)
                records = df_page.to_dict(orient='records')
                json_out = json.dumps(records)
                print("JSON serialization success")
                
            except Exception as e:
                print(f"ERROR processing {p}: {e}")
                import traceback
                traceback.print_exc()
                
    finally:
        db.close()

if __name__ == "__main__":
    test_run_15()
