import sys
import os
from sqlalchemy import text, inspect

# Add current directory to path
sys.path.append(os.getcwd())

from database import engine

def fix_schema():
    print("Checking database schema for 'runs' table...")
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('runs')]
    
    with engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        
        # Check run_by
        if 'run_by' not in columns:
            print("Adding 'run_by' column...")
            conn.execute(text("ALTER TABLE runs ADD COLUMN run_by VARCHAR(255)"))
        else:
            print("'run_by' column exists.")

        # Check verification_stats
        if 'verification_stats' not in columns:
             print("Adding 'verification_stats' column...")
             # Check if we need to cast or default? JSON default is usually null or {}
             # Postgres uses JSON type
             conn.execute(text("ALTER TABLE runs ADD COLUMN verification_stats JSON DEFAULT '{}'"))
        else:
             print("'verification_stats' column exists.")
             
        # Check issue_breakdown
        if 'issue_breakdown' not in columns:
             print("Adding 'issue_breakdown' column...")
             conn.execute(text("ALTER TABLE runs ADD COLUMN issue_breakdown JSON DEFAULT '{}'"))
        else:
             print("'issue_breakdown' column exists.")

        # Check data
        if 'data' in columns: # Wait, Run table doesn't have data, CreatedRecord has.
            pass

    print("Schema check complete.")

if __name__ == "__main__":
    try:
        fix_schema()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")
