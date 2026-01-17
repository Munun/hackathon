import hashlib
import json

def prepare_for_frontend(patient_name, document_text):
    """
    Simulates the NLP engine processing data and preparing it for the 
    partner's React frontend.
    """
    # 1. Generate the Privacy Hash (SHA256)
    hasher = hashlib.sha256()
    hasher.update(document_text.encode('utf-8'))
    agreement_hash = hasher.digest()
    
    # 2. Package the data for the partner
    handoff_data = {
        "patient": patient_name,
        "agreement_hash_hex": agreement_hash.hex(),
        "instruction": "Pass this hex string to the 'sign_consent' function",
        "pda_seeds": f"['consent', patient_pubkey]"
    }
    
    return json.dumps(handoff_data, indent=2)

# Example output for your partner:
print(prepare_for_frontend("Devansh", "Verified Medical Trial Consent v1.0"))