# Backend-Frontend Integration Guide

## 📋 Overview

This guide explains how to connect the **UottawaHack** Python FastAPI backend to the React TypeScript frontend.

### Architecture
- **Frontend**: React 19 + TypeScript + Vite (port `5173`)
- **Backend**: FastAPI + Gemini AI (port `8000`)
- **Communication**: REST API with CORS enabled

---

## 🚀 Quick Start

### 1. Backend Setup (Python)

```bash
cd UottawaHack

# Activate virtual environment
source pharmatrace-env/bin/activate

# Create .env file with your Gemini API key
cat > .env << EOF
GEMINI_API_KEY=your_gemini_api_key_here
EOF

# Install dependencies (if needed)
pip install -r requirements.txt

# Start the backend server
python main.py
```

The backend will be available at: `http://localhost:8000`

**API Documentation**: Open `http://localhost:8000/docs` in your browser for interactive API docs.

---

### 2. Frontend Setup (React/TypeScript)

```bash
# Navigate to root directory
cd /workspaces/hackathon

# Install dependencies
npm install

# The .env.local file is already created with:
# VITE_API_BASE_URL=http://localhost:8000

# Start dev server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

---

## 🔗 API Endpoints Overview

### Upload & Process Medical Records

**POST** `/upload-record`
- Accepts: PDF file (multipart/form-data)
- Returns: Extracted patient data + clinical trial matches
- Used by: Patient Dashboard

```typescript
import { uploadRecord } from './src/utils'

const response = await uploadRecord(pdfFile);
// Response:
// {
//   status: "success",
//   patient_data: { age, ethnicity, conditions, lab_results, confidence_score },
//   matches: [ { trial_id, trial_name, match_score, ... } ],
//   total_matches: number
// }
```

### Confirm Patient Consent

**POST** `/confirm-consent`
- Body: `{ patient_id: string, trial_id: string }`
- Returns: Confirmation with next steps

```typescript
import { confirmConsent } from './src/utils'

await confirmConsent({
  patient_id: "unique_patient_id",
  trial_id: "trial_id"
});
```

### Get Sample Data (for testing)

**GET** `/sample-patients`
- Returns: Array of sample patient records

**GET** `/sample-trials`
- Returns: Array of available clinical trials

### Health Check

**GET** `/`
- Returns: Service status and version

---

## 📝 Frontend Types

All API response types are defined in [src/utils.ts](src/utils.ts):

```typescript
type UploadRecordResponse = {
  status: "success";
  patient_data: PatientData;
  matches: TrialMatch[];
  total_matches: number;
};

type TrialMatch = {
  trial_id: string;
  trial_name: string;
  match_score: number;
  qualifying_factors: string[];
  disqualifying_factors: string[];
  recommendation: string;
  confidence: number;
};
```

---

## 🔐 Environment Variables

### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:8000
```

For production, update to your deployed backend URL.

### Backend (.env in UottawaHack/)
```env
GEMINI_API_KEY=your_api_key_here
```

Get your free API key from: https://aistudio.google.com/app/apikey

---

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
- Make sure backend is running on `http://localhost:8000`
- Check that `VITE_API_BASE_URL` in `.env.local` matches
- Backend already has CORS configured for `localhost:5173`

### Backend Won't Start
```bash
# Make sure virtual environment is activated
source pharmatrace-env/bin/activate

# Check Python version (requires 3.9+)
python --version

# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### File Upload Fails
- Only PDF files are supported
- Check backend logs for Gemini API key errors
- Ensure `.env` file in `UottawaHack/` has valid `GEMINI_API_KEY`

### API Returns 404
- Verify backend is running: `curl http://localhost:8000/`
- Check your endpoint path (should include `/upload-record`, not `/api/upload-record`)

---

## 📚 Current Implementation Status

### ✅ Completed
- [x] Backend: FastAPI with medical PDF extraction
- [x] Backend: Clinical trial matching algorithm
- [x] Frontend: Patient Dashboard with file upload
- [x] Frontend: API client utilities (`src/utils.ts`)
- [x] Frontend: Environment variables configuration
- [x] CORS configuration for localhost development

### 🔄 In Progress / Future
- [ ] Researcher Dashboard: Connect to trial matching API
- [ ] Authentication: Implement real user authentication (Supabase/Firebase)
- [ ] Database: Connect MongoDB for persistent storage
- [ ] Smart Contracts: Blockchain consent recording
- [ ] Advanced Search: Filter trials by specific criteria

---

## 🎯 Integration Checklist

- [x] Backend running on port 8000
- [x] Frontend running on port 5173
- [x] `.env.local` file created in frontend root
- [x] `GEMINI_API_KEY` set in UottawaHack/.env
- [x] API endpoints wired in `src/utils.ts`
- [x] Patient Dashboard calling `uploadRecord()`
- [ ] Researcher Dashboard populated with real trial data
- [ ] Consent button calls `confirmConsent()`

---

## 💡 Next Steps

1. **Test the upload flow**: 
   - Start both servers
   - Open frontend and upload a sample PDF
   - Check that patient data and matches appear

2. **Wire consent button**:
   - Update `patientDash.tsx` "Sign Consent" button
   - Call `confirmConsent()` with patient and trial IDs

3. **Populate researcher data**:
   - Update `researcherDash.tsx` to call `getSampleTrials()` and `getSamplePatients()`
   - Display real data instead of hardcoded values

4. **Add authentication**:
   - Implement real login (researcher auth is currently a mock)
   - Store user session/token

---

## 📞 Support

For API issues, check the interactive docs: `http://localhost:8000/docs`

For frontend issues, check browser DevTools Console and Network tab.
