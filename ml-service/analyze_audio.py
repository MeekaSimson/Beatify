import sys
import json
import numpy as np
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH
import librosa
import warnings
import os

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Suppress other warnings
warnings.filterwarnings('ignore')

# Import for capturing stdout
import io
import contextlib

def analyze_pitch(audio_path):
    """Use Basic-Pitch to detect notes"""
    print("🎵 Analyzing pitch...", file=sys.stderr)
    
    try:
        # CRITICAL: Capture Basic-Pitch's "Predicting MIDI..." output
        with contextlib.redirect_stdout(io.StringIO()):
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

def analyze_key_krumhansl(notes):
    """
    Improved key detection using Krumhansl-Schmuckler algorithm
    with melodic context analysis (first/last notes, long notes)
    """
    print("🎹 Detecting key...", file=sys.stderr)
    
    if not notes:
        return {'key': 'Unknown', 'scale': 'major', 'confidence': 0}
    
    try:
        # Krumhansl-Schmuckler key profiles
        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
        
        key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # Build weighted pitch class histogram
        pitch_class_weights = np.zeros(12)
        
        # Get first and last notes (often indicate tonic)
        sorted_notes = sorted(notes, key=lambda n: n['startTime'])
        first_notes = sorted_notes[:min(5, len(sorted_notes))]
        last_notes = sorted_notes[-min(5, len(sorted_notes)):]
        
        for i, note in enumerate(notes):
            pitch_class = note['pitch'] % 12
            weight = note['duration'] * note['velocity']
            
            # BOOST: First and last notes (likely tonics)
            if note in first_notes or note in last_notes:
                weight *= 2.0
            
            # BOOST: Very long notes (likely important structural notes)
            if note['duration'] > 0.5:
                weight *= 1.5
            
            pitch_class_weights[pitch_class] += weight
        
        # Normalize
        if pitch_class_weights.sum() > 0:
            pitch_class_weights = pitch_class_weights / pitch_class_weights.sum()
        
        # Try all 24 keys
        results = []
        for tonic in range(12):
            rotated_histogram = np.roll(pitch_class_weights, -tonic)
            
            # Major correlation
            major_corr = np.corrcoef(rotated_histogram, major_profile)[0, 1]
            if not np.isnan(major_corr):
                results.append({
                    'key': key_names[tonic],
                    'scale': 'major',
                    'correlation': major_corr
                })
            
            # Minor correlation
            minor_corr = np.corrcoef(rotated_histogram, minor_profile)[0, 1]
            if not np.isnan(minor_corr):
                results.append({
                    'key': key_names[tonic],
                    'scale': 'minor',
                    'correlation': minor_corr
                })
        
        # Sort by correlation
        results.sort(key=lambda x: x['correlation'], reverse=True)
        
        # Get top result
        best = results[0]
        best_key = best['key']
        best_scale = best['scale']
        best_corr = best['correlation']
        
        # Check for relative major/minor confusion
        # Strategy: Prefer major keys when scores are close (more common in pop/film music)
        if best_scale == 'minor' and len(results) > 1:
            # Relative major is 3 semitones up
            relative_major_idx = (key_names.index(best_key) + 3) % 12
            relative_major_name = key_names[relative_major_idx]
            
            # Find relative major in results
            for r in results[:5]:  # Check top 5 (expanded search)
                if r['key'] == relative_major_name and r['scale'] == 'major':
                    # RELAXED THRESHOLD: If relative major score is close (within 0.15), prefer major
                    # This helps with melodies that emphasize the 3rd degree
                    if abs(r['correlation'] - best_corr) < 0.15:
                        print(f"⚠️ Relative key confusion detected: {best_key} {best_scale} vs {relative_major_name} major", file=sys.stderr)
                        print(f"   Choosing {relative_major_name} major (scores: {r['correlation']:.3f} vs {best_corr:.3f})", file=sys.stderr)
                        best_key = relative_major_name
                        best_scale = 'major'
                        best_corr = r['correlation']
                    break
        
        # Additional check: If top 2 results are very close, prefer major over minor
        if len(results) >= 2:
            second_best = results[1]
            if abs(best_corr - second_best['correlation']) < 0.08:
                # If second best is major and first is minor, switch
                if best_scale == 'minor' and second_best['scale'] == 'major':
                    print(f"⚠️ Close scores detected, preferring major key", file=sys.stderr)
                    print(f"   {best_key} {best_scale} ({best_corr:.3f}) → {second_best['key']} {second_best['scale']} ({second_best['correlation']:.3f})", file=sys.stderr)
                    best_key = second_best['key']
                    best_scale = second_best['scale']
                    best_corr = second_best['correlation']
        
        confidence = round(max(0, min(1, (best_corr + 1) / 2)), 2)
        
        print(f"   Top 3 candidates:", file=sys.stderr)
        for i, r in enumerate(results[:3]):
            marker = "✓" if i == 0 else " "
            print(f"   {marker} {r['key']:3s} {r['scale']:5s} - correlation: {r['correlation']:.3f}", file=sys.stderr)
        
        return {
            'key': best_key,
            'scale': best_scale,
            'confidence': confidence
        }
        
    except Exception as e:
        print(f"❌ Key detection error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {'key': 'C', 'scale': 'major', 'confidence': 0.5}

def analyze_tempo(audio_path):
    """Detect tempo/BPM using librosa"""
    print("⏱️ Detecting tempo...", file=sys.stderr)
    
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            y, sr = librosa.load(audio_path)
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        
        # Handle numpy types
        if hasattr(tempo, 'item'):
            bpm = tempo.item()
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
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
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
    key_data = analyze_key_krumhansl(notes)  # ✅ Using improved key detection
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
        # CRITICAL: Print ONLY JSON to stdout
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)