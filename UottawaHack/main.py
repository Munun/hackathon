from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
import uuid
from pathlib import Path
from dotenv import load_dotenv

# Import our utilities
from utils.medical_extractor import MedicalDataExtractor
from utils.trial_matcher import TrialMatcher
from utils.sample_generator import SampleDataGenerator

load_dotenv()

app = FastAPI(title="PharmaTrace AI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

api_router = APIRouter(prefix="/api")
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/upload-record")
async def upload_medical_record(file: UploadFile = File(...)):
    print(f"📥 Received file: {file.filename}")
    
    if not file.filename.lower().endswith(".pdf"):
        print("❌ Rejecting: Not a PDF")
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    safe_filename = f"{uuid.uuid4()}_{Path(file.filename).name}"
    file_path = UPLOAD_DIR / safe_filename

    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        print(f"💾 File saved to: {file_path}")

        # Step 1: Validate
        print("🔍 AI Validating document...")
        validation_result = await MedicalDataExtractor.validate_medical_document(str(file_path))
        
        if not validation_result.get("is_valid"):
            print(f"❌ AI Validation Failed. Reason: {validation_result.get('reason')}")
            os.remove(file_path)
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Invalid document",
                    "message": validation_result.get("reason"),
                    "debug_info": validation_result
                }
            )

        # Step 2: Extract
        print("📄 AI Extracting data...")
        extraction_result = await MedicalDataExtractor.extract_patient_data(str(file_path))
        
        # Step 3: Match
        print("🔬 Matching trials...")
        trials = SampleDataGenerator.generate_sample_trials()
        matches = await TrialMatcher.match_patient_to_trials(extraction_result["data"], trials)

        os.remove(file_path)
        print("✅ Success!")
        return {
            "status": "success",
            "patient_data": extraction_result["data"],
            "matches": matches
        }

    except Exception as e:
        print(f"🔥 Server Error: {str(e)}")
        if file_path.exists(): os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)

@app.get("/")
async def root(): return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)