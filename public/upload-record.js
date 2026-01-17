document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message hidden';
    
    // Gather form data
    const formData = {
        wallet_address: document.getElementById('wallet_address').value.trim(),
        demographics: {
            age_group: document.getElementById('age_group').value,
            gender: document.getElementById('gender').value,
            ethnicity: document.getElementById('ethnicity').value.trim()
        },
        medical_conditions: parseCommaSeparated(document.getElementById('medical_conditions').value),
        current_medications: parseCommaSeparated(document.getElementById('current_medications').value),
        health_metrics: {
            bmi: parseFloat(document.getElementById('bmi').value) || null,
            blood_pressure: document.getElementById('blood_pressure').value.trim() || null,
            last_hba1c_level: parseFloat(document.getElementById('last_hba1c_level').value) || null
        }
    };
    
    // Validate required fields
    if (!formData.wallet_address) {
        showMessage('Please enter your Solana wallet address', 'error');
        return;
    }
    
    if (!formData.demographics.age_group || !formData.demographics.gender) {
        showMessage('Please fill in all required demographic fields', 'error');
        return;
    }
    
    try {
        // Send data to backend
        const response = await fetch('/api/upload-record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Medical record uploaded successfully!', 'success');
            // Reset form after successful submission
            setTimeout(() => {
                document.getElementById('uploadForm').reset();
                messageDiv.className = 'message hidden';
            }, 3000);
        } else {
            showMessage(result.error || 'Failed to upload record. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    }
});

// Helper function to parse comma-separated values
function parseCommaSeparated(value) {
    if (!value || !value.trim()) return [];
    return value.split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
}

// Helper function to show messages
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}

// Add input validation for blood pressure format
document.getElementById('blood_pressure').addEventListener('blur', function() {
    const value = this.value.trim();
    if (value && !value.match(/^\d{2,3}\/\d{2,3}$/)) {
        showMessage('Blood pressure should be in format: 120/80', 'error');
        setTimeout(() => {
            document.getElementById('message').className = 'message hidden';
        }, 3000);
    }
});

// Add input validation for Solana wallet address
document.getElementById('wallet_address').addEventListener('blur', function() {
    const value = this.value.trim();
    // Basic Solana address validation (base58, 32-44 characters)
    if (value && (value.length < 32 || value.length > 44)) {
        showMessage('Please enter a valid Solana wallet address', 'error');
        setTimeout(() => {
            document.getElementById('message').className = 'message hidden';
        }, 3000);
    }
});
