"""
Sample Data Generator
Creates realistic patient profiles and sample PDFs for demo/testing
"""

import google.generativeai as genai
import json
import os
from typing import List, Dict
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
MODEL_ID = 'gemini-1.5-flash'


class SampleDataGenerator:
    """Generate sample patient data and PDFs for demos"""
    
    @staticmethod
    def generate_sample_patients(num_samples: int = 3) -> List[Dict]:
        """
        Generate realistic sample patient profiles
        
        Args:
            num_samples: Number of patient profiles to generate
            
        Returns:
            List of patient data dictionaries
        """
        generation_prompt = f"""Generate {num_samples} realistic patient medical profiles for a clinical trial matching demo.

Create DIVERSE patients that would match DIFFERENT types of trials:
- 1 patient with Type 2 Diabetes
- 1 patient with Cancer (any type)
- 1 patient with Cardiovascular disease

Each patient should have:
- Realistic name (use anonymous Patient A, B, C format)
- Age between 25-75
- Different ethnicity
- 2-4 relevant medical conditions for their primary diagnosis
- Realistic lab results for those conditions
- Each patient should be clearly eligible for at least one type of trial

Return ONLY valid JSON (no markdown):
[
    {{
        "name": "Patient A",
        "age": 52,
        "ethnicity": "Hispanic",
        "conditions": ["Type 2 Diabetes", "Hypertension", "Obesity"],
        "lab_results": {{
            "HbA1c": "8.1%",
            "Fasting_Glucose": "156 mg/dL",
            "Blood_Pressure": "145/92 mmHg",
            "BMI": "32.4",
            "LDL_Cholesterol": "145 mg/dL"
        }},
        "primary_diagnosis": "Type 2 Diabetes"
    }}
]

Make them realistic and varied!
"""
        
        try:
            response = genai.GenerativeModel(MODEL_ID).generate_content(
                generation_prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.7,  # Higher for creativity
                    top_p=0.9,
                )
            )
            
            # Clean response
            response_text = response.text.strip()
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            patients = json.loads(response_text)
            return patients
            
        except Exception as e:
            print(f"Error generating sample patients: {e}")
            # Return fallback data
            return [
                {
                    "name": "Patient A",
                    "age": 52,
                    "ethnicity": "Hispanic",
                    "conditions": ["Type 2 Diabetes", "Hypertension"],
                    "lab_results": {
                        "HbA1c": "8.1%",
                        "Fasting_Glucose": "156 mg/dL",
                        "Blood_Pressure": "145/92 mmHg"
                    },
                    "primary_diagnosis": "Type 2 Diabetes"
                }
            ]

    @staticmethod
    def generate_sample_trials() -> List[Dict]:
        """
        Generate sample clinical trial data
        
        Returns:
            List of clinical trial objects
        """
        return [
            {
                "id": "NCT001",
                "name": "Diabetes Management Study - Novel GLP-1 Therapy",
                "condition": "Type 2 Diabetes",
                "age_range": "18-75 years",
                "inclusion_criteria": """
- Diagnosed with Type 2 Diabetes for at least 6 months
- HbA1c between 7.0% and 10.5%
- Currently on metformin or other oral diabetes medications
- BMI between 25-40
                """,
                "exclusion_criteria": """
- Type 1 Diabetes
- Current use of insulin
- Severe kidney disease (eGFR < 30)
- Recent heart attack (within 6 months)
                """,
                "sponsor": "Diabetes Research Institute",
                "phase": "Phase 3"
            },
            {
                "id": "NCT002",
                "name": "Cardiovascular Health Study - Hypertension Management",
                "condition": "Hypertension",
                "age_range": "35-80 years",
                "inclusion_criteria": """
- Diagnosed hypertension (Blood Pressure > 140/90)
- Currently on at least one blood pressure medication
- Willing to monitor blood pressure daily
                """,
                "exclusion_criteria": """
- Secondary hypertension
- Recent stroke or heart attack (within 3 months)
- Uncontrolled diabetes (HbA1c > 9%)
                """,
                "sponsor": "CardioHealth Foundation",
                "phase": "Phase 2"
            },
            {
                "id": "NCT003",
                "name": "Cancer Immunotherapy Trial - Breast Cancer",
                "condition": "Breast Cancer",
                "age_range": "18-75 years",
                "inclusion_criteria": """
- Diagnosed with Stage II or III breast cancer
- HER2-positive tumor
- Completed initial chemotherapy
- ECOG performance status 0-1
                """,
                "exclusion_criteria": """
- Metastatic cancer (Stage IV)
- Autoimmune disease
- Prior immunotherapy treatment
- Pregnant or breastfeeding
                """,
                "sponsor": "National Cancer Institute",
                "phase": "Phase 2"
            },
            {
                "id": "NCT004",
                "name": "Obesity and Metabolic Health Study",
                "condition": "Obesity",
                "age_range": "21-65 years",
                "inclusion_criteria": """
- BMI > 30
- No history of bariatric surgery
- Willing to participate in lifestyle modification program
                """,
                "exclusion_criteria": """
- Eating disorders
- Uncontrolled thyroid disease
- Current use of weight loss medications
                """,
                "sponsor": "Metabolic Health Research Center",
                "phase": "Phase 3"
            },
            {
                "id": "NCT005",
                "name": "Cholesterol Management - PCSK9 Inhibitor Study",
                "condition": "Hyperlipidemia",
                "age_range": "40-75 years",
                "inclusion_criteria": """
- LDL cholesterol > 130 mg/dL despite statin therapy
- History of cardiovascular disease OR high cardiovascular risk
- Currently on maximum tolerated statin dose
                """,
                "exclusion_criteria": """
- Severe liver disease
- Uncontrolled hypertension
- Recent surgery (within 30 days)
                """,
                "sponsor": "Lipid Research Foundation",
                "phase": "Phase 3"
            }
        ]

    @staticmethod
    def create_sample_pdf(patient_data: Dict, output_path: str):
        """
        Create a sample medical record PDF
        
        Args:
            patient_data: Patient information dictionary
            output_path: Where to save the PDF
        """
        c = canvas.Canvas(output_path, pagesize=letter)
        width, height = letter
        
        # Header
        c.setFont("Helvetica-Bold", 16)
        c.drawString(1*inch, height - 1*inch, "MEDICAL RECORD")
        
        c.setFont("Helvetica", 10)
        c.drawString(1*inch, height - 1.3*inch, "CONFIDENTIAL PATIENT INFORMATION")
        
        # Patient Info
        y = height - 2*inch
        c.setFont("Helvetica-Bold", 12)
        c.drawString(1*inch, y, "Patient Information")
        
        y -= 0.3*inch
        c.setFont("Helvetica", 11)
        c.drawString(1*inch, y, f"Patient ID: {patient_data.get('name', 'Unknown')}")
        
        y -= 0.25*inch
        c.drawString(1*inch, y, f"Age: {patient_data.get('age', 'N/A')} years")
        
        y -= 0.25*inch
        c.drawString(1*inch, y, f"Ethnicity: {patient_data.get('ethnicity', 'Not specified')}")
        
        # Medical Conditions
        y -= 0.5*inch
        c.setFont("Helvetica-Bold", 12)
        c.drawString(1*inch, y, "Diagnosed Conditions")
        
        y -= 0.3*inch
        c.setFont("Helvetica", 11)
        for condition in patient_data.get('conditions', []):
            c.drawString(1.2*inch, y, f"• {condition}")
            y -= 0.25*inch
        
        # Lab Results
        y -= 0.3*inch
        c.setFont("Helvetica-Bold", 12)
        c.drawString(1*inch, y, "Recent Laboratory Results")
        
        y -= 0.3*inch
        c.setFont("Helvetica", 11)
        for test, value in patient_data.get('lab_results', {}).items():
            c.drawString(1.2*inch, y, f"{test.replace('_', ' ')}: {value}")
            y -= 0.25*inch
        
        # Footer
        c.setFont("Helvetica", 8)
        c.drawString(1*inch, 0.75*inch, "This is a sample medical record for demonstration purposes only.")
        c.drawString(1*inch, 0.6*inch, f"Generated: {patient_data.get('name', 'Patient')}")
        
        c.save()
        print(f"✅ Created PDF: {output_path}")


# For backwards compatibility
generate_sample_patients = SampleDataGenerator.generate_sample_patients
generate_sample_trials = SampleDataGenerator.generate_sample_trials
create_sample_pdf = SampleDataGenerator.create_sample_pdf
