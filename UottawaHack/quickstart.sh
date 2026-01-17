#!/bin/bash

# PharmaTrace AI - Quick Start Script
# This script sets up everything you need

echo "🚀 PharmaTrace AI - Quick Start"
echo "================================"

# Check if virtual environment exists
if [ ! -d "pharmatrace-env" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv pharmatrace-env
fi

# Activate virtual environment
echo ""
echo "✅ Activating virtual environment..."
source pharmatrace-env/bin/activate

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Creating .env file..."
    cp .env.template .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your GEMINI_API_KEY"
    echo "   Get your key from: https://aistudio.google.com/app/apikey"
    echo ""
    read -p "Press ENTER when you've added your API key to .env..."
fi

# Run setup verification
echo ""
echo "🔍 Verifying setup..."
python test_setup.py

# Check if setup was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo "✅ Setup complete!"
    echo "================================"
    echo ""
    echo "Next steps:"
    echo "1. Generate sample data:"
    echo "   python tests/test_sample_generator.py"
    echo ""
    echo "2. Test extraction:"
    echo "   python tests/test_extraction.py"
    echo ""
    echo "3. Start API server:"
    echo "   python main.py"
    echo ""
    echo "================================"
else
    echo ""
    echo "❌ Setup failed. Please check the error messages above."
fi
