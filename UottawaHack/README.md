# PharmaTrace AI 🏥

**AI-Powered Clinical Trial Matching System**

PharmaTrace uses Google's Gemini AI to extract patient data from medical PDFs and intelligently match patients with relevant clinical trials.

---

## 🎯 Features

- **Medical PDF Parsing**: Extract structured patient data (age, ethnicity, conditions, lab results) from medical documents
- **Smart Validation**: Detect and reject non-medical uploads (cat photos, random images, etc.)
- **Trial Matching**: AI-powered matching engine that compares patient profiles against trial eligibility criteria
- **Sample Data Generation**: Create realistic patient profiles and PDFs for demos
- **RESTful API**: FastAPI backend ready for integration with frontend and blockchain

---

## 📁 Project Structure

```
pharmatrace-ai/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── .env.template          # Environment variable template
├── test_setup.py          # Setup verification script
│
├── utils/                 # Core AI modules
│   ├── medical_extractor.py   # PDF → Patient Data extraction
│   ├── trial_matcher.py       # Patient → Trial matching
│   └── sample_generator.py    # Demo data generation
│
├── tests/                 # Test scripts
│   ├── test_sample_generator.py
│   └── test_extraction.py
│
├── sample_pdfs/          # Generated sample PDFs (created by tests)
└── uploads/              # Temporary upload directory (auto-created)
```

---

## 🚀 Setup Instructions

### 1. Prerequisites

- **Python 3.8+** (you already have 3.12.6 ✅)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Installation

```bash
# Navigate to the project directory
cd pharmatrace-ai

# Create a virtual environment
python3 -m venv pharmatrace-env

# Activate it
source pharmatrace-env/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Copy the template
cp .env.template .env

# Edit .env and add your API key
# Replace 'your_gemini_api_key_here' with your actual key
```

Your `.env` file should look like:
```
GEMINI_API_KEY=AIzaSyB...your_actual_key_here
MONGODB_URI=your_mongodb_connection_string_here
ENVIRONMENT=development
```

### 4. Verify Setup

```bash
python test_setup.py
```

You should see all checkmarks ✅

---

## 🧪 Testing the System

### Generate Sample Data

```bash
python tests/test_sample_generator.py
```

This creates:
- 3 sample patient profiles
- 3 sample medical record PDFs in `sample_pdfs/`
- Sample clinical trial data

### Test Extraction & Matching

```bash
python tests/test_extraction.py
```

This tests:
- Document validation (medical vs non-medical)
- Patient data extraction from PDFs
- Trial matching algorithm

---

## 🖥️ Running the API Server

```bash
python main.py
```

The server will start at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/upload-record` | Upload medical PDF for processing |
| GET | `/get-matches` | Retrieve matches for a patient |
| POST | `/confirm-consent` | Confirm patient consent |
| GET | `/sample-patients` | Get AI-generated sample patients |
| GET | `/sample-trials` | Get sample clinical trials |

---

## 📝 Usage Examples

### Upload a Medical Record

```bash
curl -X POST "http://localhost:8000/upload-record" \
  -F "file=@sample_pdfs/patient_a_medical_record.pdf"
```

Response:
```json
{
  "status": "success",
  "patient_data": {
    "age": 52,
    "ethnicity": "Hispanic",
    "conditions": ["Type 2 Diabetes", "Hypertension"],
    "lab_results": {...}
  },
  "matches": [
    {
      "trial_name": "Diabetes Management Study",
      "match_score": 92,
      "recommendation": "Excellent Match"
    }
  ],
  "total_matches": 2
}
```

### Test with Sample Data

```python
import requests

# Get sample patients
response = requests.get("http://localhost:8000/sample-patients")
patients = response.json()['patients']

# Get sample trials
response = requests.get("http://localhost:8000/sample-trials")
trials = response.json()['trials']
```

---

## 🔗 Integration Points

### For Luca (Backend/MongoDB):
- Use `/upload-record` response data to store in MongoDB
- Implement `/get-matches` to retrieve from your database
- Set up webhooks for status updates

### For Rushabh (Frontend):
- POST to `/upload-record` with FormData containing PDF
- Display patient_data and matches in UI
- Use `/sample-patients` to populate demo data

### For Devansh (Blockchain):
- Trigger smart contract from `/confirm-consent`
- Receive patient_id and trial_id
- Update blockchain consent records

---

## 🛡️ Error Handling

The system handles:
- **Invalid file types**: Only PDFs accepted
- **Non-medical documents**: Rejects cat photos, random images
- **Malformed PDFs**: Graceful error messages
- **API failures**: Proper error responses with status codes

Example error response:
```json
{
  "error": "Invalid document type",
  "message": "This appears to be a cat photo. Please upload a medical record.",
  "reason": "No medical information detected"
}
```

---

## 🎨 Demo Preparation Tips

1. **Pre-generate sample PDFs** before the demo
2. **Test the full pipeline** end-to-end
3. **Have backup data** in case API is slow
4. **Show the AI reasoning** (qualifying_factors, match_scores)
5. **Demonstrate error handling** with a cat photo upload

---

## 🐛 Troubleshooting

### "No API key found"
- Check your `.env` file exists
- Verify `GEMINI_API_KEY` is set correctly
- Make sure you're in the right directory

### "Package not found"
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### "Port 8000 already in use"
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn main:app --port 8001
```

---

## 📊 Performance Tips

- Use `gemini-1.5-flash` (already configured) for speed
- Set low temperature (0.1-0.2) for consistent JSON
- Pre-generate sample data before demos
- Cache trial data to reduce API calls

---

## 🚦 Next Steps

1. ✅ Complete setup verification
2. ✅ Generate sample data
3. ✅ Test extraction pipeline
4. 🔄 Integrate with Luca's MongoDB API
5. 🔄 Connect to Rushabh's frontend
6. 🔄 Link with Devansh's smart contracts

---

## 📞 Support

If you encounter issues:
1. Check the error message in terminal
2. Verify your `.env` file
3. Run `python test_setup.py`
4. Check API logs when running the server

---

## 🏆 Hackathon Judging Points

This module demonstrates:
- ✅ **Google Gemini Integration**: Advanced NLP for medical data
- ✅ **MongoDB Atlas Search**: Ready for Luca's integration
- ✅ **DigitalOcean Deployment**: FastAPI ready for App Platform
- ✅ **Error Handling**: Robust validation and recovery
- ✅ **Demo-Ready**: Sample data generation included

---

**Built for PharmaTrace Hackathon Project**  
*AI Module by Munun*

Good luck with the hackathon! 🚀
