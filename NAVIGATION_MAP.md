# 🗺️ Application Navigation Map

Quick reference for finding all pages and features.

---

## 📱 Frontend Pages & URLs

### Main Navigation:

| Page | URL | How to Access |
|------|-----|---------------|
| **Landing** | `/` | Home page with branding |
| **Login** | `/login` | Click "Login" from landing |
| **Signup** | `/signup` | Click "Sign Up" from landing |
| **Dashboard** | `/dashboard` | After login (main page) |
| **Profile** | `/profile` | Click profile avatar in header |
| **Settings** | `/settings` | Click settings icon in header |

---

### Feature Pages:

| Feature | URL | How to Access |
|---------|-----|---------------|
| **Data Quality Copilot** | `/copilot` | Click "Open Copilot →" button on Dashboard |
| **Projects** | `/projects` | Click "Projects" button in header |
| **Project Detail** | `/projects/{id}` | Click on a project from Projects list |
| **Data View / Inspector** | `/data-view/{fileId}` | After uploading a file, use the file ID |
| **Review UI** | `/review?session={sessionId}` | Click "Send to Review" from Copilot |

---

## 🎯 How to Find Each Feature

### 1. **Data Quality Copilot** 🧹
```
Dashboard → "Open Copilot →" button
```
- Upload single or multiple CSV files
- Choose Clean or Review mode
- Download cleaned results

**Direct URL:** `http://localhost:5173/copilot`

---

### 2. **Data Inspector / Data View** 🔍
```
Method 1: Projects → Upload File → Use file_id
Method 2: Direct URL with file ID
```
- View original data with AI suggestions
- See cleaned data after finalization
- Paginated table view

**Example URL:** `http://localhost:5173/data-view/1`

---

### 3. **Review UI** 👁️
```
Copilot → Select Review Mode → Send to Review
```
- Human-in-the-loop workflow
- Accept/Reject AI suggestions
- Manual override option
- Download cleaned CSV after review

**Example URL:** `http://localhost:5173/review?session=abc-123`

---

### 4. **Projects Management** 📁
```
Dashboard → Header → "Projects" button
```
- Create new projects
- View all projects
- Manage project details
- Track quality over time

**Direct URL:** `http://localhost:5173/projects`

---

### 5. **Profile & Settings** ⚙️
```
Header → Profile Avatar or Settings Icon
```
- Update user information
- Change themes
- Configure preferences

**URLs:**
- Profile: `http://localhost:5173/profile`
- Settings: `http://localhost:5173/settings`

---

## 🎨 Theme Selector

**Location:** Top-right corner of every page (usually in header)

**How to Use:**
1. Click the theme selector icon
2. Choose from available themes
3. Toggle dark/light mode
4. All pages update instantly

---

## 🔐 Authentication Flow

### New User:
```
Landing Page (/)
  ↓
Sign Up (/signup)
  ↓
Login (/login)
  ↓
Dashboard (/dashboard)
```

### Returning User:
```
Landing Page (/)
  ↓
Login (/login)
  ↓
Dashboard (/dashboard)
```

---

## 📋 Typical User Journey

### Scenario 1: Quick Data Cleaning
```
1. Login
2. Dashboard → Click "Open Copilot →"
3. Upload CSV file(s)
4. Select "Clean" mode
5. Click "Analyse and Clean"
6. Download cleaned CSV
```

### Scenario 2: Review & Approve Changes
```
1. Login
2. Dashboard → Click "Open Copilot →"
3. Upload CSV file
4. Select "Review" mode
5. Click "Send to Review"
6. ReviewUI page opens
7. Accept/Reject changes
8. Click "Apply Changes"
9. Download cleaned CSV
```

### Scenario 3: Project-Based Workflow
```
1. Login
2. Click "Projects" in header
3. Create new project
4. Upload files to project
5. View data in Data Inspector
6. Track quality metrics over time
```

---

## 🧪 API Testing (Backend Only)

### Swagger UI:
**URL:** `http://localhost:8000/docs`

**Available Endpoints:**
- `/auth/*` - Authentication & Verification
- `/api/projects/*` - Project management
- `/api/upload-csv` - Quick CSV validation
- `/upload-and-clean/` - Auto-clean workflow
- `/upload-for-review/` - Review workflow
- `/files/*` - File management
- `/review/*` - Review data access

---

## 🎯 Quick Access Checklist

For easy verification, check you can access:

### After Login:
- [ ] Dashboard page loads
- [ ] Profile page accessible (click avatar)
- [ ] Settings page accessible (click gear icon)
- [ ] Projects page accessible (click Projects button)
- [ ] Copilot page accessible (click Open Copilot button)

### After Uploading File:
- [ ] Data Inspector shows data (use file_id)
- [ ] Can switch between Raw and Cleaned tabs
- [ ] Can finalize cleaning

### After Review Mode:
- [ ] ReviewUI page loads with session
- [ ] Can see all suggested changes
- [ ] Can apply changes
- [ ] Download button appears

---

## 🔍 Where to Find Features

### Navigation Bar (Header):
```
[Logo] [Projects Button] [Profile Avatar] [Settings] [Logout]
                                           [Theme Selector]
```

### Dashboard:
```
+----------------------------------+
| Hero Section                     |
| - Title                          |
| - Theme selector                 |
+----------------------------------+
| Feature Cards                    |
| - Smart Validation               |
| - Duplicate Detection            |
| - Auto Correction                |
+----------------------------------+
| Main Content Area                |
| [Open Copilot Button]            |
| [How It Works]                   |
+----------------------------------+
```

### Copilot Page:
```
+----------------------------------+
| [← Back]  Data Quality Copilot   |
|                    [Theme Sel]   |
+----------------------------------+
| Upload Section                   |
| - File selector                  |
| - Selected files list            |
| - [Clean] [Review] buttons       |
| - [Analyse and Clean] button     |
+----------------------------------+
| Results Table (after processing) |
| - Row data                       |
| - Validation status              |
| - Suggestions                    |
| [Download CSV] button            |
+----------------------------------+
```

---

## 📊 Database-Linked Pages

These pages pull data from PostgreSQL:

| Page | Database Tables Used |
|------|---------------------|
| Dashboard | `users`, `projects` |
| Projects | `projects`, `runs` |
| Project Detail | `projects`, `runs` |
| Data Inspector | `uploaded_files`, `raw_records`, `review_suggestions`, `cleaned_records` |
| Review UI | Session data (in-memory or from `/review` endpoint) |

---

## 🎉 All Pages Summary

**Total Pages:** 10+

1. ✅ Landing Page (`/`)
2. ✅ Login (`/login`)
3. ✅ Signup (`/signup`)
4. ✅ Dashboard (`/dashboard`)
5. ✅ Profile (`/profile`)
6. ✅ Settings (`/settings`)
7. ✅ Copilot (`/copilot`)
8. ✅ Projects (`/projects`)
9. ✅ Project Detail (`/projects/:id`)
10. ✅ Data Inspector (`/data-view/:fileId`)
11. ✅ Review UI (`/review`)

**All pages are theme-aware and responsive!** 🎨

---

For detailed testing instructions, see:
- `HOW_TO_VERIFY.md`
- `DATA_VIEW_AND_VERIFICATION_GUIDE.md`
