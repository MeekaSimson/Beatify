#!/bin/bash

echo "🧪 Testing Beatify Audio Analysis"
echo "=================================="

# Activate venv
source venv/bin/activate

# Test files
for file in test-audio/*.mp3 test-audio/*.m4a test-audio/*.wav; do
    if [ -f "$file" ]; then
        echo ""
        echo "📁 Testing: $file"
        python analyze_audio.py "$file"
        echo ""
    fi
done

echo "✅ All tests complete!"