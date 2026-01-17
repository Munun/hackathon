"""
Medical PDF Extraction Module
Extracts structured patient data from medical PDFs using Gemini AI
"""

import google.generativeai as genai
import json
import os
from typing import Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
MODEL_ID = 'gemini-2.0-flash'


class MedicalDataExtractor:
    """Extract structured medical data from PDF documents"""
    
    EXTRACTION_PROMPT = """You are a medical data extraction specialist with expertise in parsing clinical documents.

Extract ONLY the following information from this medical document:
- age: integer (patient's age in years)
- ethnicity: string (patient's ethnicity/race)
- conditions: list of strings (diagnosed medical conditions only)
- lab_results: dictionary with test names as keys and values with units

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown formatting, no code blocks, no explanations
2. If a field is missing or unclear, use null
3. For conditions, extract only confirmed diagnoses (not symptoms)
4. For lab_results, include the test name, numeric value, and unit
5. Add a confidence_score (0.0-1.0) indicating extraction certainty

Expected JSON format:
{
    "age": 45,
    "ethnicity": "Asian",
    "conditions": ["Type 2 Diabetes", "Hypertension"],
    "lab_results": {
        "HbA1c": "7.2%",
        "Blood_Pressure": "140/90 mmHg",
        "LDL_Cholesterol": "130 mg/dL",
        "Fasting_Glucose": "156 mg/dL"
    },
    "confidence_score": 0.95
}

If this is NOT a medical document (e.g., cat photo, random image, non-medical content):
{
    "error": "Not a medical document",
    "confidence_score": 0.0
}
"""

    @staticmethod
    async def validate_medical_document(file_path: str) -> Dict:
        """
        Pre-screening to detect non-medical uploads
        
        Args:
            file_path: Path to the uploaded file
            
        Returns:
            Dict with validation results
        """
        validation_prompt = """Analyze this document and respond with ONLY a JSON object (no markdown):

{
    "is_medical_document": true or false,
    "document_type": "medical record" | "lab report" | "prescription" | "radiology report" | "cat photo" | "other",
    "confidence": 0.0 to 1.0,
    "reason": "brief explanation"
}

A medical document contains: patient information, diagnoses, lab results, prescriptions, clinical notes, or radiology reports.
Non-medical includes: photos, random images, unrelated documents, or blank pages.
"""
        
        try:
            # Upload file
            with open(file_path, 'rb') as f:
                uploaded_file = genai.upload_file(f, mime_type='application/pdf')
            
            # Generate response
            response = genai.GenerativeModel(MODEL_ID).generate_content(
                [
                    uploaded_file,
                    validation_prompt
                ]
            )
            
            # Clean response text
            response_text = response.text.strip()
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            result = json.loads(response_text)
            
            return {
                "is_valid": result.get('is_medical_document', False) and result.get('confidence', 0) > 0.7,
                "document_type": result.get('document_type', 'unknown'),
                "confidence": result.get('confidence', 0.0),
                "reason": result.get('reason', '')
            }
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            return {
                "is_valid": False,
                "document_type": "parse_error",
                "confidence": 0.0,
                "reason": "Failed to parse AI response"
            }
        except Exception as e:
            print(f"Validation error: {e}")
            return {
                "is_valid": False,
                "document_type": "error",
                "confidence": 0.0,
                "reason": str(e)
            }

    @staticmethod
    async def extract_patient_data(file_path: str) -> Dict:
        """
        Extract structured patient data from medical PDF
        
        Args:
            file_path: Path to the medical PDF file
            
        Returns:
            Dict with extraction results
        """
        try:
            # Upload file
            with open(file_path, 'rb') as f:
                uploaded_file = genai.upload_file(f, mime_type='application/pdf')
            
            # Generate extraction
            response = genai.GenerativeModel(MODEL_ID).generate_content(
                [
                    uploaded_file,
                    MedicalDataExtractor.EXTRACTION_PROMPT
                ]
            )
            
            # Clean response text
            response_text = response.text.strip()
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            # Parse JSON
            result = json.loads(response_text)
            
            # Check if error in response
            if "error" in result:
                return {
                    "status": "invalid",
                    "data": None,
                    "error": result["error"]
                }
            
            # Validate required fields
            required_fields = ['age', 'ethnicity', 'conditions', 'lab_results']
            if not all(field in result for field in required_fields):
                return {
                    "status": "incomplete",
                    "data": result,
                    "error": "Missing required fields"
                }
            
            return {
                "status": "success",
                "data": result,
                "error": None
            }
            
        except json.JSONDecodeError as e:
            return {
                "status": "error",
                "data": None,
                "error": f"AI returned malformed JSON: {str(e)}"
            }
        except Exception as e:
            return {
                "status": "error",
                "data": None,
                "error": f"Processing failed: {str(e)}"
            }


# For backwards compatibility
extract_patient_data = MedicalDataExtractor.extract_patient_data
validate_medical_document = MedicalDataExtractor.validate_medical_document