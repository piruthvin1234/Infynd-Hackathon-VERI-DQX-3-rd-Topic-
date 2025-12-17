import requests
import json

BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/auth/login"

def test():
    # 1. Login
    print("Logging in...")
    resp = requests.post(LOGIN_URL, data={"username": "test@example.com", "password": "test123"})
    
    if resp.status_code != 200:
        print("Creating user...")
        # Signup with name (not full_name) as per test_backend.py
        requests.post(f"{BASE_URL}/auth/signup", json={"email": "test@example.com", "password": "test123", "name": "Test User"})
        resp = requests.post(LOGIN_URL, data={"username": "test@example.com", "password": "test123"})
    
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        return

    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful")

    # 2. Get Project ID (List first)
    print("Getting projects...")
    p_resp = requests.get(f"{BASE_URL}/api/projects/?user_id=1", headers=headers)
    
    project_id = 1 # Default
    
    if p_resp.status_code == 200:
        projects = p_resp.json().get("projects", [])
        if projects:
            project_id = projects[0]["id"]
            print(f"Found existing project ID: {project_id}")
        else:
            print("Creating project...")
            c_resp = requests.post(f"{BASE_URL}/api/projects/", json={"name": "Test Project", "user_id": 1}, headers=headers)
            if c_resp.status_code == 200:
                project_id = c_resp.json()["id"]
                print(f"Created project ID: {project_id}")
            else:
                 print(f"Failed to create project: {c_resp.text}")
    else:
        print(f"Failed to list projects: {p_resp.status_code}")

    UPLOAD_URL = f"{BASE_URL}/api/projects/{project_id}/runs/upload?mode=auto&run_by=test@example.com"
    
    # 3. Create dummy CSV
    with open("temp_test.csv", "w") as f:
        f.write("company_name,email,phone\nTest Co,test@example.com,+14155551234")
        
    files = {"file": open("temp_test.csv", "rb")}
    
    print(f"Uploading to {UPLOAD_URL}...")
    r = requests.post(UPLOAD_URL, headers=headers, files=files)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")

if __name__ == "__main__":
    test()
