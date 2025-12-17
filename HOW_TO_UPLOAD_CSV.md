# 📤 How to Upload CSV Files in Projects

## ✅ Current Upload Flow

The upload functionality **IS ALREADY WORKING** in the Projects page!

Here's how to use it:

---

## 🎯 Step-by-Step Upload Instructions

### 1. Go to Projects Page
- **URL:** http://localhost:5173/projects
- Or click "Projects" button in the header after login

### 2. Click on a Project
- If you don't have one, click **"New Project"** button first
- Create a project (e.g., "My Data Project")
- Then click on the project card

### 3. Upload CSV File
You'll now be on the Project Detail page where you can:

1. **Choose Upload Mode:**
   - 🔥 **Quick Clean** - Auto-process and apply changes
   - 👁️ **Review Mode** - Human-in-the-loop review

2. **Upload File:**
   - Click the dashed box that says "Click to upload CSV"
   - OR drag and drop your CSV file
   - Only `.csv` files are accepted

3. **Processing:**
   - File uploads and processes
   - If Quick Clean: Results appear in Run History
   - If Review Mode: Redirects to Review page

---

## 🎨 What the Upload Section Looks Like

```
┌─────────────────────────────────┐
│        New Run                  │
├─────────────────────────────────┤
│ [Quick Clean] [Review Mode]    │ <- Mode Toggle
│                                 │
│  ┌───────────────────────┐      │
│  │    📤 Upload Icon     │      │ <- Click here!
│  │  Click to upload CSV  │      │
│  │  or drag and drop     │      │
│  └───────────────────────┘      │
└─────────────────────────────────┘
```

---

## 🔧 If Upload Isn't Working

### Issue 1: Upload Button Not Visible
**Cause:** You're on the Projects LIST page, not Project DETAIL page  
**Solution:** Click on a project first

### Issue 2: Nothing Happens When Clicking
**Cause:** JavaScript error or file input not working  
**Solution:** 
- Check browser console (F12) for errors
- Make sure you selected a .csv file
- Try refreshing the page

### Issue 3: Upload Fails / Error Message
**Cause:** Backend endpoint not accessible  
**Solutions:**
- Check backend is running on port 8000
- Verify endpoint: `POST /api/projects/{project_id}/runs/upload`
- Check browser Network tab for actual error

---

## 🧪 Test the Upload Feature

### Quick Test:
1. Login to app
2. Go to Projects → Click "New Project"
3. Name it "Test Project" → Create
4. Click on the project card
5. You should see the upload section
6. Click the dashed box
7. Select a CSV file
8. Should process and show results

### Create Test CSV:
Save this as `test.csv`:
```csv
company_name,email,phone
Acme Corp,test@acme.com,+14155551234
XYZ Ltd,bad@gmial.com,+442071234567
```

---

## 📊 After Upload - What You'll See

### Quick Clean Mode:
1. File processes immediately
2. Appears in "Run History" section
3. Shows quality score, issues found, fixes applied
4. Click on run to see details

### Review Mode:
1. File uploads
2. Redirects to Review UI page
3. Shows all suggested changes
4. Accept/Reject each change
5. Download cleaned CSV

---

## 🎯 Upload Endpoint Details

**Backend Endpoint:**
```
POST /api/projects/{projectId}/runs/upload
Headers: Authorization: Bearer {token}
Body: multipart/form-data
  - file: CSV file
Query Params:
  - mode: "auto" or "review"
  - run_by: user email (optional)
```

**Frontend Code (services/api.js):**
```javascript
export const uploadToProject = (projectId, file, mode = "auto", runBy = null) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post(`/api/projects/${projectId}/runs/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    params: { mode, run_by: runBy }
  });
};
```

---

## ✅ Confirmation Upload is Working

The upload functionality is **already implemented** and includes:

✅ File input with drag & drop support  
✅ Mode toggle (Quick Clean / Review Mode)  
✅ Loading state while processing  
✅ Auto-clear input after upload  
✅ Error handling  
✅ Redirect to Review UI if review mode  
✅ Refresh run list after quick clean  

**Location:** `frontend/src/pages/ProjectDetail.jsx` lines 568-643

---

## 🚀 Alternative: Use Copilot for Quick Upload

If you just want to quickly test CSV validation without creating a project:

1. **Go to Copilot:** http://localhost:5173/copilot
2. **Upload CSV** (supports multiple files!)
3. **Choose mode** (Clean or Review)
4. **Get results** immediately

The Copilot is simpler for one-off uploads, while Projects are better for tracking multiple runs over time.

---

## 💡 Summary

**Upload works in 2 places:**

1. **Projects → Project Detail Page**
   - More organized
   - Tracks run history
   - Shows quality trends
   - Compare runs

2. **Copilot Page**
   - Faster for one-time use
   - Supports multiple files
   - Immediate results
   - Download cleaned CSV

**Both are fully functional!** Just need to navigate to the right page.

---

For questions or issues, check:
- Browser console for errors (F12)
- Network tab to see upload request
- Backend logs for processing errors
