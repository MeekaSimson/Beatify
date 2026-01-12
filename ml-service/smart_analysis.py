"""
Smart Key Detection with Chord Validation
Tests multiple key candidates and picks the one with best-fitting chords
"""

import sys
import json
from pathlib import Path
import numpy as np

from analyze_audio import analyze_audio
from chord_generator import ChordGenerator, Note


def convert_basic_pitch_to_notes(basic_pitch_notes):
    """Convert Basic-Pitch note format to Note objects"""
    notes = []
    for note_data in basic_pitch_notes:
        note = Note(
            pitch=int(note_data['pitch']),
            start_time=float(note_data['startTime']),
            end_time=float(note_data['endTime']),
            duration=float(note_data['duration']),
            velocity=float(note_data['velocity'])
        )
        notes.append(note)
    return notes


def get_related_keys(key, scale):
    """
    Get related keys that might be confused with detected key
    
    Returns list of (key, scale) tuples to try
    """
    key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    key_index = key_names.index(key)
    
    candidates = [
        (key, scale),  # Original detected key
    ]
    
    if scale == 'minor':
        # Add relative major (3 semitones up)
        relative_major = key_names[(key_index + 3) % 12]
        candidates.append((relative_major, 'major'))
        
        # Add parallel major (same root)
        candidates.append((key, 'major'))
    else:  # major
        # Add relative minor (3 semitones down)
        relative_minor = key_names[(key_index - 3) % 12]
        candidates.append((relative_minor, 'minor'))
        
        # Add parallel minor (same root)
        candidates.append((key, 'minor'))
    
    return candidates


def score_chord_fit(chords, notes):
    """
    Score how well generated chords fit the melody
    
    Args:
        chords: List of generated Chord objects
        notes: List of Note objects (melody)
        
    Returns:
        float: Score from 0-1 (higher is better)
    """
    if not chords or not notes:
        return 0.0
    
    total_score = 0.0
    total_weight = 0.0
    
    for chord in chords:
        # Get chord's MIDI notes (pitch classes)
        chord_pitch_classes = set([n % 12 for n in chord.midi_notes])
        
        # Find melody notes that occur during this chord
        chord_notes = [
            n for n in notes 
            if n.start_time >= chord.start_time and 
               n.start_time < chord.start_time + chord.duration
        ]
        
        if not chord_notes:
            continue
        
        # Score each melody note
        for note in chord_notes:
            note_pc = note.pitch % 12
            weight = note.duration * note.velocity
            
            if note_pc in chord_pitch_classes:
                # Note is IN the chord - perfect fit
                total_score += weight * 1.0
            else:
                # Note is NOT in chord - check if it's a scale tone
                # For now, penalize by 50%
                total_score += weight * 0.3
            
            total_weight += weight
    
    if total_weight == 0:
        return 0.0
    
    return total_score / total_weight


def smart_key_detection(basic_pitch_analysis, segment_duration=2.0):
    """
    Try multiple key candidates and pick the one with best chord fit
    
    Args:
        basic_pitch_analysis: Analysis dict from analyze_audio()
        segment_duration: Duration for chord segments
        
    Returns:
        dict: Best key, scale, chords, and scores for all candidates
    """
    print("\n🧠 Smart Key Detection - Testing Multiple Candidates...")
    print("=" * 60)
    
    # Get initial key detection
    detected_key = basic_pitch_analysis['key']
    detected_scale = basic_pitch_analysis['scale']
    
    print(f"Initial detection: {detected_key} {detected_scale}")
    
    # Get related keys to test
    key_candidates = get_related_keys(detected_key, detected_scale)
    
    print(f"\nTesting {len(key_candidates)} key candidates:")
    for i, (k, s) in enumerate(key_candidates, 1):
        print(f"  {i}. {k} {s}")
    
    # Convert notes
    notes = convert_basic_pitch_to_notes(basic_pitch_analysis['notes'])
    
    # Test each candidate
    results = []
    
    for key, scale in key_candidates:
        print(f"\n→ Testing {key} {scale}...", end=" ")
        
        # Generate chords for this key
        generator = ChordGenerator(key=key, scale=scale)
        chords = generator.generate_chords(notes, segment_duration=segment_duration)
        
        # Score the fit
        fit_score = score_chord_fit(chords, notes)
        
        # Average chord confidence
        avg_confidence = np.mean([c.confidence for c in chords]) if chords else 0.0
        
        # Combined score (70% fit, 30% chord confidence)
        combined_score = (fit_score * 0.7) + (avg_confidence * 0.3)
        
        print(f"Fit: {fit_score:.3f}, Conf: {avg_confidence:.3f}, Total: {combined_score:.3f}")
        
        results.append({
            'key': key,
            'scale': scale,
            'chords': chords,
            'fit_score': fit_score,
            'chord_confidence': avg_confidence,
            'combined_score': combined_score
        })
    
    # Sort by combined score
    results.sort(key=lambda x: x['combined_score'], reverse=True)
    
    # Pick the winner
    winner = results[0]
    
    print("\n" + "=" * 60)
    print("📊 Results:")
    print("-" * 60)
    for i, r in enumerate(results, 1):
        marker = "🏆" if i == 1 else "  "
        print(f"{marker} {i}. {r['key']:3s} {r['scale']:5s} - Score: {r['combined_score']:.3f} "
              f"(Fit: {r['fit_score']:.3f}, Conf: {r['chord_confidence']:.3f})")
    print("=" * 60)
    
    if winner['key'] != detected_key or winner['scale'] != detected_scale:
        print(f"\n✨ Key corrected: {detected_key} {detected_scale} → {winner['key']} {winner['scale']}")
    else:
        print(f"\n✓ Original key confirmed: {winner['key']} {winner['scale']}")
    
    return winner


