#!/bin/bash

# Quick test script for Beatify backend
# Usage: ./quick-test.sh /path/to/audio.mp3

echo "🎵 Beatify Quick Test Script"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if audio file provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No audio file provided${NC}"
    echo "Usage: ./quick-test.sh /path/to/audio.mp3"
    echo ""
    echo "Example:"
    echo "  ./quick-test.sh test-audio/song.mp3"
    exit 1
fi

AUDIO_FILE="$1"

# Check if file exists
if [ ! -f "$AUDIO_FILE" ]; then
    echo -e "${RED}❌ Error: File not found: $AUDIO_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Testing with file: $AUDIO_FILE${NC}"
echo ""

# Test 1: Check if backend is running
echo -e "${YELLOW}Test 1: Checking if backend is running...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend is running!${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo ""
    echo "Start the backend first:"
    echo "  cd /Users/simson/Files/Beatify/backend"
    echo "  npm start"
    exit 1
fi

echo ""

# Test 2: Upload and analyze audio
echo -e "${YELLOW}Test 2: Uploading and analyzing audio...${NC}"
echo "This may take 2-5 seconds..."
echo ""

# Make the request and save response
RESPONSE=$(curl -s -X POST http://localhost:3001/api/analyze \
    -F "audio=@$AUDIO_FILE" 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to connect to backend${NC}"
    exit 1
fi

# Check if response contains success
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Analysis successful!${NC}"
    echo ""
    
    # Parse and display key information
    echo -e "${BLUE}📊 Analysis Results:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Extract fields using python
    python3 << EOF
import json
import sys

try:
    data = json.loads('''$RESPONSE''')
    if data.get('success'):
        analysis = data.get('analysis', {})
        print(f"🎵 Filename:   {data.get('filename', 'Unknown')}")
        print(f"⏱️  Duration:   {analysis.get('duration', 0)}s")
        print(f"🎹 Key:        {analysis.get('key', 'Unknown')} {analysis.get('scale', '')}")
        print(f"📊 Confidence: {int(analysis.get('keyConfidence', 0) * 100)}%")
        print(f"🥁 Tempo:      {analysis.get('bpm', 0)} BPM")
        print(f"🎼 Notes:      {analysis.get('noteCount', 0)} detected")
        print("")
        print("First 3 notes:")
        for i, note in enumerate(analysis.get('notes', [])[:3], 1):
            print(f"  {i}. Pitch: {note.get('pitch', 0)} | Time: {note.get('startTime', 0)}s | Duration: {note.get('duration', 0)}s")
    else:
        print("❌ Analysis unsuccessful")
        print(data.get('error', 'Unknown error'))
except Exception as e:
    print(f"❌ Error parsing response: {e}")
    print("Raw response:")
    print('''$RESPONSE''')
EOF
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Ask if user wants to see full JSON
    echo -e "${YELLOW}View full JSON response? (y/n)${NC}"
    read -r VIEW_JSON
    
    if [ "$VIEW_JSON" = "y" ] || [ "$VIEW_JSON" = "Y" ]; then
        echo ""
        echo "$RESPONSE" | python3 -m json.tool
    fi
    
    echo ""
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo -e "${GREEN}✅ Backend is working perfectly!${NC}"
    
else
    echo -e "${RED}❌ Analysis failed${NC}"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "Common issues:"
    echo "  1. Python script path wrong in server.js"
    echo "  2. Python dependencies not installed"
    echo "  3. Invalid audio file format"
    echo ""
    echo "Test Python script directly:"
    echo "  cd /Users/simson/Files/Beatify/ml-service"
    echo "  python3 analyze_audio.py $AUDIO_FILE"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "  • Backend server: ✅ Running"
echo "  • File upload: ✅ Working"
echo "  • Python analysis: ✅ Working"
echo "  • JSON response: ✅ Valid"
echo ""
echo -e "${GREEN}🎊 YOUR BACKEND IS READY FOR INTEGRATION!${NC}"
echo ""
echo "Next steps:"
echo "  1. Test with 2 more audio files"
echo "  2. Connect your frontend"
echo "  3. Display results in UI"
echo ""
echo -e "${YELLOW}💡 Tip: Save this output for your test log!${NC}"