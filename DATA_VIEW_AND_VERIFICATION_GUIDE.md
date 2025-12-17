# 🔍 Data View & Verification Features - Complete Guide

This guide shows you how to access and test all the data inspection and verification features.

---

## 📊 Part 1: Data View / Data Inspector Page

### How to Access:

#### Method 1: Upload Files Workflow
1. **Login** to the application
2. Go to **Projects** page
3. **Create or select** a project
4. **Upload** a CSV file to the project
5. After upload completes, you'll get a **file_id**
6. Navigate to: `http://localhost:5173/data-view/{file_id}`

#### Method 2: Direct URL (if you know the file ID)
```
http://localhost:5173/data-view/1
```
Replace `1` with your actual file ID.

---

### What You'll See:

The **Data Inspector** page has **two tabs**:

#### 1️⃣ Raw & Review Tab
- Shows **original uploaded data**
- Shows **AI suggestions** for fixes
- Each row displays:
  - Original value
  - Suggested value
  - Confidence score
  - Issue type

#### 2️⃣ Cleaned Data Tab
- Shows **final cleaned dataset**
- Only available after you click **"Finalize & Clean"**
- Downloads available from here

---

### Features:

✅ **Pagination** - Browse through large datasets (50 rows per page)  
✅ **Side-by-side comparison** - See original vs suggested values  
✅ **Finalize & Clean** button - Apply all accepted changes  
✅ **Tab switching** - Toggle between raw and cleaned views  
✅ **Theme support** - Adapts to your selected theme  

---

### How to Test:

1. **Upload a CSV file** through Projects page
2. Note the **file ID** from the response
3. Navigate to `/data-view/{file_id}`
4. You should see:
   - ✅ Back button (top left)
   - ✅ "Data Inspector" title
   - ✅ Two tabs: "Raw & Review" and "Cleaned Data"
   - ✅ "Finalize & Clean" button
   - ✅ Data table with your CSV rows

---

## 📧 Part 2: Email Verification

### Backend Endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/email/request` | POST | Request email verification |
| `/auth/email/verify` | POST | Verify email with token |

---

### How to Test Email Verification:

#### Step 1: Request Email Verification

**Using cURL:**
```bash
curl -X POST "http://localhost:8000/auth/email/request" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Using Swagger UI:**
1. Go to: http://localhost:8000/docs
2. Find: `POST /auth/email/request`
3. Click "Try it out"
4. Enter:
```json
{
  "email": "test@example.com"
}
```
5. Click "Execute"

**Expected Response:**
```json
{
  "message": "Verification email sent"
}
```

**Check Backend Console:**
The verification link will be printed in the backend terminal:
```
==========================================
VERIFICATION LINK: http://localhost:5173/verify-email?token=abc-123-def-456
==========================================
```

---

#### Step 2: Verify Email with Token

Copy the token from the backend console, then:

**Using cURL:**
```bash
curl -X POST "http://localhost:8000/auth/email/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE"
  }'
```

**Using Swagger UI:**
1. Find: `POST /auth/email/verify`
2. Click "Try it out"
3. Enter the token from console:
```json
{
  "token": "abc-123-def-456"
}
```
4. Click "Execute"

**Expected Response:**
```json
{
  "message": "Email verified successfully"
}
```

---

### Verify in Database:

```sql
-- Check if user is verified
SELECT id, email, is_verified FROM users WHERE email = 'test@example.com';

-- Should show is_verified = true
```

---

## 📱 Part 3: Phone OTP Verification

### Backend Endpoints:

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/auth/phone/otp` | POST | Request OTP | ✅ Yes |
| `/auth/phone/verify` | POST | Verify OTP | ✅ Yes |

---

### How to Test Phone Verification:

#### Step 1: Login First (Get Token)

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=yourpassword"
```

**Save the token** from the response!

---

#### Step 2: Request OTP

**Using cURL:**
```bash
curl -X POST "http://localhost:8000/auth/phone/otp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "phone_number": "+14155551234"
  }'
```

**Using Swagger UI:**
1. Go to: http://localhost:8000/docs
2. Click the **🔒 Authorize** button (top right)
3. Enter your token: `Bearer YOUR_TOKEN_HERE`
4. Click "Authorize"
5. Find: `POST /auth/phone/otp`
6. Click "Try it out"
7. Enter:
```json
{
  "phone_number": "+14155551234"
}
```
8. Click "Execute"

**Expected Response:**
```json
{
  "message": "OTP sent successfully"
}
```

**Check Backend Console:**
The OTP code will be printed:
```
==========================================
OTP for +14155551234: 123456
==========================================
```

---

#### Step 3: Verify OTP

Copy the OTP from the backend console (e.g., `123456`), then:

**Using cURL:**
```bash
curl -X POST "http://localhost:8000/auth/phone/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "phone_number": "+14155551234",
    "otp_code": "123456"
  }'
