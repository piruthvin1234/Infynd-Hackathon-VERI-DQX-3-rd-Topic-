# 🛡️ DataGuardian AI
## AI-Powered Data Quality Guardian for B2B Datasets

A full-stack SaaS platform that uses AI and rule-based validation to clean, standardize, deduplicate, and validate B2B datasets with confidence scoring and multi-user authentication.

---

## ✨ Features

- **🔍 Smart Validation** - AI-powered field validation for emails, domains, phone numbers
- **🔧 Auto Correction** - Intelligent fixes with confidence scoring
- **👥 Duplicate Detection** - Find and merge duplicate companies/contacts
- **📊 Job Title Normalization** - Map unstructured titles to standard functions
- **📈 Quality Scoring** - Get a data quality score (0-100)
- **🔐 Multi-User Auth** - JWT-based authentication with user isolation
- **🤖 LLM Integration** - Optional OpenAI integration for smart corrections

---

## 🏗️ Project Structure

```
VETRI-DQX/
├── backend/
│   ├── src/
│   │   ├── validators.py      # Email, field validation
│   │   ├── corrector.py       # Domain correction (fuzzy matching)
│   │   ├── deduplicator.py    # Duplicate detection
│   │   ├── job_mapper.py      # Job title normalization
│   │   ├── scorer.py          # Quality score calculation
│   │   ├── llm_corrector.py   # LLM-based corrections
│   │   └── pipeline.py        # Main orchestration
│   ├── data/
│   │   ├── sample.csv         # Sample test data
│   │   ├── uploads/           # Uploaded files
│   │   └── cleaned/           # Cleaned output files
│   ├── main.py                # FastAPI application
│   ├── database.py            # SQLAlchemy setup
│   ├── models.py              # User model
│   ├── schemas.py             # Pydantic schemas
│   ├── auth.py                # JWT authentication
│   └── requirements.txt       # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── UploadCard.jsx     # File upload component
    │   │   ├── ReportCards.jsx    # QA metrics cards
    │   │   └── QualityChart.jsx   # Quality visualization
    │   ├── pages/
    │   │   ├── Login.jsx          # Login page
    │   │   ├── Signup.jsx         # Registration page
    │   │   └── Dashboard.jsx      # Main dashboard
    │   ├── services/
    │   │   └── api.js             # API service
    │   ├── App.jsx                # Main app with routing
    │   ├── main.jsx               # Entry point
    │   └── index.css              # Tailwind styles
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm

### 1. Backend Setup

```bash
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Run the server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API Docs (Swagger): `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login (returns JWT) |

### Data Processing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload-and-clean/` | Upload CSV & get cleaned data |

---

## 📊 Sample Input CSV Format

```csv
company_name,domain,email,job_title
Gogle,gogle.com,wrongmail,Software Engineer
Amazon,amazon.com,john@amazon.com,Account Executive
```

---

## 📈 Sample Output

### QA Report
```json
{
  "message": "File cleaned successfully",
  "qa_report": {
    "issues_found": 3,
    "fixes_applied": 2,
    "quality_score": 87.5
  },
  "cleaned_file_path": "data/cleaned/cleaned_input.csv"
}
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` folder:

```env
OPENAI_API_KEY=your_api_key_here  # Optional: for LLM features
SECRET_KEY=your_jwt_secret        # For production
```

---

## 🧠 AI/ML Techniques Used

1. **Fuzzy String Matching** - RapidFuzz for domain/name correction
2. **Rule-Based Validation** - Regex for email, URL validation
3. **NLP Classification** - Keyword matching for job title normalization
4. **Confidence Scoring** - Similarity-based confidence (0-1)
5. **LLM Integration** - Optional OpenAI for smart corrections

---

## 🎯 Use Cases

- ✅ CRM Data Cleaning (Salesforce, HubSpot)
- ✅ Lead Enrichment Platforms
- ✅ Marketing Automation
- ✅ Data Vendor Quality Assurance
- ✅ Enterprise Data Governance

---

## 📱 Screenshots

The application features:
- Modern glassmorphism UI design
- Dark/Light theme support
- Animated gradients and micro-interactions
- Responsive mobile-first layout
- Real-time data quality visualization

---

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- User-isolated file storage
- CORS protection

---

## 📝 License

MIT License - Feel free to use for learning and commercial purposes.

---

## 👨‍💻 Built With

- **Backend**: Python, FastAPI, SQLAlchemy, Pandas, RapidFuzz
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Auth**: JWT, bcrypt
- **AI**: Rule-based + Optional LLM (OpenAI)

---

Made with ❤️ for B2B Data Quality
