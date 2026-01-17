"""
Test Candidate Ranking System
Demonstrates ranking multiple patients for clinical trials
"""

import asyncio
import json
from candidate_ranker import CandidateRanker, rank_candidates_for_all_trials


# Sample patient pool (simulating 20 patients for demo)
SAMPLE_PATIENTS = [
    {
        "patient_id": "P001",
        "name": "Patient A",
        "age": 52,
        "ethnicity": "Hispanic",
        "conditions": ["Type 2 Diabetes", "Hypertension", "Obesity"],
        "lab_results": {
            "HbA1c": "8.1%",
            "Fasting_Glucose": "156 mg/dL",
            "Blood_Pressure": "145/92 mmHg",
            "BMI": "32.4",
            "LDL_Cholesterol": "145 mg/dL"
        }
    },
    {
        "patient_id": "P002",
        "name": "Patient B",
        "age": 45,
        "ethnicity": "Caucasian",
        "conditions": ["HER2-positive Breast Cancer", "Anxiety"],
        "lab_results": {
            "ECOG_Status": "1",
            "HER2_Status": "Positive",
            "Stage": "II"
        }
    },
    {
        "patient_id": "P003",
        "name": "Patient C",
        "age": 68,
        "ethnicity": "African American",
        "conditions": ["Hypertension", "Hyperlipidemia", "Coronary Artery Disease"],
        "lab_results": {
            "Blood_Pressure": "152/95 mmHg",
            "LDL_Cholesterol": "165 mg/dL",
            "HDL_Cholesterol": "38 mg/dL",
            "Triglycerides": "220 mg/dL"
        }
    },
    {
        "patient_id": "P004",
        "name": "Patient D",
        "age": 38,
        "ethnicity": "Asian",
        "conditions": ["Type 2 Diabetes", "Obesity"],
        "lab_results": {
            "HbA1c": "7.8%",
            "Fasting_Glucose": "142 mg/dL",
            "BMI": "33.1",
            "Blood_Pressure": "128/82 mmHg"
        }
    },
    {
        "patient_id": "P005",
        "name": "Patient E",
        "age": 55,
        "ethnicity": "Caucasian",
        "conditions": ["Hypertension"],
        "lab_results": {
            "Blood_Pressure": "148/94 mmHg",
            "LDL_Cholesterol": "120 mg/dL"
        }
    },
    {
        "patient_id": "P006",
        "name": "Patient F",
        "age": 42,
        "ethnicity": "Hispanic",
        "conditions": ["Obesity", "Pre-diabetes"],
        "lab_results": {
            "BMI": "34.5",
            "HbA1c": "6.2%",
            "Fasting_Glucose": "115 mg/dL"
        }
    },
    {
        "patient_id": "P007",
        "name": "Patient G",
        "age": 61,
        "ethnicity": "African American",
        "conditions": ["Type 2 Diabetes", "Chronic Kidney Disease Stage 2", "Hypertension"],
        "lab_results": {
            "HbA1c": "9.2%",
            "eGFR": "72 mL/min",
            "Blood_Pressure": "155/98 mmHg",
            "BMI": "29.8"
        }
    },
    {
        "patient_id": "P008",
        "name": "Patient H",
        "age": 49,
        "ethnicity": "Asian",
        "conditions": ["HER2-positive Breast Cancer"],
        "lab_results": {
            "ECOG_Status": "0",
            "HER2_Status": "Positive",
            "Stage": "III",
            "Prior_Chemo": "Yes"
        }
    },
    {
        "patient_id": "P009",
        "name": "Patient I",
        "age": 72,
        "ethnicity": "Caucasian",
        "conditions": ["Hyperlipidemia", "Type 2 Diabetes", "History of MI"],
        "lab_results": {
            "LDL_Cholesterol": "142 mg/dL",
            "HbA1c": "7.1%",
            "On_Statin": "Yes - Maximum dose"
        }
    },
    {
        "patient_id": "P010",
        "name": "Patient J",
        "age": 35,
        "ethnicity": "Hispanic",
        "conditions": ["Obesity"],
        "lab_results": {
            "BMI": "36.2",
            "HbA1c": "5.4%",
            "Blood_Pressure": "122/78 mmHg"
        }
    },
    {
        "patient_id": "P011",
        "name": "Patient K",
        "age": 58,
        "ethnicity": "African American",
        "conditions": ["Type 2 Diabetes", "Hypertension", "Diabetic Retinopathy"],
        "lab_results": {
            "HbA1c": "8.8%",
            "Blood_Pressure": "142/88 mmHg",
            "BMI": "30.2",
            "eGFR": "85 mL/min"
        }
    },
    {
        "patient_id": "P012",
        "name": "Patient L",
        "age": 44,
        "ethnicity": "Caucasian",
        "conditions": ["Breast Cancer", "Depression"],
        "lab_results": {
            "ECOG_Status": "1",
            "HER2_Status": "Negative",
            "Stage": "II"
        }
    },
    {
        "patient_id": "P013",
        "name": "Patient M",
        "age": 66,
        "ethnicity": "Asian",
        "conditions": ["Hypertension", "Hyperlipidemia"],
        "lab_results": {
            "Blood_Pressure": "158/96 mmHg",
            "LDL_Cholesterol": "155 mg/dL",
            "HDL_Cholesterol": "42 mg/dL"
        }
    },
    {
        "patient_id": "P014",
        "name": "Patient N",
        "age": 29,
        "ethnicity": "Hispanic",
        "conditions": ["Obesity", "PCOS"],
        "lab_results": {
            "BMI": "38.5",
            "HbA1c": "5.8%"
        }
    },
    {
        "patient_id": "P015",
        "name": "Patient O",
        "age": 53,
        "ethnicity": "Caucasian",
        "conditions": ["Type 2 Diabetes", "Obesity", "Sleep Apnea"],
        "lab_results": {
            "HbA1c": "7.5%",
            "BMI": "35.8",
            "Fasting_Glucose": "138 mg/dL",
            "Blood_Pressure": "132/84 mmHg"
        }
    },
    {
        "patient_id": "P016",
        "name": "Patient P",
        "age": 47,
        "ethnicity": "African American",
        "conditions": ["HER2-positive Breast Cancer", "Hypertension"],
        "lab_results": {
            "ECOG_Status": "0",
            "HER2_Status": "Positive",
            "Stage": "II",
            "Prior_Chemo": "Yes",
            "Blood_Pressure": "138/86 mmHg"
        }
    },
    {
        "patient_id": "P017",
        "name": "Patient Q",
        "age": 63,
        "ethnicity": "Asian",
        "conditions": ["Hyperlipidemia", "Coronary Artery Disease"],
        "lab_results": {
            "LDL_Cholesterol": "138 mg/dL",
            "On_Statin": "Yes - Maximum dose",
            "Prior_PCSK9": "No"
        }
    },
    {
        "patient_id": "P018",
        "name": "Patient R",
        "age": 41,
        "ethnicity": "Hispanic",
        "conditions": ["Type 2 Diabetes"],
        "lab_results": {
            "HbA1c": "7.2%",
            "BMI": "28.5",
            "Fasting_Glucose": "130 mg/dL"
        }
    },
    {
        "patient_id": "P019",
        "name": "Patient S",
        "age": 57,
        "ethnicity": "Caucasian",
        "conditions": ["Hypertension", "Atrial Fibrillation"],
        "lab_results": {
            "Blood_Pressure": "146/92 mmHg"
        }
    },
    {
        "patient_id": "P020",
        "name": "Patient T",
        "age": 33,
        "ethnicity": "African American",
        "conditions": ["Obesity", "Hypertension"],
        "lab_results": {
            "BMI": "37.2",
            "Blood_Pressure": "142/90 mmHg",
            "HbA1c": "5.6%"
        }
    }
]

