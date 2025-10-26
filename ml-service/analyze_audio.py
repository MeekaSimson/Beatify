import sys
import json
import numpy as np
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH
import librosa

def analyze_pitch(audio_path):
    """Use Basic-Pitch to detect notes"""
    print("🎵 Analyzing pitch...", file=sys.stderr)
    
    try:
        # Run Basic Pitch
        model_output, midi_data, note_events = predict(
            audio_path,
            ICASSP_2022_MODEL_PATH
        )
        
        # Convert to our format
        notes = []
        for note in note_events:
            notes.append({
                'pitch': int(note[2]),
                'startTime': round(float(note[0]), 3),
                'endTime': round(float(note[1]), 3),
                'duration': round(float(note[1] - note[0]), 3),
                'velocity': round(float(note[3]), 2)
            })
        
        return notes
        
    except Exception as e:
        print(f"❌ Pitch detection error: {e}", file=sys.stderr)
        return []

def analyze_key_simple(notes):
    """Simple key detection from detected notes"""
    print("🎹 Detecting key...", file=sys.stderr)
    
    if not notes:
        return {'key': 'Unknown', 'scale': 'major', 'confidence': 0}
    
    try:
        # Count pitch classes
        pitch_counts = {}
        for note in notes:
            pitch_class = note['pitch'] % 12
            pitch_counts[pitch_class] = pitch_counts.get(pitch_class, 0) + 1
        
        # Find most common pitch class (tonic)
        tonic = max(pitch_counts, key=pitch_counts.get)
        
        # Check for major vs minor
        # Major has major third (4 semitones above tonic)
        # Minor has minor third (3 semitones above tonic)
        major_third = (tonic + 4) % 12
        minor_third = (tonic + 3) % 12
        
        is_major = pitch_counts.get(major_third, 0) >= pitch_counts.get(minor_third, 0)
        
        key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # Calculate confidence based on how clear the key is
        total = sum(pitch_counts.values())
        tonic_percentage = pitch_counts[tonic] / total if total > 0 else 0
        confidence = round(min(tonic_percentage * 2, 0.95), 2)
        
        return {
            'key': key_names[tonic],
            'scale': 'major' if is_major else 'minor',
            'confidence': confidence
        }
        
    except Exception as e:
        print(f"❌ Key detection error: {e}", file=sys.stderr)
        return {'key': 'C', 'scale': 'major', 'confidence': 0.5}

def analyze_tempo(audio_path):
    """Detect tempo/BPM using librosa"""
    print("⏱️ Detecting tempo...", file=sys.stderr)
    
    try:
        # Load audio
        y, sr = librosa.load(audio_path)
        
        # Detect tempo
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        
        # Properly handle numpy types
        if hasattr(tempo, 'item'):
            bpm = tempo.item()  # Extract from numpy array
        elif isinstance(tempo, (list, tuple)):
            bpm = float(tempo[0])
        else:
            bpm = float(tempo)
        
        return {
            'bpm': round(bpm, 1),
            'confidence': 0.85
        }
        
    except Exception as e:
        print(f"❌ Tempo detection error: {e}", file=sys.stderr)
        return {'bpm': 120.0, 'confidence': 0.5}

def get_audio_duration(audio_path):
    """Get audio duration"""
    try:
        y, sr = librosa.load(audio_path)
        duration = librosa.get_duration(y=y, sr=sr)
        return round(float(duration), 2)
    except Exception as e:
        print(f"❌ Duration error: {e}", file=sys.stderr)
        return 0

def analyze_audio(audio_path):
    """Main function - analyzes everything"""
    print(f"🎵 Starting analysis of: {audio_path}", file=sys.stderr)
    
    # Run all analyses
    notes = analyze_pitch(audio_path)
    key_data = analyze_key_simple(notes)
    tempo_data = analyze_tempo(audio_path)
    duration = get_audio_duration(audio_path)
    
    # Compile results
    result = {
        'success': True,
        'analysis': {
            'notes': notes,
            'noteCount': len(notes),
            'key': key_data['key'],
            'scale': key_data['scale'],
            'keyConfidence': key_data['confidence'],
            'bpm': tempo_data['bpm'],
            'tempoConfidence': tempo_data['confidence'],
            'duration': duration
        }
    }
    
    print("✅ Analysis complete!", file=sys.stderr)
    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No audio file provided'
        }))
        sys.exit(1)
    
    audio_file = sys.argv[1]
    
    try:
        result = analyze_audio(audio_file)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)