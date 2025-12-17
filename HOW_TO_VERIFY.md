# ✅ How to Verify DataGuardian AI Features

Quick reference guide for testing all features of the application.

---

## 🎯 Quick Links

- **Backend API Docs:** http://localhost:8000/docs
- **Frontend App:** http://localhost:5173
- **Data Inspector:** http://localhost:5173/data-view/{file_id}
- **Projects:** http://localhost:5173/projects
- **Copilot:** http://localhost:5173/copilot

---

## 1️⃣ Data View / Inspector Page

### How to Access:
1. Upload a CSV file through Projects or Copilot
2. Get the `file_id` from the response
3. Navigate to: `http://localhost:5173/data-view/{file_id}`

### What to Check:
- ✅ Page loads without errors
- ✅ See "Data Inspector" title
- ✅ Two tabs: "Raw & Review" and "Cleaned Data"
- ✅ Data table shows your CSV rows
- ✅ Pagination works (if more than 50 rows)
- ✅ "Finalize & Clean" button works
- ✅ Can switch between tabs

---

## 2️⃣ Email Verification Flow

### Step 1: Request Verification
```bash
POST /auth/email/request
Body: {"email": "user@example.com"}
```

### Step 2: Check Backend Console
Look for output like:
```
==========================================
VERIFICATION LINK: http://localhost:5173/verify-email?token=abc123
==========================================
```

### Step 3: Verify Email
```bash
POST /auth/email/verify  
Body: {"token": "abc123"}
```

### Verify Success:
```sql
-- Check database
SELECT email, is_verified FROM users WHERE email = 'user@example.com';
-- Should show is_verified = true
```

---

## 3️⃣ Phone OTP Verification Flow

### Step 1: Login First
```bash
POST /auth/login
Body: username=user@example.com&password=yourpass
```
**Save the access_token!**

### Step 2: Request OTP
```bash
POST /auth/phone/otp
Headers: Authorization: Bearer YOUR_TOKEN
Body: {"phone_number": "+14155551234"}
```

### Step 3: Check Backend Console
Look for:
```
==========================================
OTP for +14155551234: 123456
==========================================
```

### Step 4: Verify OTP
```bash
POST /auth/phone/verify
Headers: Authorization: Bearer YOUR_TOKEN
Body: {"phone_number": "+14155551234", "otp_code": "123456"}
```

### Verify Success:
```sql
-- Check database
SELECT email, phone_number FROM users WHERE email = 'user@example.com';
-- Should show phone_number = '+14155551234'
```

---

## 4️⃣ CSV Upload & Cleaning (Copilot Page)

### Test Clean Mode:
1. Go to: http://localhost:5173/copilot
2. **Select CSV files** (single or multiple)
3. Choose **🧹 Clean** mode
4. Click **"Analyse and Clean"**
5. Wait for processing
6. Click **"Download Cleaned CSV"**

### Expected Results:
- ✅ Validation results appear in table
- ✅ Invalid emails are highlighted (red)
- ✅ Suggested fixes shown (yellow)
- ✅ Valid fields shown (green)
- ✅ Download button appears
- ✅ CSV downloads successfully

---

## 5️⃣ Review Mode Workflow

### Test Review Mode:
1. Go to: http://localhost:5173/copilot
2. **Select a CSV file**
3. Choose **👁️ Review** mode
4. Click **"Send to Review"**
5. **Review UI page** opens
6. Review suggestions (Accept/Reject/Edit)
7. Click **"Apply Changes"**
8. Success message appears
9. Click **"Download Cleaned CSV"**

### Expected Results:
- ✅ Routes to ReviewUI page with session
- ✅ Shows all suggested changes
- ✅ Can accept/reject individual changes
- ✅ Can edit values manually
- ✅ Can apply all changes
- ✅ Download button appears after applying
- ✅ CSV downloads successfully

---

## 6️⃣ Projects Feature

### Test Project Creation:
1. Go to: http://localhost:5173/projects
2. Click **"Create New Project"**
3. Fill in:
   - Name: "Test Project"
   - Description: "Testing"
4. Click **"Create"**

### Expected Results:
- ✅ No 404 error
- ✅ Project created (check: `POST /api/projects/` returns 201)
- ✅ Project appears in list
- ✅ Can click on project to view details

### Check Database:
```sql
SELECT * FROM projects WHERE name = 'Test Project';
```

---

## 7️⃣ Theme Support

### Test Themes:
1. Click **theme selector** (usually in header)
2. Try different themes:
   - Modern Blue
   - Purple Dream
   - Sunset Orange
   - Forest Green
   - Professional Gray
3. Switch between **Light/Dark** modes

### Expected Results:
- ✅ All pages adapt to selected theme
- ✅ Colors change smoothly
- ✅ Text remains readable
- ✅ Dashboard, Copilot, ReviewUI all update
- ✅ Theme persists after refresh

---

## 8️⃣ Authentication

### Test Signup:
```bash
POST /auth/signup
Body: {
  "name": "Test User",
  "email": "test@test.com",
  "password": "test123"
}
```

### Test Login:
```bash
POST /auth/login
Body: username=test@test.com&password=test123
```

### Check Token Works:
```bash
GET /auth/me
Headers: Authorization: Bearer YOUR_TOKEN
```

---

## 🧪 Complete Test Sequence

Run this sequence to test everything:

1. **Start servers** (backend + frontend)
2. **Signup** new user
3. **Verify email** (check console for link/token)
4. **Login** to get token
5. **Verify phone** (check console for OTP)
6. **Create project**
7. **Upload CSV to project**
8. **View data** in Data Inspector
9. **Test Copilot** (Clean mode)
10. **Test Review mode**
11. **Switch themes**

---

## 🐞 Common Issues

### 404 Errors:
- Check backend is running on port 8000
- Check frontend is running on port 5173
- Verify API endpoints have `/api` prefix

### CORS Errors:
- Check `main.py` allows `http://localhost:5173`
- Check backend CORS middleware is enabled

### Database Errors:
- Run: `python fix_db_schema_v2.py` (if needed)
- Check PostgreSQL is running
- Verify connection in `.env` file

### Token Issues:
- Tokens expire (check expiration time)
- Use fresh token for each test
- Include `Bearer` prefix in Authorization header

---

## 📊 Database Verification Queries

```sql
-- Check users
SELECT id, name, email, is_verified, phone_number FROM users;

-- Check projects
SELECT id, name, owner_id, created_at FROM projects;

-- Check files
SELECT id, filename, status, row_count FROM uploaded_files;

-- Check email tokens
SELECT user_id, token, expires_at FROM email_verification_tokens;

-- Check OTP logs
SELECT user_id, phone_number, otp_code, is_used FROM otp_logs;
```

---

## ✅ Final Checklist

- [ ] Backend running and accessible
- [ ] Frontend running and accessible
- [ ] Can signup and login
- [ ] Email verification works
- [ ] Phone OTP verification works
- [ ] Data Inspector page accessible
- [ ] CSV upload works (Clean mode)
- [ ] Review mode works
- [ ] Projects can be created
- [ ] Themes can be switched
- [ ] All API endpoints return correct responses

---

**For detailed guides, see:**
- `DATA_VIEW_AND_VERIFICATION_GUIDE.md` - Comprehensive verification guide
- `BACKEND_TESTING.md` - Backend-only testing
- `PROJECTS_FIX_VERIFICATION.md` - Projects feature testing

---

*Last Updated: 2025-12-17*