def analyze_audio_with_smart_chords(audio_file, segment_duration=2.0):
    """
    Complete audio analysis with smart key detection and chord generation
    
    Args:
        audio_file: Path to audio file
        segment_duration: Duration for each chord segment
        
    Returns:
        Dictionary with complete analysis including best chords
    """
    
    print(f"🎵 Analyzing: {audio_file}")
    print("=" * 60)
    
    # Step 1: Run Basic-Pitch analysis
    print("\n[1/3] Running Basic-Pitch analysis...")
    result = analyze_audio(audio_file)
    
    if not result or not result.get('success'):
        return {
            "success": False,
            "error": result.get('error', 'Analysis failed')
        }
    
    basic_pitch_analysis = result['analysis']
    print(f"✓ Detected {basic_pitch_analysis['noteCount']} notes")
    
    # Step 2: Smart key detection with chord validation
    print("\n[2/3] Smart Key Detection...")
    winner = smart_key_detection(basic_pitch_analysis, segment_duration)
    
    # Step 3: Format output
    print("\n[3/3] Formatting results...")
    
    chord_generator = ChordGenerator(key=winner['key'], scale=winner['scale'])
    chords_dict = chord_generator.chords_to_dict(winner['chords'])
    
    enhanced_analysis = {
        "success": True,
        "analysis": {
            # Original note data
            "notes": basic_pitch_analysis['notes'],
            "noteCount": basic_pitch_analysis['noteCount'],
            
            # Key information (CORRECTED)
            "key": winner['key'],
            "scale": winner['scale'],
            "keyConfidence": winner['combined_score'],  # Use combined score
            "keyDetectionMethod": "smart_validation",
            
            # Original detected key (for reference)
            "initialKeyDetection": {
                "key": basic_pitch_analysis['key'],
                "scale": basic_pitch_analysis['scale'],
                "confidence": basic_pitch_analysis['keyConfidence']
            },
            
            # Tempo information
            "bpm": basic_pitch_analysis['bpm'],
            "tempoConfidence": basic_pitch_analysis['tempoConfidence'],
            "duration": basic_pitch_analysis['duration'],
            
            # Generated chords (VALIDATED)
            "chords": chords_dict,
            "chordCount": len(chords_dict),
            "chordFitScore": winner['fit_score'],
            
            # Metadata
            "segmentDuration": segment_duration,
            "chordGenerationMethod": "rule-based-with-validation"
        }
    }
    
    print("✓ Analysis complete!")
    
    return enhanced_analysis


def main():
    """Main entry point for CLI usage"""
    if len(sys.argv) < 2:
        print("Usage: python smart_analysis.py <audio_file> [segment_duration]")
        print("Example: python smart_analysis.py test-audio/nv.mp3 2.0")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    segment_duration = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0
    
    if not Path(audio_file).exists():
        print(f"Error: Audio file not found: {audio_file}")
        sys.exit(1)
    
    # Run smart analysis
    try:
        result = analyze_audio_with_smart_chords(audio_file, segment_duration)
        
        if not result.get('success'):
            print(f"\n❌ Analysis failed: {result.get('error', 'Unknown error')}")
            sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Print summary
    analysis = result['analysis']
    
    print("\n" + "=" * 70)
    print("FINAL RESULTS")
    print("=" * 70)
    
    print(f"\n📊 Musical Information:")
    print(f"  Final Key: {analysis['key']} {analysis['scale']} (confidence: {analysis['keyConfidence']:.2f})")
    
    if 'initialKeyDetection' in analysis:
        init = analysis['initialKeyDetection']
        if init['key'] != analysis['key'] or init['scale'] != analysis['scale']:
            print(f"  Initial Detection: {init['key']} {init['scale']} (rejected)")
    
    print(f"  BPM: {analysis['bpm']:.1f}")
    print(f"  Duration: {analysis['duration']:.1f}s")
    print(f"  Notes: {analysis['noteCount']}")
    print(f"  Chords: {analysis['chordCount']}")
    print(f"  Chord Fit Score: {analysis['chordFitScore']:.3f}")
    
    print(f"\n🎵 Generated Chord Progression:")
    print("-" * 70)
    for i, chord in enumerate(analysis['chords'], 1):
        print(f"  {i}. {chord['name']:6s} | "
              f"Time: {chord['start_time']:5.1f}s | "
              f"Duration: {chord['duration']:4.1f}s | "
              f"Confidence: {chord['confidence']:.2f}")
        print(f"     MIDI: {chord['midi_notes']}")
    
    # Save JSON
    output_file = Path(audio_file).stem + "_smart_analysis.json"
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"\n✅ Analysis saved to: {output_file}")
    
    return result


if __name__ == "__main__":
    main()