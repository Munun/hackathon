# PharmaTrace AI - API Integration Guide

**For Luca, Rushabh, and Devansh**

This guide shows exactly how to integrate with the AI module.

---

## 🌐 Base URL

```
Local: http://localhost:8000
Production: https://your-digitalocean-app.com
```

---

## 📍 API Endpoints

### 1. Health Check

```http
GET /
```

**Response:**
```json
{
  "status": "healthy",
  "service": "PharmaTrace AI",
  "version": "1.0.0"
}
```

---

### 2. Upload Medical Record (Main Endpoint)

```http
POST /upload-record
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: PDF file

**cURL Example:**
```bash
curl -X POST http://localhost:8000/upload-record \
  -F "file=@patient_record.pdf"
```

**Python Example (for Luca):**
```python
import requests

with open('patient_record.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/upload-record',
        files={'file': f}
    )

data = response.json()
```

**JavaScript Example (for Rushabh):**
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('http://localhost:8000/upload-record', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Success Response (200):**
```json
{
  "status": "success",
  "patient_data": {
    "age": 52,
    "ethnicity": "Hispanic",
    "conditions": ["Type 2 Diabetes", "Hypertension"],
    "lab_results": {
      "HbA1c": "8.1%",
      "Fasting_Glucose": "156 mg/dL",
      "Blood_Pressure": "145/92 mmHg"
    },
    "confidence_score": 0.95
  },
  "matches": [
    {
      "trial_id": "NCT001",
      "trial_name": "Diabetes Management Study",
      "match_score": 92,
      "qualifying_factors": [
        "Patient has Type 2 Diabetes diagnosis",
        "HbA1c of 8.1% is within trial range (7.0-10.5%)"
      ],
      "disqualifying_factors": [],
      "recommendation": "Excellent Match",
      "confidence": 0.93
    }
  ],
  "total_matches": 2
}
```

**Error Response (400) - Invalid Document:**
```json
{
  "error": "Invalid document type",
  "message": "This appears to be a cat photo. Please upload a medical record.",
  "reason": "No medical information detected"
}
```

**Error Response (500) - Processing Failed:**
```json
{
  "error": "Extraction failed",
  "message": "AI returned malformed JSON"
}
```

---

### 3. Get Sample Patients (Demo Data)

```http
GET /sample-patients
```

**Response:**
```json
{
  "status": "success",
  "patients": [
    {
      "name": "Patient A",
      "age": 52,
      "ethnicity": "Hispanic",
      "conditions": ["Type 2 Diabetes"],
      "lab_results": {...}
    }
  ]
}
```

**Use Case:** Populate frontend demo or testing

---

### 4. Get Sample Trials

```http
GET /sample-trials
```

**Response:**
```json
{
  "status": "success",
  "trials": [
    {
      "id": "NCT001",
      "name": "Diabetes Management Study",
      "condition": "Type 2 Diabetes",
      "inclusion_criteria": "...",
      "exclusion_criteria": "..."
    }
  ],
  "count": 5
}
```

**Use Case:** Display available trials in UI

---

### 5. Confirm Consent (Future Integration)

```http
POST /confirm-consent
```

**Request Body:**
```json
{
  "patient_id": "abc123",
  "trial_id": "NCT001"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Consent recorded",
  "patient_id": "abc123",
  "trial_id": "NCT001",
  "next_step": "Smart contract will be executed"
}
```

---

## 🔗 Integration Patterns

### Pattern 1: Frontend Upload Flow (Rushabh)

```javascript
// React component
async function uploadPatientRecord(file) {
  setLoading(true);
  setError(null);
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('http://localhost:8000/upload-record', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const data = await response.json();
    
    // Display patient data
    setPatientData(data.patient_data);
    
    // Display matches
    setMatches(data.matches);
    
    setLoading(false);
  } catch (err) {
    setError(err.message);
    setLoading(false);
  }
}
```

---

### Pattern 2: Backend Storage (Luca)

```python
from pymongo import MongoClient
import requests
from datetime import datetime

client = MongoClient(MONGODB_URI)
db = client.pharmatrace

@app.post("/api/process-patient-upload")
async def process_upload(file: UploadFile):
    # Send to AI module
    ai_response = requests.post(
        'http://localhost:8000/upload-record',
        files={'file': file.file}
    )
    
    if ai_response.status_code != 200:
        raise HTTPException(status_code=400, detail=ai_response.json())
    
    data = ai_response.json()
    
    # Store in MongoDB
    patient_record = {
        'patient_data': data['patient_data'],
        'matches': data['matches'],
        'uploaded_at': datetime.utcnow(),
        'status': 'pending_consent',
        'consent_signed': False
    }
    
    result = db.patients.insert_one(patient_record)
    patient_id = str(result.inserted_id)
    
    # Use Atlas Search for trial matching
    # (Your MongoDB integration here)
    
    return {
        'patient_id': patient_id,
        'matches': data['matches']
    }
