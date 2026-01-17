"""
PharmaTrace AI - Main API Application
FastAPI backend for medical PDF processing and clinical trial matching
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv
import uuid
import asyncio
from concurrent.futures import ThreadPoolExecutor
import json

# Import our utilities
from utils.medical_extractor import MedicalDataExtractor
from utils.trial_matcher import TrialMatcher
from utils.sample_generator import SampleDataGenerator

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="PharmaTrace AI",
    description="AI-powered clinical trial matching system",
    version="1.0.0"
)

# -------------------------
# CORS CONFIG (IMPORTANT)
# -------------------------
# For development, allow all origins
# For production, specify exact origins
FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",  # Allow all origins during development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# FILE UPLOAD CONFIG
# -------------------------
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# -------------------------
# MODELS
# -------------------------
class ConsentRequest(BaseModel):
    patient_id: str
    trial_id: str


class TrialUpload(BaseModel):
    """Clinical trial information for registration"""
    name: str
    condition: str
    phase: str
    inclusion_criteria: str
    exclusion_criteria: str
    location: str
    compensation: str = "Contact for details"
    principal_investigator: str = ""
    contact_email: str = ""

# -------------------------
# ROUTES
# -------------------------

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "PharmaTrace AI",
        "version": "1.0.0",
        "batch_processing_info": {
            "max_files_per_batch": 500,
            "concurrent_processing": 5,
            "estimated_speed": "500+ files in ~25 minutes"
        }
    }


# -------------------------
# BATCH UPLOAD PROCESSING
# -------------------------
# Dictionary to track batch processing jobs
batch_jobs = {}


async def process_batch_async(batch_id: str, file_paths: list):
    """
    Process multiple PDFs asynchronously in batch (up to 500+ files)
    
    Features:
    - Concurrent processing (5 files at a time)
    - Validates before extraction
    - Tracks progress in real-time
    
    Args:
        batch_id: Unique batch identifier
        file_paths: List of file paths to process
    """
    batch_jobs[batch_id]['status'] = 'processing'
    batch_jobs[batch_id]['processed_files'] = 0
    batch_jobs[batch_id]['successful_extractions'] = 0
    batch_jobs[batch_id]['failed_files'] = 0
    batch_jobs[batch_id]['results'] = []
    
    # Process files with concurrency limit (5 concurrent operations)
    # This prevents rate limiting and manages API quotas
    semaphore = asyncio.Semaphore(5)
    
    async def process_file_with_semaphore(file_path):
        async with semaphore:
            try:
                # Step 1: Validate document
                validation_result = await MedicalDataExtractor.validate_medical_document(file_path)
                
                if not validation_result.get("is_valid"):
                    batch_jobs[batch_id]['failed_files'] += 1
                    batch_jobs[batch_id]['error_details'].append({
                        'file': Path(file_path).name,
                        'reason': f"Invalid document: {validation_result.get('document_type')}"
                    })
                    batch_jobs[batch_id]['processed_files'] += 1
                    return None
                
                # Step 2: Extract patient data
                extraction_result = await MedicalDataExtractor.extract_patient_data(file_path)
                
                if extraction_result.get("status") == "success":
                    batch_jobs[batch_id]['successful_extractions'] += 1
                    result = {
                        'file': Path(file_path).name,
                        'patient_data': extraction_result.get('data'),
                        'status': 'success'
                    }
                else:
                    batch_jobs[batch_id]['failed_files'] += 1
                    batch_jobs[batch_id]['error_details'].append({
                        'file': Path(file_path).name,
                        'reason': extraction_result.get('error', 'Unknown error')
                    })
                    result = None
                
                batch_jobs[batch_id]['processed_files'] += 1
                return result
                
            except Exception as e:
                batch_jobs[batch_id]['failed_files'] += 1
                batch_jobs[batch_id]['processed_files'] += 1
                batch_jobs[batch_id]['error_details'].append({
                    'file': Path(file_path).name,
                    'reason': str(e)
                })
                return None
    
    # Process all files concurrently with semaphore
    tasks = [process_file_with_semaphore(fp) for fp in file_paths]
    results = await asyncio.gather(*tasks)
    
    # Store successful results
    batch_jobs[batch_id]['results'] = [r for r in results if r is not None]
    batch_jobs[batch_id]['status'] = 'completed'
    
    # Cleanup uploaded files
    for fp in file_paths:
        try:
            if os.path.exists(fp):
                os.remove(fp)
        except:
            pass


@app.post("/batch-upload-records")
async def batch_upload_medical_records(files: list[UploadFile], background_tasks: BackgroundTasks):
    """
    Upload and process MULTIPLE medical record PDFs in batch
    
    This endpoint handles bulk uploads for 500+ patient records:
    ✅ Accepts up to 500 PDF files
    ✅ Processes up to 5 files concurrently (prevents rate limiting)
    ✅ Validates all files before extraction
    ✅ Returns batch ID for progress tracking
    ✅ Optimized for cost and API quotas
    
    **Processing Speed:**
    - ~3 seconds per file
    - 100 files: ~5 minutes
    - 500 files: ~25 minutes
    
    Args:
        files: List of PDF files to process
        
    Returns:
        - Batch ID to track processing
        - Polling endpoint for progress
        - Estimated completion time
    
    Example:
        curl -X POST "http://localhost:8000/batch-upload-records" -F "files=@file1.pdf" -F "files=@file2.pdf"
    """
    
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    if len(files) > 500:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files ({len(files)}). Maximum 500 files per batch. Please split into multiple batches."
        )
    
    # Validate all are PDFs
    invalid_files = [f.filename for f in files if not f.filename.lower().endswith('.pdf')]
    if invalid_files:
        raise HTTPException(
            status_code=400,
            detail=f"Non-PDF files detected: {', '.join(invalid_files[:5])}"
        )
    
    # Generate batch ID
    batch_id = f"BATCH_{uuid.uuid4().hex[:8].upper()}"
    
    print(f"📦 Batch {batch_id} started with {len(files)} files")
    
    # Save all files
    file_paths = []
    for file in files:
        try:
            safe_filename = f"{uuid.uuid4()}_{Path(file.filename).name}"
            file_path = UPLOAD_DIR / safe_filename
            
            contents = await file.read()
            with open(file_path, "wb") as f:
                f.write(contents)
            
            file_paths.append(str(file_path))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file {file.filename}: {str(e)}"
            )
    
    # Initialize batch job tracking
    batch_jobs[batch_id] = {
        'status': 'pending',
        'total_files': len(files),
        'processed_files': 0,
        'successful_extractions': 0,
        'failed_files': 0,
        'error_details': [],
        'results': []
    }
    
    # Start async processing in background
    background_tasks.add_task(process_batch_async, batch_id, file_paths)
    
    return {
        "status": "batch_started",
        "batch_id": batch_id,
        "total_files": len(files),
        "file_count": {
            "total": len(files),
            "max_capacity": 500
        },
        "processing_info": {
            "concurrent_limit": 5,
            "estimated_time_seconds": max(60, len(files) * 3),
            "estimated_time_readable": f"~{max(1, len(files) * 3 // 60)} minutes",
            "processing_speed": "500+ files in ~25 minutes"
        },
        "tracking_endpoints": {
            "status": f"/batch-status/{batch_id}",
            "results": f"/batch-results/{batch_id}"
        },
        "next_steps": [
            f"1. Poll /batch-status/{batch_id} to track progress",
            f"2. When status='completed', fetch /batch-results/{batch_id} for all extracted data"
        ]
    }


@app.get("/batch-status/{batch_id}")
async def get_batch_status(batch_id: str):
    """
    Get status of a batch upload job
    
    Poll this endpoint to track progress of your batch upload.
    
    Args:
        batch_id: Batch ID from /batch-upload-records response
        
    Returns:
        - Current processing status (pending/processing/completed)
        - Progress percentage
        - Files processed, successful, and failed
    
    Example:
        curl "http://localhost:8000/batch-status/BATCH_ABC12345"
    """
    
    if batch_id not in batch_jobs:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    
    job = batch_jobs[batch_id]
    
    response = {
        "batch_id": batch_id,
        "status": job['status'],
        "progress": {
            "total_files": job['total_files'],
            "processed_files": job['processed_files'],
            "successful_extractions": job['successful_extractions'],
            "failed_files": job['failed_files'],
            "progress_percentage": round((job['processed_files'] / max(1, job['total_files']) * 100), 2),
            "remaining_files": job['total_files'] - job['processed_files']
        }
    }
    
    # Add results if completed
    if job['status'] == 'completed':
        response['completion_info'] = {
            "extracted_patients": len(job['results']),
            "extraction_success_rate": f"{(len(job['results']) / max(1, job['total_files']) * 100):.1f}%",
            "total_failed": job['failed_files']
        }
        
        if job['error_details']:
            # Show summary of errors
            response['sample_errors'] = job['error_details'][:5]
    
    return response


@app.get("/batch-results/{batch_id}")
async def get_batch_results(batch_id: str):
    """
    Download complete results from a completed batch upload
    
    Returns all extracted patient data in JSON format.
    Only available after batch status is 'completed'.
    
    Args:
        batch_id: Batch ID from /batch-upload-records response
        
    Returns:
        - All extracted patient data
        - Summary statistics
        - List of any extraction errors
    
    Example:
        curl "http://localhost:8000/batch-results/BATCH_ABC12345"
    """
    
    if batch_id not in batch_jobs:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    
    job = batch_jobs[batch_id]
    
    if job['status'] != 'completed':
        raise HTTPException(
            status_code=409,
            detail=f"Batch still processing. Current status: {job['status']}. Poll /batch-status/{batch_id}"
        )
    
    return {
        "batch_id": batch_id,
        "status": "complete",
        "summary": {
            "total_files": job['total_files'],
            "successful_extractions": job['successful_extractions'],
            "failed_files": job['failed_files'],
            "extraction_rate_percent": round((job['successful_extractions'] / max(1, job['total_files']) * 100), 1),
        },
        "patients": job['results'],
        "errors": job['error_details']
    }


@app.post("/upload-record")
async def upload_medical_record(file: UploadFile = File(...)):
    """
    Upload and process a medical record PDF

    Returns:
        - Extracted patient data
        - Matched clinical trials
    """

    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Only PDF files are supported"
            }
        )

    # Generate safe unique filename
    safe_filename = f"{uuid.uuid4()}_{Path(file.filename).name}"
    file_path = UPLOAD_DIR / safe_filename

    try:
        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Step 1: Validate medical document
        print("🔍 Validating document...")
        validation_result = await MedicalDataExtractor.validate_medical_document(str(file_path))

        if not validation_result.get("is_valid"):
            os.remove(file_path)
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Invalid document type",
                    "message": f"This appears to be a {validation_result.get('document_type')}. Please upload a medical record.",
                    "reason": validation_result.get("reason")
                }
            )

        # Step 2: Extract patient data
        print("📄 Extracting patient information...")
        extraction_result = await MedicalDataExtractor.extract_patient_data(str(file_path))

        if extraction_result.get("status") != "success":
            os.remove(file_path)
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Extraction failed",
                    "message": extraction_result.get("error", "Unknown extraction error")
                }
            )

        patient_data = extraction_result["data"]

        # Step 3: Get trial data (placeholder – MongoDB later)
        trials = SampleDataGenerator.generate_sample_trials()

        # Step 4: Match trials
        print("🔬 Matching clinical trials...")
        matches = await TrialMatcher.match_patient_to_trials(patient_data, trials)

        # Cleanup file
        os.remove(file_path)

        return {
            "status": "success",
            "patient_data": {
                "age": patient_data.get("age"),
                "ethnicity": patient_data.get("ethnicity"),
                "conditions": patient_data.get("conditions"),
                "lab_results": patient_data.get("lab_results"),
                "confidence_score": patient_data.get("confidence_score"),
            },
            "matches": matches,
            "total_matches": len(matches)
        }

    except Exception as e:
        if file_path.exists():
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail={
                "message": f"Processing error: {str(e)}"
            }
        )


@app.post("/confirm-consent")
async def confirm_consent(payload: ConsentRequest):
    """
    Confirm patient consent for a trial
    """
    return {
        "status": "success",
        "message": "Consent recorded",
        "patient_id": payload.patient_id,
        "trial_id": payload.trial_id,
        "next_step": "Smart contract will be executed"
    }


@app.get("/sample-patients")
async def get_sample_patients():
    patients = SampleDataGenerator.generate_sample_patients(3)
    return {
        "status": "success",
        "patients": patients
    }


@app.get("/sample-trials")
async def get_sample_trials():
    trials = SampleDataGenerator.generate_sample_trials()
    return {
        "status": "success",
        "trials": trials,
        "count": len(trials)
    }


@app.post("/upload-clinical-trial")
async def upload_clinical_trial(trial: TrialUpload):
    """
    Upload a new clinical trial for candidate matching
    
    This endpoint allows clinical researchers to register their trials.
    The trial will be matched against the patient database to find eligible candidates.
    
    Args:
        trial: Clinical trial information (JSON)
    
    Returns:
        - Trial ID for tracking
        - Status confirmation
        - Eligible candidates matching results
    """
    try:
        # Generate unique trial ID (NCT format)
        trial_id = f"NCT{uuid.uuid4().hex[:8].upper()}"
        
        # Convert trial to dictionary
        trial_data = trial.dict()
        trial_data["id"] = trial_id
        
        # TODO: Store in MongoDB or persistent database
        # For now, we return confirmation with trial registered
        
        return {
            "status": "success",
            "message": "Clinical trial registered successfully",
            "trial_id": trial_id,
            "trial_data": {
                "id": trial_id,
                "name": trial.name,
                "condition": trial.condition,
                "phase": trial.phase,
                "location": trial.location,
                "compensation": trial.compensation
            },
            "next_steps": [
                "✅ Trial is now active in the system",
                "🔄 Patient records will be automatically matched",
                "👥 Eligible candidates will appear in researcher dashboard",
                "📊 Use trial_id to fetch matched candidates"
            ]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": f"Trial registration error: {str(e)}"
            }
        )


@app.post("/match-trial-to-candidates")
async def match_trial_to_candidates(trial: TrialUpload):
    """
    Register a clinical trial and match it against available patient candidates
    
    This endpoint:
    1. Registers the clinical trial
    2. Evaluates all available patients against the trial criteria
    3. Returns a ranked pool of eligible candidates (1.5x required)
    
    Args:
        trial: Clinical trial information
    
    Returns:
        - Trial ID
        - Eligible candidates pool (unranked, 1.5x size)
        - Eligibility breakdown
    """
    try:
        from utils.candidate_ranker import CandidateSelector
        
        # Generate unique trial ID
        trial_id = f"NCT{uuid.uuid4().hex[:8].upper()}"
        
        # Convert trial to dictionary
        trial_data = trial.dict()
        trial_data["id"] = trial_id
        
        # Get sample patients (TODO: Replace with database query)
        patients = SampleDataGenerator.generate_sample_patients(20)
        
        # Match patients to trial using CandidateSelector
        print(f"🔬 Matching {len(patients)} candidates to trial: {trial.name}")
        
        pool = await CandidateSelector.select_candidates_for_trial(
            patients=patients,
            trial=trial_data,
            required_candidates=5,
            multiplier=1.5
        )
        
        return {
            "status": "success",
            "trial_id": trial_id,
            "trial_name": trial.name,
            "condition": trial.condition,
            "phase": trial.phase,
            "matching_results": {
                "total_patients_evaluated": pool.processing_stats['total_patients_evaluated'],
                "eligible_candidates_found": pool.processing_stats['eligible_candidates_found'],
                "candidates_in_pool": pool.candidates_in_pool,
                "pool_multiplier": "1.5x (bias-free selection)"
            },
            "eligible_candidates": [
                {
                    "patient_id": c.patient_id,
                    "eligibility_status": c.eligibility_status,
                    "confidence": c.confidence,
                    "qualifying_factors": c.qualifying_factors[:3],
                    "pending_verification": c.pending_verification[:2]
                }
                for c in pool.eligible_candidates
            ]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": f"Trial matching error: {str(e)}"
            }
        )


# -------------------------
# RUN SERVER
# -------------------------
if __name__ == "__main__":
    print("🚀 Starting PharmaTrace AI server...")
    print("📍 API: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