# Sample clinical trials
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


async def main():
    print("=" * 70)
    print("PHARMATRACE AI - CANDIDATE RANKING SYSTEM TEST")
    print("=" * 70)
    
    print(f"\n📊 Test Configuration:")
    print(f"   • Patients in pool: {len(SAMPLE_PATIENTS)}")
    print(f"   • Clinical trials: {len(SAMPLE_TRIALS)}")
    print(f"   • Required candidates per trial: 5")
    print(f"   • Multiplier: 1.5x (returning up to 7-8 candidates per trial)")
    
    # Define required candidates per trial
    required_per_trial = {
        "NCT001": 5,  # Diabetes - need 5, will return up to 7-8
        "NCT002": 5,  # Hypertension - need 5, will return up to 7-8
        "NCT003": 3,  # Cancer - need 3, will return up to 4-5
        "NCT004": 5,  # Obesity - need 5, will return up to 7-8
        "NCT005": 4,  # Cholesterol - need 4, will return up to 6
    }
    
    print("\n🔄 Starting candidate ranking process...")
    print("   (This may take a moment as we evaluate each patient)\n")
    
    # Run the ranking
    results = await CandidateRanker.rank_candidates_for_all_trials(
        patients=SAMPLE_PATIENTS,
        trials=SAMPLE_TRIALS,
        required_candidates_per_trial=required_per_trial,
        multiplier=1.5
    )
    
    # Display formatted results
    print(CandidateRanker.format_ranking_results(results))
    
    # Also save JSON output
    json_output = CandidateRanker.to_json(results)
    with open("ranking_results.json", "w") as f:
        f.write(json_output)
    print(f"\n📁 JSON results saved to: ranking_results.json")
    
    # Summary statistics
    print("\n" + "=" * 70)
    print("SUMMARY STATISTICS")
    print("=" * 70)
    
    total_candidates_needed = sum(required_per_trial.values())
    total_returned = sum(r.returned_candidates for r in results.values())
    
    print(f"\n   Total candidates needed across all trials: {total_candidates_needed}")
    print(f"   Total candidates returned (1.5x): {total_returned}")
    print(f"   Coverage: {total_returned / (total_candidates_needed * 1.5) * 100:.1f}%")
    
    for trial_id, result in results.items():
        target = int(required_per_trial[trial_id] * 1.5)
        print(f"\n   {result.trial_name[:40]}...")
        print(f"      Needed: {required_per_trial[trial_id]} | "
              f"Target (1.5x): {target} | "
              f"Found: {result.returned_candidates}")
        
        if result.ranked_candidates:
            top = result.ranked_candidates[0]
            print(f"      Top candidate: {top.patient_id} "
                  f"(Score: {top.match_score}, {top.eligibility_status})")


if __name__ == "__main__":
    asyncio.run(main())