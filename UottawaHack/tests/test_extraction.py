"""
Test Medical Extraction
Tests the PDF extraction and trial matching pipeline
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.medical_extractor import MedicalDataExtractor
from utils.trial_matcher import TrialMatcher
from utils.sample_generator import SampleDataGenerator


async def test_single_pdf(pdf_path: str):
    """Test extraction on a single PDF"""
    
    print("\n" + "=" * 60)
    print(f"Testing: {Path(pdf_path).name}")
    print("=" * 60)
    
    # Step 1: Validate
    print("\n1️⃣  Validating document...")
    validation = await MedicalDataExtractor.validate_medical_document(pdf_path)
    
    print(f"   Valid: {validation['is_valid']}")
    print(f"   Type: {validation['document_type']}")
    print(f"   Confidence: {validation['confidence']:.2f}")
    print(f"   Reason: {validation['reason']}")
    
    if not validation['is_valid']:
        print("\n❌ Document validation failed!")
        return None
    
    # Step 2: Extract patient data
    print("\n2️⃣  Extracting patient data...")
    extraction = await MedicalDataExtractor.extract_patient_data(pdf_path)
    
    if extraction['status'] != 'success':
        print(f"\n❌ Extraction failed: {extraction['error']}")
        return None
    
    patient_data = extraction['data']
    print("\n✅ Extraction successful!")
    print(f"\n   Age: {patient_data.get('age')}")
    print(f"   Ethnicity: {patient_data.get('ethnicity')}")
    print(f"   Conditions: {', '.join(patient_data.get('conditions', []))}")
    print(f"   Lab Results:")
    for test, value in patient_data.get('lab_results', {}).items():
        print(f"     - {test}: {value}")
    print(f"   Confidence: {patient_data.get('confidence_score', 0):.2f}")
    
    # Step 3: Match to trials
    print("\n3️⃣  Matching to clinical trials...")
    trials = SampleDataGenerator.generate_sample_trials()
    matches = await TrialMatcher.match_patient_to_trials(patient_data, trials)
    
    if not matches:
        print("\n⚠️  No matching trials found")
    else:
        print(f"\n✅ Found {len(matches)} matching trial(s):")
        for i, match in enumerate(matches, 1):
            print(f"\n--- Match #{i} ---")
            print(f"Trial: {match.get('trial_name')}")
            print(f"Score: {match.get('match_score')}/100")
            print(f"Recommendation: {match.get('recommendation')}")
            print(f"Why they match:")
            for factor in match.get('qualifying_factors', []):
                print(f"  ✓ {factor}")
            if match.get('disqualifying_factors'):
                print(f"Concerns:")
                for factor in match['disqualifying_factors']:
                    print(f"  ! {factor}")
    
    return {
        'patient_data': patient_data,
        'matches': matches
    }


async def main():
    print("=" * 60)
    print("PharmaTrace AI - Extraction & Matching Test")
    print("=" * 60)
    
    # Find sample PDFs
    pdf_dir = Path("sample_pdfs")
    
    if not pdf_dir.exists() or not list(pdf_dir.glob("*.pdf")):
        print("\n⚠️  No sample PDFs found!")
        print("Run this first: python tests/test_sample_generator.py")
        return
    
    pdf_files = list(pdf_dir.glob("*.pdf"))
    print(f"\nFound {len(pdf_files)} sample PDF(s)")
    
    # Test each PDF
    results = []
    for pdf_path in pdf_files:
        result = await test_single_pdf(str(pdf_path))
        if result:
            results.append(result)
    
    # Summary
    print("\n\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Total PDFs tested: {len(pdf_files)}")
    print(f"Successful extractions: {len(results)}")
    print(f"Failed extractions: {len(pdf_files) - len(results)}")
    
    total_matches = sum(len(r['matches']) for r in results)
    print(f"Total trial matches: {total_matches}")
    
    print("\n✅ Testing complete!")


if __name__ == "__main__":
    asyncio.run(main())
