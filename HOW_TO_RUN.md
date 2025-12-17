# 🚀 How to Run DataGuardian AI

## Prerequisites

Before running the project, make sure you have the following installed:

| Software | Version | Download Link |
|----------|---------|---------------|
| **Python** | 3.9 or higher | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | 9 or higher | Comes with Node.js |

---

## 📁 Project Structure

```
VETRI-DQX/
├── backend/          ← Python FastAPI Backend
│   ├── main.py       ← Main API server
│   ├── requirements.txt
│   └── data/
│       ├── sample.csv      ← Test data
│       ├── uploads/        ← Uploaded files
│       └── cleaned/        ← Cleaned output files
│
└── frontend/         ← React Frontend
    ├── package.json
    └── src/
```

---

## 🔧 Step 1: Setup Backend

Open a terminal and run these commands:

```bash
# Navigate to backend folder
cd d:\VETRI-DQX\backend

# Install Python dependencies
python -m pip install -r requirements.txt

# If you face bcrypt issues on Windows, also run:
python -m pip install argon2-cffi
```

---

## 🔧 Step 2: Setup Frontend

Open another terminal and run these commands:

```bash
# Navigate to frontend folder
cd d:\VETRI-DQX\frontend

# Install Node.js dependencies
npm install
```

---

## ▶️ Step 3: Run the Backend Server

In the first terminal (backend folder):

```bash
cd d:\VETRI-DQX\backend

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started reloader process
INFO:     Application startup complete.
```

**Backend URLs:**
- API Base: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- API Docs (ReDoc): http://localhost:8000/redoc

---

## ▶️ Step 4: Run the Frontend Server

In the second terminal (frontend folder):

```bash
cd d:\VETRI-DQX\frontend

npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Frontend URL:** http://localhost:5173

---

## 🌐 Step 5: Access the Application

1. Open your browser
2. Go to: **http://localhost:5173**
3. **Sign Up** with a new account
4. **Login** with your credentials
5. **Upload a CSV file** to clean your data!

---

## 📊 Test with Sample Data

Use the provided sample file to test:

**Location:** `d:\VETRI-DQX\backend\data\sample.csv`

This file contains sample B2B data with intentional errors that the AI will fix.

---

## 🛑 Stop the Servers

To stop the servers, press `Ctrl + C` in each terminal.

---

## 🔄 Quick Start Commands

### Windows (PowerShell)

**Terminal 1 - Backend:**
```powershell
cd d:\VETRI-DQX\backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd d:\VETRI-DQX\frontend
npm run dev
```

---

## 🐛 Troubleshooting

### Issue: "Module not found" error
```bash
# Reinstall dependencies
cd d:\VETRI-DQX\backend
python -m pip install -r requirements.txt
```

### Issue: "bcrypt" error on Windows
```bash
python -m pip install argon2-cffi
```

### Issue: "Port already in use"
```bash
# Kill the process using the port
# For port 8000:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# For port 5173:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: CORS error in browser
- Make sure both backend (port 8000) and frontend (port 5173) are running
- Frontend must use `http://localhost:5173` (not 127.0.0.1)

### Issue: "npm not found"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### Issue: "python not found"
- Install Python from https://www.python.org/
- Make sure to check "Add Python to PATH" during installation
- Restart your terminal

---

## 📱 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create new account |
| POST | `/auth/login` | Login and get JWT token |
| POST | `/upload-and-clean/` | Upload CSV and get cleaned data |

---

## 📂 Output Files

| Type | Location |
|------|----------|
| Uploaded Files | `backend/data/uploads/` |
| Cleaned Files | `backend/data/cleaned/` |
| Database | `backend/data/app.db` |

---

## 🎯 Test Credentials

You can create any account you want, or use:
- **Email:** test@test.com
- **Password:** test123

(If this account exists from previous testing)

---

## ✅ Checklist

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5173
- [ ] Browser opened to http://localhost:5173

---

## 🚀 You're Ready!

Once both servers are running, open http://localhost:5173 and start cleaning your data!

---

*Made with ❤️ for B2B Data Quality*
