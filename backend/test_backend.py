import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print("=" * 60)
    print("TESTING VETRI DQX BACKEND ENDPOINTS")
    print("=" * 60)
    
    # Test 1: Check backend is alive
    print("\n1️⃣ Testing Backend Health...")
    try:
        res = requests.get(f"{BASE_URL}/docs")
        if res.status_code == 200:
            print("✅ Backend is running on port 8000")
        else:
            print(f"❌ Unexpected status: {res.status_code}")
    except Exception as e:
        print(f"❌ Backend not accessible: {e}")
        return
    
    # Test 2: Signup
    print("\n2️⃣ Testing Signup...")
    signup_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "test123"
    }
    try:
        res = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
        print(f"Status: {res.status_code}")
        if res.status_code in [200, 201]:
            print("✅ Signup successful")
            data = res.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            token = data.get("access_token")
        elif res.status_code == 400:
            print("⚠️ User already exists (this is okay)")
            # Try login instead
            print("\nTrying login instead...")
            login_data = {
                "username": "test@example.com",
                "password": "test123"
            }
            res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
            if res.status_code == 200:
                token = res.json().get("access_token")
                print("✅ Login successful")
            else:
                print(f"❌ Login failed: {res.text}")
                return
        else:
            print(f"❌ Signup failed: {res.text}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Test 3: Email Verification Request
    print("\n3️⃣ Testing Email Verification Request...")
    try:
        res = requests.post(
            f"{BASE_URL}/auth/email/request",
            json={"email": "test@example.com"}
        )
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            print("✅ Email verification request successful")
            print(f"Response: {res.json()}")
            print("⚠️ CHECK BACKEND CONSOLE for verification token!")
        else:
            print(f"❌ Failed: {res.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Phone OTP Request (requires auth)
    print("\n4️⃣ Testing Phone OTP Request...")
    try:
        res = requests.post(
            f"{BASE_URL}/auth/phone/otp",
            json={"phone_number": "+14155551234"},
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            print("✅ OTP request successful")
            print(f"Response: {res.json()}")
            print("⚠️ CHECK BACKEND CONSOLE for OTP code!")
        else:
            print(f"❌ Failed: {res.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 5: Get User ID (for project creation)
    print("\n5️⃣ Getting User ID...")
    try:
        # Assuming we can decode the token or use /auth/me endpoint
        # For now, we'll use user_id = 1 (first user)
        user_id = 1
        print(f"✅ Using user_id: {user_id}")
    except Exception as e:
        print(f"❌ Error: {e}")
        user_id = 1
    
    # Test 6: Create Project
    print("\n6️⃣ Testing Project Creation...")
    project_data = {
        "name": "Test Project",
        "description": "Testing project creation",
        "user_id": user_id
    }
    try:
        res = requests.post(
            f"{BASE_URL}/api/projects/",
            json=project_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Status: {res.status_code}")
        if res.status_code in [200, 201]:
            print("✅ Project created successfully")
            print(f"Response: {json.dumps(res.json(), indent=2)}")
        else:
            print(f"❌ Failed: {res.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 7: Upload CSV (simple validation)
    print("\n7️⃣ Testing CSV Upload (Data Quality Endpoint)...")
    # Create a simple test CSV in memory
    csv_content = """company_name,email,phone
Acme Corp,test@example.com,+14155551234
XYZ Ltd,invalid@gmial.com,+442071234567"""
    
    try:
        files = {"file": ("test.csv", csv_content, "text/csv")}
        res = requests.post(f"{BASE_URL}/api/upload-csv", files=files)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            print("✅ CSV upload successful")
            print(f"Results: {json.dumps(res.json(), indent=2)}")
        else:
            print(f"❌ Failed: {res.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("TESTING COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_endpoints()
