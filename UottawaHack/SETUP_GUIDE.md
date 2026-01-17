# PharmaTrace AI - Mac Setup Guide

## 📋 What You're Getting

This is the **complete AI module** for PharmaTrace that handles:
- ✅ Medical PDF parsing (extracts patient data)
- ✅ Smart document validation (rejects cat photos!)
- ✅ Clinical trial matching (AI-powered eligibility checking)
- ✅ Sample data generation (for demos)
- ✅ RESTful API (FastAPI backend)

---

## 🎬 Quick Start (3 Steps)

### Step 1: Download & Navigate

```bash
# Download the zip and extract it
# Then open Terminal and navigate to the folder:
cd ~/Downloads/pharmatrace-ai
```

### Step 2: Get Your Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (looks like: AIzaSyB...)

### Step 3: Run the Quick Start Script

```bash
./quickstart.sh
```

This script will:
- Create a virtual environment
- Install all dependencies
- Create your .env file
- Verify everything works

When it asks for your API key, paste it into the `.env` file!

---

## 📝 Manual Setup (If Script Fails)

### 1. Create Virtual Environment

```bash
cd pharmatrace-ai
python3 -m venv pharmatrace-env
source pharmatrace-env/bin/activate
```

You should see `(pharmatrace-env)` in your terminal.

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- google-generativeai (Gemini API)
- FastAPI (web framework)
- PyPDF2 (PDF handling)
- ReportLab (PDF generation)
- And more...

### 3. Configure Environment

```bash
# Copy template
cp .env.template .env

# Edit with TextEdit or VS Code
open .env
```

Add your Gemini API key:
```
GEMINI_API_KEY=AIzaSyB...your_key_here
```

### 4. Verify Setup

```bash
python test_setup.py
```

You should see all ✅ checkmarks!

---

## 🧪 Testing the System

### Test 1: Generate Sample Data

```bash
python tests/test_sample_generator.py
```

**What this does:**
- Creates 3 sample patient profiles using AI
- Generates realistic medical PDFs
- Saves them to `sample_pdfs/` folder

**Expected output:**
```
✅ Generated 3 patient profiles:
--- Patient A ---
Age: 52
Ethnicity: Hispanic
Conditions: Type 2 Diabetes, Hypertension
```

### Test 2: Test Extraction & Matching

```bash
python tests/test_extraction.py
```

**What this does:**
- Validates each sample PDF
- Extracts patient data using Gemini
- Matches patients to clinical trials
- Shows match scores and reasoning

**Expected output:**
```
✅ Found 2 matching trial(s):
--- Match #1 ---
Trial: Diabetes Management Study
Score: 92/100
Recommendation: Excellent Match
```

---

## 🚀 Running the API Server

```bash
python main.py
```

**Server starts at:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

**Available endpoints:**
- `POST /upload-record` - Upload medical PDF
- `GET /sample-patients` - Get sample data
- `GET /sample-trials` - Get trial database

### Test the API

**In your browser:**
Go to http://localhost:8000/docs and try the interactive API!

**From command line:**
```bash
# Get sample patients
curl http://localhost:8000/sample-patients

# Upload a PDF
curl -X POST http://localhost:8000/upload-record \
  -F "file=@sample_pdfs/patient_a_medical_record.pdf"
```

---

## 🎯 For Your Team

### For Luca (Backend/MongoDB):

Your API should call my endpoints:

```python
import requests

# When user uploads PDF
response = requests.post(
    "http://localhost:8000/upload-record",
    files={"file": open("patient.pdf", "rb")}
)

patient_data = response.json()['patient_data']
matches = response.json()['matches']

# Save to MongoDB
db.patients.insert_one(patient_data)
```

### For Rushabh (Frontend):

```javascript
// Upload PDF from React
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('http://localhost:8000/upload-record', {
  method: 'POST',
  body: formData
});

const data = await response.json();
// Display data.patient_data and data.matches
```

### For Devansh (Blockchain):

When user confirms consent:

```python
# Your smart contract trigger
response = requests.post(
    "http://localhost:8000/confirm-consent",
    json={
        "patient_id": "abc123",
        "trial_id": "NCT001"
    }
)
```

---

## 🐛 Troubleshooting

### "ModuleNotFoundError"

```bash
# Make sure virtual environment is activated
source pharmatrace-env/bin/activate

# Reinstall packages
pip install -r requirements.txt
```

### "API key not found"

```bash
# Check your .env file exists
ls -la .env

# Open and verify it has your key
cat .env
```

### "Port already in use"

```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn main:app --port 8001
```

### Setup test fails

```bash
# Check Python version (need 3.8+)
python3 --version

# Check if packages installed
pip list | grep generativeai
```

---

## 📂 Project Structure Explained

```
pharmatrace-ai/
├── main.py                    # ← Your API server
├── requirements.txt           # ← All dependencies
├── .env                       # ← Your API keys (create this!)
├── README.md                  # ← Full documentation
├── quickstart.sh             # ← Easy setup script
│
├── utils/                     # ← Core AI logic
│   ├── medical_extractor.py  # ← PDF → Patient data
│   ├── trial_matcher.py      # ← Patient → Trial matching
│   └── sample_generator.py   # ← Demo data creation
│
├── tests/                     # ← Test scripts
│   ├── test_sample_generator.py
│   └── test_extraction.py
│
└── sample_pdfs/              # ← Generated PDFs (after running tests)
```

---

## ✅ Checklist Before Hackathon

- [ ] Python 3.8+ installed
- [ ] Virtual environment created
- [ ] All packages installed (`pip install -r requirements.txt`)
- [ ] Gemini API key added to `.env`
- [ ] `python test_setup.py` passes
- [ ] Sample PDFs generated
- [ ] API server runs successfully
- [ ] Tested with sample data

---

## 🎓 Understanding the Code

### How Medical Extraction Works

1. **Upload PDF** → Saved temporarily
2. **Validate** → Gemini checks if it's medical
3. **Extract** → Gemini pulls out structured data
4. **Match** → Compare against trial criteria
5. **Return** → JSON with results

### Key Files to Know

**`utils/medical_extractor.py`**
- `validate_medical_document()` - Rejects non-medical files
- `extract_patient_data()` - Gets age, ethnicity, conditions, labs

**`utils/trial_matcher.py`**
- `match_patient_to_trials()` - AI matching with scores

**`main.py`**
- `/upload-record` endpoint - Main workflow
- Error handling and validation

---

## 🚦 Next Steps

1. **Test everything locally** ✅
2. **Share API endpoint** with Luca for integration
3. **Generate demo PDFs** for presentation
4. **Document edge cases** (what if upload fails?)
5. **Prepare for judges** (show the AI reasoning!)

---

## 💡 Demo Tips

1. **Show the AI thinking**:
   - Display confidence scores
   - Show qualifying/disqualifying factors
   - Explain match scores

2. **Demonstrate error handling**:
   - Upload a cat photo (it will reject it!)
   - Upload incomplete PDF (shows graceful error)

3. **Highlight innovation**:
   - "We use Gemini 1.5 Flash for speed"
   - "AI understands medical terminology"
   - "Smart validation prevents bad data"

---

## 📞 Need Help?

If something breaks:

1. **Check the error message** (read it carefully!)
2. **Verify .env file** (is API key there?)
3. **Run test_setup.py** (does it pass?)
4. **Check virtual environment** (is it activated?)

Common fixes:
- `source pharmatrace-env/bin/activate`
- `pip install -r requirements.txt`
- Restart terminal and try again

---

**You're all set! Good luck with the hackathon! 🚀**

*Questions? Check the main README.md for more details.*
