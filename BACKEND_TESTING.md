# 🧪 Backend Testing Guide - Data Quality Copilot

This guide shows you how to test the FastAPI backend independently without the frontend.

---

## Prerequisites

- Python 3.9+
- Backend dependencies installed (`pip install -r requirements.txt`)
- Backend server running on `http://localhost:8000`

---

## Step 1: Start the Backend Server

```bash
cd d:\VETRI-DQX\backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

---

## Step 2: Test Using Swagger UI (Recommended)

FastAPI provides an interactive API documentation interface.

1. **Open your browser** and go to: **http://localhost:8000/docs**
2. You'll see all available endpoints
3. Click on an endpoint to expand it
4. Click **"Try it out"** button
5. Fill in the parameters
6. Click **"Execute"** to test

### Example Endpoints Available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload-csv` | POST | Upload CSV for validation (no auth required) |
| `/auth/signup` | POST | Create a new user account |
| `/auth/login` | POST | Login and get JWT token |
| `/upload-for-review/` | POST | Upload CSV for human review (auth required) |
| `/projects/` | GET/POST | List or create projects |

---

## Step 3: Test Using cURL (Command Line)

### Test 1: Upload CSV for Validation (No Auth Required)

```bash
curl -X POST "http://localhost:8000/api/upload-csv" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/sample.csv"
```

**Replace** `path/to/your/sample.csv` with an actual CSV file path.

**Expected Response:**
```json
{
  "results": [
    {
      "row": 1,
      "company_name": "Acme Corp",
      "email": "contact@acme.com",
      "email_status": "VALID",
      "email_fix": null,
      "email_confidence": 0.0,
      "phone": "+1234567890",
      "phone_status": "VALID",
      "formatted_phone": "+1234567890"
    }
  ]
}
```

---

### Test 2: User Signup

```bash
curl -X POST "http://localhost:8000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

---

### Test 3: User Login

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpass123"
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**Save the `access_token`** for authenticated requests!

---

### Test 4: Upload for Review (Requires Auth)

First, get your token from login, then:

```bash
curl -X POST "http://localhost:8000/upload-for-review/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/sample.csv"
```

**Replace** `YOUR_ACCESS_TOKEN_HERE` with the token from login.

**Expected Response:**
```json
{
  "message": "File analyzed - ready for review",
  "session_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "qa_report": {
    "rows_processed": 10,
    "issues_found": 3,
    "changes": [...]
  }
}
```

---

## Step 4: Test Using Postman

1. **Download and install** [Postman](https://www.postman.com/downloads/)
2. **Create a new request**
3. **Set the method** (GET, POST, etc.)
4. **Set the URL**: `http://localhost:8000/api/upload-csv`
5. **Add Headers** (if needed):
   - `Authorization: Bearer YOUR_TOKEN` (for protected routes)
6. **Add Body**:
   - Select `form-data`
   - Add key: `file`, type: `File`
   - Upload your CSV file
7. **Click Send**

---

## Step 5: Test Using Python Requests

Create a file `test_backend.py`:

```python
import requests

BASE_URL = "http://localhost:8000"

# Test 1: Upload CSV
def test_upload_csv():
    url = f"{BASE_URL}/api/upload-csv"
    files = {'file': open('sample.csv', 'rb')}
    response = requests.post(url, files=files)
    print("Upload CSV Response:", response.json())

# Test 2: Signup
def test_signup():
    url = f"{BASE_URL}/auth/signup"
    data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123"
    }
    response = requests.post(url, json=data)
    print("Signup Response:", response.json())
    return response.json().get("access_token")

# Test 3: Login
def test_login():
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": "test@example.com",
        "password": "testpass123"
    }
    response = requests.post(url, data=data)
    print("Login Response:", response.json())
    return response.json().get("access_token")

if __name__ == "__main__":
    test_upload_csv()
    # token = test_signup()
    # token = test_login()
```

Run:
```bash
python test_backend.py
```

---

## Sample CSV File for Testing

Create `sample.csv`:

```csv
company_name,website,country,industry,size,revenue,domain,phone,email,job_title
Acme Corp,acme.com,US,Tech,500,10M,acme.com,+14155551234,contact@acme.com,CEO
XYZ Ltd,xyz.co.uk,UK,Finance,100,5M,xyz.co.uk,+442071234567,info@xyz.co.uk,CFO
Test Inc,test.com,US,Retail,50,1M,test.com,+13105551234,hello@gmial.com,CTO
```

Note: The third row has a typo: `gmial.com` instead of `gmail.com` - the AI will detect and fix this!

---

## Expected Validation Results

For the sample CSV above, you should see:

- **Row 1 & 2**: All valid ✅
- **Row 3**: 
  - Email: `hello@gmial.com` → Suggested fix: `hello@gmail.com` (typo detected)
  - Confidence: ~90%

---

## Troubleshooting

### Issue: Connection Refused
```
ConnectionRefusedError: [Errno 61] Connection refused
```
**Solution**: Make sure the backend server is running on port 8000.

---

### Issue: 401 Unauthorized
```
{"detail": "Not authenticated"}
```
**Solution**: The endpoint requires authentication. Use the `/auth/login` endpoint to get a token first.

---

### Issue: 422 Validation Error
```
{"detail": [{"loc": ["body", "file"], "msg": "field required"}]}
```
**Solution**: Make sure you're sending the file in the correct format (multipart/form-data).

---

## Quick Testing Checklist

- [ ] Backend server is running on port 8000
- [ ] Swagger UI accessible at http://localhost:8000/docs
- [ ] Can create a user account via `/auth/signup`
- [ ] Can login and receive JWT token via `/auth/login`
- [ ] Can upload CSV without auth via `/api/upload-csv`
- [ ] Can upload for review with auth token
- [ ] Validation detects email typos
- [ ] Phone numbers are formatted correctly

---

## Additional Resources

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

---

*Happy Testing! 🚀*