```

**Using Swagger UI:**
1. Find: `POST /auth/phone/verify`
2. Click "Try it out"
3. Enter the OTP from console:
```json
{
  "phone_number": "+14155551234",
  "otp_code": "123456"
}
```
4. Click "Execute"

**Expected Response:**
```json
{
  "message": "Phone number verified"
}
```

---

### Verify in Database:

```sql
-- Check if phone number is saved
SELECT id, email, phone_number FROM users WHERE email = 'test@example.com';

-- Should show phone_number = '+14155551234'
```

---

## ✅ Complete Verification Checklist

### Data View Page:
- [ ] Can access `/data-view/{file_id}` after file upload
- [ ] See "Data Inspector" title
- [ ] See two tabs: "Raw & Review" and "Cleaned Data"
- [ ] Can view paginated data (50 rows per page)
- [ ] Can click "Finalize & Clean" button
- [ ] Can switch between tabs
- [ ] Cleaned tab appears after finalization

### Email Verification:
- [ ] Can request email verification
- [ ] Verification link appears in backend console
- [ ] Token is unique and saved to database
- [ ] Can verify email with token
- [ ] `is_verified` field updates to `true`
- [ ] User can't reuse the same token

### Phone OTP Verification:
- [ ] Can request OTP (requires login token)
- [ ] OTP appears in backend console
- [ ] OTP is 6 digits
- [ ] Can verify phone with correct OTP
- [ ] `phone_number` field updates in database
- [ ] Old OTPs are invalidated
- [ ] OTP expires after 10 minutes
- [ ] Can't reuse the same OTP

---

## 🐞 Troubleshooting

### Data View Page Issues:

#### Issue: "Cannot access /data-view"
**Solution:**
- Make sure you're logged in
- Check that the route is registered in `App.jsx`
- Verify `DataView.jsx` exists in `src/pages/`

#### Issue: "DataTable component not found"
**Solution:**
- Check if `DataTable.jsx` exists in `src/components/`
- Verify the import in `DataView.jsx`

#### Issue: "No data showing"
**Solution:**
- Verify the file_id exists in database
- Check backend endpoints are working
- Look for errors in browser console

---

### Email Verification Issues:

#### Issue: "Token not found in console"
**Solution:**
- Check backend terminal output
- Look for the separator lines: `==========`
- Token is printed between them

#### Issue: "Token expired"
**Solution:**
- Request a new token (they expire in 24 hours)
- Each token is one-time use only

---

### Phone OTP Issues:

#### Issue: "401 Unauthorized"
**Solution:**
- You need to be logged in
- Get a token from `/auth/login` first
- Include it in Authorization header

#### Issue: "OTP not in console"
**Solution:**
- Check the backend terminal (not frontend)
- Look for `OTP for +14155551234: 123456`

#### Issue: "Invalid OTP"
**Solution:**
- Copy the exact 6-digit code from console
- Make sure OTP hasn't expired (10 min limit)
- Check phone number matches exactly

---

## 🎯 Quick Test Script

### Test Everything in Order:

```bash
# 1. Signup
curl -X POST "http://localhost:8000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# 2. Request Email Verification
curl -X POST "http://localhost:8000/auth/email/request" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# (Copy token from console)

# 3. Verify Email
curl -X POST "http://localhost:8000/auth/email/verify" \
  -H "Content-Type: application/json" \
  -d '{"token":"PASTE_TOKEN_HERE"}'

# 4. Login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=test123"

# (Save the access_token)

# 5. Request OTP
curl -X POST "http://localhost:8000/auth/phone/otp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  -d '{"phone_number":"+14155551234"}'

# (Copy OTP from console)

# 6. Verify OTP
curl -X POST "http://localhost:8000/auth/phone/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  -d '{"phone_number":"+14155551234","otp_code":"123456"}'
```

---

## 📱 Frontend Integration (Optional)

To use these features in the frontend, you can create UI components that call:

```javascript
import { sendEmailVerification, verifyEmailToken, sendOTP, verifyOTP } from './services/api';

// Email verification
await sendEmailVerification('user@example.com');
await verifyEmailToken('token-from-email');

// Phone verification  
await sendOTP('+14155551234');
await verifyOTP('+14155551234', '123456');
```

---

**All features are ready to test!** 🚀
