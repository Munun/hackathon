"""  
Clinical Trial Matching Engine
Matches patient data against trial inclusion/exclusion criteria using Gemini AI
"""

import google.generativeai as genai
import json
import os
from typing import Dict, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
MODEL_ID = 'gemini-2.0-flash'


# Sample clinical trials database
SAMPLE_TRIALS = [
    {
        "id": "NCT001",
        "name": "Diabetes Management Study - Novel GLP-1 Therapy",
        "condition": "Type 2 Diabetes",
        "phase": "Phase 3",
        "inclusion_criteria": "Age 40-70, HbA1c between 7.0-10.5%, Diagnosed with Type 2 Diabetes for at least 1 year, BMI 25-40",
        "exclusion_criteria": "Type 1 Diabetes, Pregnant or nursing, Severe kidney disease (eGFR < 30), Current insulin pump use",
        "location": "Multiple US sites",
        "compensation": "$50 per visit"
    },
    {
        "id": "NCT002", 
        "name": "Cardiovascular Health Study - Hypertension Management",
        "condition": "Hypertension",
        "phase": "Phase 2",
        "inclusion_criteria": "Age 35-75, Blood pressure 140/90 or higher, No current blood pressure medication OR on stable dose for 3+ months",
        "exclusion_criteria": "History of stroke, Heart failure, Severe kidney disease, Pregnant",
        "location": "East Coast US",
        "compensation": "$75 per visit"
    },
    {
        "id": "NCT003",
        "name": "Cancer Immunotherapy Trial - Breast Cancer",
        "condition": "Breast Cancer",
        "phase": "Phase 2",
        "inclusion_criteria": "Age 18+, Diagnosed with HER2-positive breast cancer, Completed at least one line of therapy, ECOG performance status 0-1",
        "exclusion_criteria": "Brain metastases, Autoimmune disease requiring treatment, Prior immunotherapy",
        "location": "Major cancer centers nationwide",
        "compensation": "Travel expenses covered"
    },
    {
        "id": "NCT004",
        "name": "Obesity and Metabolic Health Study",
        "condition": "Obesity",
        "phase": "Phase 3",
        "inclusion_criteria": "Age 18-65, BMI 30-45, No diabetes, Stable weight for past 3 months",
        "exclusion_criteria": "Bariatric surgery history, Eating disorders, Uncontrolled thyroid disease",
        "location": "Nationwide",
        "compensation": "$100 per visit"
    },
    {
        "id": "NCT005",
        "name": "Cholesterol Management - PCSK9 Inhibitor Study",
        "condition": "Hyperlipidemia",
        "phase": "Phase 3",
        "inclusion_criteria": "Age 40-80, LDL cholesterol > 100 mg/dL on statin therapy, History of cardiovascular disease OR high risk",
        "exclusion_criteria": "Liver disease, Prior PCSK9 inhibitor use, Triglycerides > 500",
        "location": "Select US sites",
        "compensation": "$60 per visit"
    }
]


class TrialMatcher:
    """Match patients to clinical trials based on eligibility criteria"""
    
    @staticmethod
    async def match_patient_to_trials(patient_data: Dict, trials: List[Dict] = None) -> List[Dict]:
        """
        Use Gemini to match patient against trial inclusion/exclusion criteria
        
        Args:
            patient_data: Extracted patient information
            trials: List of clinical trial objects (uses SAMPLE_TRIALS if not provided)
            
        Returns:
            List of matching trials with scores and reasoning
        """
        if trials is None:
            trials = SAMPLE_TRIALS
            
        matching_prompt = f"""You are a clinical trial matching specialist with expertise in patient eligibility assessment.

PATIENT PROFILE:
{json.dumps(patient_data, indent=2)}

AVAILABLE CLINICAL TRIALS:
{json.dumps(trials, indent=2)}

TASK: Evaluate if this patient QUALIFIES for each trial based on inclusion and exclusion criteria.

Return ONLY this JSON structure (no markdown, no code blocks):
{{
    "matches": [
        {{
            "trial_id": "string",
            "trial_name": "string", 
            "match_score": 0-100,
            "qualifying_factors": ["list of specific reasons why patient matches"],
            "disqualifying_factors": ["list of specific reasons why patient might not match"],
            "recommendation": "Excellent Match" | "Good Match" | "Possible Match" | "Poor Match" | "No Match",
            "confidence": 0.0-1.0
        }}
    ]
}}

MATCHING RULES:
1. match_score of 90-100 = "Excellent Match" (meets all key criteria)
2. match_score of 70-89 = "Good Match" (meets most criteria)
3. match_score of 50-69 = "Possible Match" (meets some criteria)
4. match_score of 30-49 = "Poor Match" (meets few criteria)
5. match_score of 0-29 = "No Match" (fails key criteria)

Only include trials with match_score >= 50. Return empty matches array if no good matches.
"""

        try:
            # Generate response
            response = genai.GenerativeModel(MODEL_ID).generate_content(
                matching_prompt
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
            
            return result.get('matches', [])
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error in matching: {e}")
            return []
        except Exception as e:
            print(f"Matching error: {e}")
            return []
    
    @staticmethod
    def get_sample_trials() -> List[Dict]:
        """Return the sample trials database"""
        return SAMPLE_TRIALS
    
    @staticmethod
    def format_match_results(matches: List[Dict]) -> str:
        """Format match results for display"""
        if not matches:
            return "No matching trials found."
        
        output = f"Found {len(matches)} matching trial(s):\n\n"
        
        for i, match in enumerate(matches, 1):
            output += f"--- Match #{i} ---\n"
            output += f"Trial: {match.get('trial_name', 'Unknown')}\n"
            output += f"ID: {match.get('trial_id', 'N/A')}\n"
            output += f"Score: {match.get('match_score', 0)}/100\n"
            output += f"Recommendation: {match.get('recommendation', 'Unknown')}\n"
            output += f"Confidence: {match.get('confidence', 0):.0%}\n"
            
            if match.get('qualifying_factors'):
                output += "Qualifying Factors:\n"
                for factor in match['qualifying_factors']:
                    output += f"  ✓ {factor}\n"
            
            if match.get('disqualifying_factors'):
                output += "Potential Concerns:\n"
                for factor in match['disqualifying_factors']:
                    output += f"  ⚠ {factor}\n"
            
            output += "\n"
        
        return output


# For backwards compatibility
match_patient_to_trials = TrialMatcher.match_patient_to_trials
get_sample_trials = TrialMatcher.get_sample_trials