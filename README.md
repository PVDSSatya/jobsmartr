# Job Smartr — Local Running Guide

AI-powered career intelligence & ATS resume optimization platform.

---

## 🚀 Quick Start (Running Locally)

Both servers are currently running and accessible at:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000) (Interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs))

### One-Click Launch Script
To start both servers in separate windows at any time:
```cmd
run-local.bat
```

Or start them individually:
- **Backend**: Double-click `start-backend.bat`
- **Frontend**: Double-click `start-frontend.bat`

---

## 🛠 Manual Execution

### 1. Backend (FastAPI + Python)
```powershell
cd backend
.\venv\Scripts\uvicorn.exe server:app --host 127.0.0.1 --port 8000 --reload
```
The backend uses:
- Python virtual environment in `backend/venv`
- `backend/.env` with configuration for MongoDB and JWT keys
- Resilient MongoDB connection: connects to live MongoDB (e.g. `mongodb://localhost:27017` or Atlas), with automatic in-memory fallback if no server is running.

### 2. Frontend (React 19 + TailwindCSS)
```powershell
cd frontend
npm.cmd start
```
Frontend runs on [http://localhost:3000](http://localhost:3000) and communicates with `http://localhost:8000`.

---

## 🧪 Running Automated Tests

Run the full end-to-end backend test suite (28 test cases covering Auth, PDF/DOCX Parsing, ATS Scoring, Heatmap, Job Match, Free/Pro limits, and Affiliate commissions):
```powershell
$env:REACT_APP_BACKEND_URL="http://localhost:8000"
backend\venv\Scripts\pytest.exe backend\tests\test_backend.py -v
```

---

## 🔑 AI LLM Configuration (Optional)
The project is configured out-of-the-box with a built-in intelligent fallback generator that simulates real ATS analysis, heatmap generation, job matches, and bullet rewriting.

To connect live Claude/OpenAI APIs, set your API key in `backend/.env`:
```env
# In backend/.env
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```
