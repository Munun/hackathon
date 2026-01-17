"""
Test Sample Data Generator
Creates sample patients and PDFs for demo
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.sample_generator import SampleDataGenerator


async def main():
    print("=" * 60)
    print("Generating Sample Patient Data for Demo")
    print("=" * 60)
    
    # Generate sample patients
    print("\n1️⃣  Generating sample patient profiles...")
    patients = SampleDataGenerator.generate_sample_patients(3)
    
    print(f"\n✅ Generated {len(patients)} patient profiles:")
    for i, patient in enumerate(patients, 1):
        print(f"\n--- {patient['name']} ---")
        print(f"Age: {patient['age']}")
        print(f"Ethnicity: {patient['ethnicity']}")
        print(f"Conditions: {', '.join(patient['conditions'])}")
        print(f"Primary: {patient.get('primary_diagnosis', 'N/A')}")
    
    # Generate sample trials
    print("\n\n2️⃣  Loading sample clinical trials...")
    trials = SampleDataGenerator.generate_sample_trials()
    print(f"✅ Loaded {len(trials)} clinical trials:")
    for trial in trials:
        print(f"  • {trial['name']} ({trial['condition']})")
    
    # Create sample PDFs
    print("\n\n3️⃣  Creating sample PDF medical records...")
    pdf_dir = Path("sample_pdfs")
    pdf_dir.mkdir(exist_ok=True)
    
    for patient in patients:
        filename = f"{patient['name'].replace(' ', '_').lower()}_medical_record.pdf"
        filepath = pdf_dir / filename
        SampleDataGenerator.create_sample_pdf(patient, str(filepath))
    
    print("\n" + "=" * 60)
    print("✅ Sample data generation complete!")
    print("=" * 60)
    print(f"\n📄 PDFs created in: {pdf_dir.absolute()}")
    print("\nUse these PDFs to test the upload-record endpoint!")
    print("\nNext: Test the extraction with:")
    print("  python tests/test_extraction.py")


if __name__ == "__main__":
    asyncio.run(main())
