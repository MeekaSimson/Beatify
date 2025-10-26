cat > ml-service/README.md << 'EOF'
# Beatify ML Service

AI-powered audio analysis using Basic-Pitch (Spotify) and Librosa.

## Setup

### Prerequisites
- Python 3.11
- Homebrew (Mac)

### Installation
```bash
# Install Python 3.11
brew install python@3.11

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Usage
```bash
# Activate venv (if not already active)
source venv/bin/activate

# Analyze audio file
python analyze_audio_simple.py test-audio/your-file.wav
```

## Output Format
```json
{
  "success": true,
  "analysis": {
    "notes": [
      {
        "pitch": 66,
        "startTime": 1.37,
        "endTime": 1.858,
        "duration": 0.488,
        "velocity": 0.67
      }
    ],
    "noteCount": 4,
    "key": "D",
    "scale": "major",
    "keyConfidence": 0.95,
    "bpm": 152.0,
    "tempoConfidence": 0.85,
    "duration": 1.98
  }
}
```

## Features

- ✅ Pitch detection (Basic-Pitch by Spotify)
- ✅ Musical key detection
- ✅ BPM/tempo detection
- ✅ Note timing and velocity
- ✅ JSON output format

## Status

**Working!** Ready for backend integration.

## Next Steps

Backend service will call this script to analyze uploaded audio files.
EOF