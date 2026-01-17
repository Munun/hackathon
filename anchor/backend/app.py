from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib

app = Flask(__name__)
CORS(app) # Allows React to communicate with Flask

@app.route('/api/analyze', methods=['POST'])
def analyze_document():
    data = request.json
    doc_text = data.get('text', "Verified Medical Trial Consent v1.0")
    
    # Matching the hashing logic in nlp_engine.py
    hasher = hashlib.sha256()
    hasher.update(doc_text.encode('utf-8'))
    agreement_hash = hasher.hexdigest()
    
    return jsonify({
        "status": "success",
        "hash": agreement_hash,
        "trial_match": "Insulin Resilience",
        "company": "NovoVax"
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)