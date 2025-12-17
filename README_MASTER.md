# 🎯 VETRI DQX - Master Index

Your complete guide to the DataGuardian AI application.

---

## 📚 Documentation Index

### Quick Start Guides:
1. **[HOW_TO_RUN.md](HOW_TO_RUN.md)** - Start here! Setup and run instructions
2. **[NAVIGATION_MAP.md](NAVIGATION_MAP.md)** - Find all pages and features
3. **[HOW_TO_VERIFY.md](HOW_TO_VERIFY.md)** - Quick verification checklist

### Feature Guides:
4. **[DATA_VIEW_AND_VERIFICATION_GUIDE.md](DATA_VIEW_AND_VERIFICATION_GUIDE.md)** - Data Inspector + Email/Phone verification
5. **[BACKEND_TESTING.md](BACKEND_TESTING.md)** - Test backend API independently
6. **[PROJECTS_FIX_VERIFICATION.md](PROJECTS_FIX_VERIFICATION.md)** - Projects feature testing

### Fix Documentation:
7. **[PROJECTS_FIX_SUMMARY.md](PROJECTS_FIX_SUMMARY.md)** - What was fixed in Projects page

---

## 🚀 Getting Started (3 Steps)

### 1. Start the Application
```bash
# Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/docs

---

### 2. Create an Account
1. Go to: http://localhost:5173/signup
2. Fill in:
   - Name
   - Email
   - Password
3. Click "Sign Up"

---

### 3. Explore Features
After login, try:
- **Dashboard** → Overview and navigation
- **Copilot** → Quick CSV cleaning
- **Projects** → Organized workspace
- **Data Inspector** → View detailed results

---

## 🎯 Core Features Overview

### 1. Data Quality Copilot 🧹
**What:** AI-powered CSV validation and cleaning  
**Where:** Dashboard → "Open Copilot →"  
**Modes:**
- **Clean** - Automatic cleaning and download
- **Review** - Human-in-the-loop approval workflow

**Capabilities:**
✅ Email validation and typo detection  
✅ Phone number validation (global formats)  
✅ Multiple file upload support  
✅ Downloadable results  

---

### 2. Data Inspector 🔍
**What:** View and inspect data with AI suggestions  
**Where:** `/data-view/{file_id}`  
**Features:**
- Raw data view with suggestions
- Cleaned data view (after finalization)
- Pagination (50 rows per page)
- Accept/reject suggestions

---

### 3. Review UI 👁️
**What:** Detailed review workflow for data changes  
**Where:** Copilot → Review mode  
**Features:**
- See all suggested changes
- Accept/reject individual changes
- Manual override option
- Bulk actions (Accept All/Reject All)
- Download cleaned CSV after review

---

### 4. Projects Management 📁
**What:** Organize work by project  
**Where:** Header → "Projects" button  
**Features:**
- Create projects
- Upload files to projects
- Track quality metrics
- View project timeline

---

### 5. Email Verification 📧
**What:** Verify user email addresses  
**Backend Endpoints:**
- `POST /auth/email/request` - Request verification
- `POST /auth/email/verify` - Verify with token

**How:** Token appears in backend console

---

### 6. Phone Verification 📱
**What:** Verify phone numbers via OTP  
**Backend Endpoints:**
- `POST /auth/phone/otp` - Request OTP (requires auth)
- `POST /auth/phone/verify` - Verify OTP

**How:** OTP code appears in backend console

---

## 🗺️ Application Structure

### Frontend (React + Vite):
```
frontend/src/
├── pages/
│   ├── Dashboard.jsx          - Main landing after login
│   ├── DataQualityCopilot.jsx - CSV upload and cleaning
│   ├── DataView.jsx           - Data inspection page
│   ├── ReviewUI.jsx           - Review workflow page
│   ├── Projects.jsx           - Projects list
│   └── Profile.jsx            - User profile
├── components/
│   ├── DataTable.jsx          - Table display component
│   ├── ThemeSelector.jsx      - Theme switcher
│   └── ...
├── services/
│   └── api.js                 - API calls to backend
└── context/
    ├── ThemeContext.jsx       - Theme management
    └── UserContext.jsx        - User state
```

### Backend (FastAPI):
```
backend/
├── main.py                    - Main app with all routes
├── routes/
│   ├── projects.py            - Project endpoints (/api/projects)
│   ├── upload.py              - CSV upload (/api/upload-csv)
│   └── verification.py        - Email/Phone verification
├── services/
│   └── data_quality.py        - CSV validation logic
├── models.py                  - Database models
└── schemas.py                 - Pydantic schemas
```

---

## 🎨 Theme Support

**Available Themes:**
- Modern Blue (Default)
- Purple Dream
- Sunset Orange
- Forest Green
- Professional Gray

**Dark/Light Mode:** All themes support both

**Where:** Theme selector in header (top-right)

---

## ✅ Feature Verification Quick Reference

### Data View Page:
```
1. Upload CSV via Projects or Copilot
2. Get file_id from response
3. Navigate to: /data-view/{file_id}
4. Verify:
   ✅ Page loads
   ✅ Data table shows
   ✅ Can switch tabs