```

---

### Pattern 3: Blockchain Integration (Devansh)

```python
@app.post("/api/sign-consent")
async def sign_consent(patient_id: str, trial_id: str, wallet_address: str):
    # Get patient data from MongoDB (Luca's part)
    patient = db.patients.find_one({'_id': patient_id})
    
    # Create consent hash
    consent_hash = hash_consent(patient, trial_id)
    
    # Execute Solana smart contract
    tx_signature = await execute_consent_contract(
        patient_wallet=wallet_address,
        trial_id=trial_id,
        consent_hash=consent_hash
    )
    
    # Update MongoDB
    db.patients.update_one(
        {'_id': patient_id},
        {
            '$set': {
                'consent_signed': True,
                'tx_signature': tx_signature,
                'trial_enrolled': trial_id
            }
        }
    )
    
    # Notify AI module (optional webhook)
    requests.post(
        'http://localhost:8000/confirm-consent',
        json={'patient_id': patient_id, 'trial_id': trial_id}
    )
    
    return {'success': True, 'tx_signature': tx_signature}
```

---

## 🎨 Frontend UI Components (Rushabh)

### Upload Component

```jsx
import { useState } from 'react';

function PatientUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('http://localhost:8000/upload-record', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Upload failed');
    }
    
    setLoading(false);
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Analyzing...' : 'Upload & Analyze'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div>
          <h3>Patient Data Extracted</h3>
          <p>Age: {result.patient_data.age}</p>
          <p>Conditions: {result.patient_data.conditions.join(', ')}</p>
          
          <h3>Matching Trials ({result.total_matches})</h3>
          {result.matches.map(match => (
            <div key={match.trial_id}>
              <h4>{match.trial_name}</h4>
              <p>Match Score: {match.match_score}/100</p>
              <p>{match.recommendation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔒 Error Handling Best Practices

### Handle All Error Cases

```javascript
async function safeApiCall(endpoint, options) {
  try {
    const response = await fetch(endpoint, options);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle HTTP errors
      throw new Error(data.message || 'Request failed');
    }
    
    if (data.error) {
      // Handle application errors
      throw new Error(data.error);
    }
    
    return data;
    
  } catch (err) {
    // Handle network errors
    if (err.message === 'Failed to fetch') {
      throw new Error('Server is not responding');
    }
    throw err;
  }
}
```

---

## 📊 Response Data Structure

### Patient Data Object

```typescript
interface PatientData {
  age: number;
  ethnicity: string;
  conditions: string[];
  lab_results: {
    [testName: string]: string;
  };
  confidence_score: number;  // 0.0 - 1.0
}
```

### Match Object

```typescript
interface TrialMatch {
  trial_id: string;
  trial_name: string;
  match_score: number;  // 0-100
  qualifying_factors: string[];
  disqualifying_factors: string[];
  recommendation: "Excellent Match" | "Good Match" | "Possible Match" | "Poor Match" | "No Match";
  confidence: number;  // 0.0 - 1.0
}
```

---

## 🧪 Testing the Integration

### Use Sample Data First

```javascript
// Test with sample patients
const sampleResponse = await fetch('http://localhost:8000/sample-patients');
const sampleData = await sampleResponse.json();

// Use sample data to populate UI
console.log(sampleData.patients);
```

### Test Error Handling

```bash
# Test with invalid file
curl -X POST http://localhost:8000/upload-record \
  -F "file=@cat_photo.jpg"

# Should return error about invalid document
```

---

## 🚀 Deployment Checklist

- [ ] Change base URL from localhost to production
- [ ] Add CORS configuration for your domain
- [ ] Set up error logging
- [ ] Add rate limiting
- [ ] Configure MongoDB connection string
- [ ] Test all endpoints in production
- [ ] Monitor API response times

---

## 📞 Support

**If you encounter integration issues:**

1. Check API is running: `curl http://localhost:8000/`
2. Verify response format matches this guide
3. Check network tab in browser DevTools
4. Test with sample endpoints first

**Common Issues:**

- CORS errors → Check API middleware settings
- 400 errors → Verify request format
- 500 errors → Check API logs (`python main.py`)
- Timeout → AI processing can take 5-15 seconds

---

**Integration complete! Your modules should now work together seamlessly.** 🎉
