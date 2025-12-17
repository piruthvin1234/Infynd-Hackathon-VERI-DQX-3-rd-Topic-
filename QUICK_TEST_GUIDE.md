# 🚀 Quick Start - Test Everything in 5 Minutes

Follow these steps to verify the entire backend is working.

---

## Step 1: Run the Test Script (Easiest!)

```bash
cd d:\VETRI-DQX\backend
python test_backend.py
```

**What it tests:**
- ✅ Backend health
- ✅ Signup/Login
- ✅ Email verification
- ✅ Phone OTP
- ✅ Project creation
- ✅ CSV upload

**Expected:** All tests pass with ✅ checkmarks

---

## Step 2: Open Swagger UI (Visual Testing)

1. Open browser: **http://localhost:8000/docs**
2. You'll see all endpoints
3. Try them one by one

### Test Email Verification:
1. Find: `POST /auth/email/request`
2. Click "Try it out"
3. Enter:
   ```json
   {
     "email": "test@test.com"
   }
   ```
4. Click "Execute"
5. **Check backend terminal** for verification link

### Test Phone OTP:
1. **First login** to get token
2. Click 🔒 "Authorize" button (top right)
3. Paste your token
4. Find: `POST /auth/phone/otp`
5. Click "Try it out"
6. Enter:
   ```json
   {
     "phone_number": "+14155551234"
   }
   ```
7. Click "Execute"
8. **Check backend terminal** for OTP code

### Test Project Creation:
1. Make sure you're authorized (see above)
2. Find: `POST /api/projects/`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "name": "Test Project",
     "description": "Testing",
     "user_id": 1
   }
   ```
5. Click "Execute"
6. Should return **201 Created** with project details

---

## Step 3: Check Database Verification

```sql
-- Connect to PostgreSQL
psql -U postgres -d vetri_dqx

-- Check users
SELECT id, email, is_verified, phone_number FROM users;

-- Check email tokens
SELECT user_id, token, expires_at FROM email_verification_tokens;

-- Check OTP logs
SELECT user_id, phone_number, otp_code, is_used FROM otp_logs;

-- Check projects
SELECT id, name, owner_id, created_at FROM projects;
```

---

## Step 4: Test from Frontend

### Test Copilot:
1. Go to: http://localhost:5173/copilot
2. Upload a CSV file
3. Choose "Clean" mode
4. Click "Analyse and Clean"
5. Should show results

### Test Projects:
1. Go to: http://localhost:5173/projects
2. Click "Create New Project"
3. Fill in name and description
4. Click "Create"
5. Should create successfully (no 404!)

---

## 🎯 Expected Backend Console Output

When testing email verification:
```
==========================================
VERIFICATION LINK: http://localhost:5173/verify-email?token=abc-123-def-456
==========================================
```

When testing phone OTP:
```
==========================================
OTP for +14155551234: 123456
==========================================
```

---

## ✅ Success Checklist

After running tests, verify:

- [ ] Test script shows all ✅ checkmarks
- [ ] Swagger UI shows 200/201 responses
- [ ] Email token appears in backend console
- [ ] OTP code appears in backend console  
- [ ] Projects can be created (201 response)
- [ ] Database has new records
- [ ] Frontend can upload CSV
- [ ] Frontend can create projects

---

## 🐛 If Something Fails

### "Backend not accessible"
- Check: `http://localhost:8000/docs` in browser
- Make sure backend is running
- Run: `python -m uvicorn main:app --reload`

### "401 Unauthorized"
- You need to login first
- Get token from `/auth/login`
- Include in Authorization header

### "404 Not Found"
- Check you're using correct endpoint
- Projects need `/api` prefix: `/api/projects/`
- NOT `/projects/`

### "Token/OTP not in console"
- Check the **backend terminal** (not frontend)
- Look for the separator lines: `==========`
- Scroll up if needed

---

## 🎉 That's It!

If all checks pass, your backend is **fully functional**!

**Next:** Use the frontend to interact with these features visually.

---

For detailed documentation, see:
- `BACKEND_STATUS.md` - Detailed test results
- `HOW_TO_VERIFY.md` - Complete verification guide
- `DATA_VIEW_AND_VERIFICATION_GUIDE.md` - Feature-specific guide