```

### Email Verification:
```
1. POST /auth/email/request with email
2. Copy token from backend console
3. POST /auth/email/verify with token
4. Check database: is_verified = true
```

### Phone Verification:
```
1. Login to get auth token
2. POST /auth/phone/otp with phone number
3. Copy OTP from backend console (6 digits)
4. POST /auth/phone/verify with OTP
5. Check database: phone_number updated
```

### CSV Processing:
```
Clean Mode:
1. Copilot → Upload CSV
2. Choose "Clean"
3. Click "Analyse and Clean"
4. Download results

Review Mode:
1. Copilot → Upload CSV
2. Choose "Review"
3. Click "Send to Review"
4. Review changes
5. Apply and download
```

---

## 🐞 Troubleshooting

### Common Issues:

| Issue | Solution |
|-------|----------|
| 404 Error | Check backend running on port 8000 |
| CORS Error | Verify frontend origin in main.py CORS config |
| Token Expired | Request new token (24h expiry for email, 10min for OTP) |
| Database Error | Check PostgreSQL running, verify .env config |
| Data View Not Loading | Verify file_id exists, check browser console |
| Review Page Empty | Check session_id in URL parameter |

---

## 📊 Database Tables

Key tables used:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, password, is_verified, phone_number) |
| `projects` | Project workspaces |
| `uploaded_files` | File upload records |
| `runs` | Processing run history |
| `email_verification_tokens` | Email verification tokens |
| `otp_logs` | Phone OTP codes |
| `review_suggestions` | AI suggestions for review |
| `raw_records` | Original uploaded data |
| `cleaned_records` | Cleaned/validated data |

---

## 🎓 Learning Path

### For New Users:
1. Read: `HOW_TO_RUN.md` → Setup the app
2. Read: `NAVIGATION_MAP.md` → Find features
3. Test: Run through `HOW_TO_VERIFY.md` checklist

### For Developers:
1. Read: `BACKEND_TESTING.md` → Test APIs
2. Read: `DATA_VIEW_AND_VERIFICATION_GUIDE.md` → Understand flows
3. Read: `PROJECTS_FIX_VERIFICATION.md` → See fixes applied

### For QA/Testing:
1. Use: `HOW_TO_VERIFY.md` → Quick checks
2. Use: Backend Swagger UI → Manual API testing
3. Use: Browser DevTools → Frontend debugging

---

## 🔗 API Endpoints Summary

### Authentication:
- `POST /auth/signup` - Create account
- `POST /auth/login` - Get JWT token
- `POST /auth/email/request` - Request email verification
- `POST /auth/email/verify` - Verify email
- `POST /auth/phone/otp` - Request OTP (requires auth)
- `POST /auth/phone/verify` - Verify OTP

### Data Processing:
- `POST /api/upload-csv` - Quick validation (no auth)
- `POST /upload-and-clean/` - Auto-clean
- `POST /upload-for-review/` - Review workflow

### Projects:
- `POST /api/projects/` - Create project
- `GET /api/projects/` - List projects
- `GET /api/projects/{id}` - Get project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Runs:
- `POST /api/projects/{id}/runs/upload` - Upload to project
- `GET /api/projects/{id}/runs` - List runs
- `GET /api/projects/{id}/runs/{runId}` - Get run details

---

## 📞 Quick Command Reference

### Start Servers:
```bash
# Backend
cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend && npm run dev
```

### Database:
```bash
# Connect to PostgreSQL
psql -U postgres -d vetri_dqx

# Common queries
SELECT * FROM users;
SELECT * FROM projects;
SELECT * FROM uploaded_files;
```

### API Testing:
```bash
# Signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@test.com&password=test123"
```

---

## 🎉 Success Checklist

Application is working correctly when:

- [ ] Backend runs on port 8000
- [ ] Frontend runs on port 5173
- [ ] Can create account and login
- [ ] Can upload CSV files
- [ ] Data Inspector shows data
- [ ] Copilot Clean mode works
- [ ] Copilot Review mode works
- [ ] Projects can be created
- [ ] Email verification works
- [ ] Phone OTP verification works
- [ ] Themes can be switched
- [ ] All pages load without errors

---

## 📖 Next Steps

1. ✅ **Read this file** - You're here!
2. ✅ **Setup & Run** - Follow `HOW_TO_RUN.md`
3. ✅ **Explore** - Use `NAVIGATION_MAP.md` to find features
4. ✅ **Verify** - Test with `HOW_TO_VERIFY.md`
5. ✅ **Deep Dive** - Read feature-specific guides for details

---

**Version:** 1.0  
**Last Updated:** 2025-12-17  
**Project:** VETRI DQX - DataGuardian AI

*For detailed information on any feature, refer to the specific guide listed in the Documentation Index above.*
