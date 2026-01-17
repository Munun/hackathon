#!/bin/bash
find . -name "*.py" -type f -exec sed -i '' 's/import google.generativeai as genai/from google import genai\nfrom google.genai import types/g' {} \;
find . -name "*.py" -type f -exec sed -i '' "s/genai.configure(api_key=/client = genai.Client(api_key=/g" {} \;
find . -name "*.py" -type f -exec sed -i '' "s/genai.GenerativeModel('gemini-1.5-flash')/MODEL_ID = 'gemini-2.0-flash-exp'/g" {} \;
find . -name "*.py" -type f -exec sed -i '' "s/'gemini-1.5-flash'/'gemini-2.0-flash-exp'/g" {} \;

echo "✅ Fixed Gemini API imports!"
