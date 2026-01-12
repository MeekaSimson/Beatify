"""
Enhanced Audio Analysis with Chord Generation
Integrates with existing Basic-Pitch analysis and adds chord generation
"""

import sys
import json
from pathlib import Path

# ✅ REAL IMPORT - Import your existing analysis function
from analyze_audio import analyze_audio

# Import chord generator
from chord_generator import ChordGenerator, Note



def convert_basic_pitch_to_notes(basic_pitch_notes):
    """
    Convert Basic-Pitch note format to Note objects
    
    Args:
        basic_pitch_notes: List of notes from Basic-Pitch
        
    Returns:
        List of Note objects
    """
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


def analyze_audio_with_chords(audio_file, key="C", scale="major", segment_duration=2.0):
    """
    Complete audio analysis including chord generation
    
    Args:
        audio_file: Path to audio file
        key: Musical key (e.g., "C", "D", "F#")
        scale: "major" or "minor"
        segment_duration: Duration for each chord segment
        
    Returns:
        Dictionary with complete analysis including chords
    """
    
    # Step 1: Run REAL Basic-Pitch analysis
    print(f"Analyzing audio file: {audio_file}")
    print("Running Basic-Pitch analysis...")
    
    # ✅ REAL ANALYSIS - Call your existing function
    result = analyze_audio(audio_file)
    
    # Check if analysis was successful
    if not result or not result.get('success'):
        return {
            "success": False,
            "error": result.get('error', 'Analysis failed')
        }
    
    # Extract the analysis data from the nested structure
    basic_pitch_analysis = result['analysis']
    
    # Check if we have notes
    if not basic_pitch_analysis or 'notes' not in basic_pitch_analysis:
        return {
            "success": False,
            "error": "Basic-Pitch analysis returned no notes"
        }
    
    print(f"✓ Basic-Pitch detected {len(basic_pitch_analysis['notes'])} notes")
    
    # Step 2: Extract detected key and scale
    detected_key = basic_pitch_analysis.get('key', key)
    detected_scale = basic_pitch_analysis.get('scale', scale)
    
    print(f"✓ Detected key: {detected_key} {detected_scale}")
    
    # Step 3: Convert notes to Note objects
    notes = convert_basic_pitch_to_notes(basic_pitch_analysis['notes'])
    
    # Step 4: Generate chords
    print(f"Generating chords...")
    chord_generator = ChordGenerator(key=detected_key, scale=detected_scale)
    chords = chord_generator.generate_chords(notes, segment_duration=segment_duration)
    
    print(f"✓ Generated {len(chords)} chords")
    
    # Step 5: Convert chords to dictionary format
    chords_dict = chord_generator.chords_to_dict(chords)
    
    # Step 6: Create enhanced analysis output
    enhanced_analysis = {
        "success": True,
        "analysis": {
            # Original note data
            "notes": basic_pitch_analysis['notes'],
            "noteCount": basic_pitch_analysis['noteCount'],
            
            # Key and tempo information
            "key": detected_key,
            "scale": detected_scale,
            "keyConfidence": basic_pitch_analysis.get('keyConfidence', 0.0),
            "bpm": basic_pitch_analysis.get('bpm', 120.0),
            "tempoConfidence": basic_pitch_analysis.get('tempoConfidence', 0.0),
            "duration": basic_pitch_analysis.get('duration', 0.0),
            
            # NEW: Generated chords
            "chords": chords_dict,
            "chordCount": len(chords_dict),
            
            # Metadata
            "segmentDuration": segment_duration,
            "chordGenerationMethod": "rule-based"
        }
    }
    
    return enhanced_analysis


def main():
    """Main entry point for CLI usage"""
    if len(sys.argv) < 2:
        print("Usage: python analyze_with_chords.py <audio_file> [key] [scale] [segment_duration]")
        print("Example: python analyze_with_chords.py sample.mp3 C major 2.0")
        print("\nNote: If key/scale are not provided, they will be auto-detected from the audio.")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    key = sys.argv[2] if len(sys.argv) > 2 else "C"
    scale = sys.argv[3] if len(sys.argv) > 3 else "major"
    segment_duration = float(sys.argv[4]) if len(sys.argv) > 4 else 2.0
    
    # Validate inputs
    if scale not in ["major", "minor"]:
        print(f"Error: Scale must be 'major' or 'minor', got '{scale}'")
        sys.exit(1)
    
    if not Path(audio_file).exists():
        print(f"Error: Audio file not found: {audio_file}")
        sys.exit(1)
    
    # Run analysis
    try:
        result = analyze_audio_with_chords(audio_file, key, scale, segment_duration)
        
        if not result.get('success'):
            print(f"\n❌ Analysis failed: {result.get('error', 'Unknown error')}")
            sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Print results
    print("\n" + "=" * 70)
    print("ANALYSIS RESULTS")
    print("=" * 70)
    
    analysis = result['analysis']
    
    print(f"\n📊 Musical Information:")
    print(f"  Key: {analysis['key']} {analysis['scale']}")
    print(f"  BPM: {analysis['bpm']:.1f}")
    print(f"  Duration: {analysis['duration']:.1f}s")
    print(f"  Notes detected: {analysis['noteCount']}")
    print(f"  Chords generated: {analysis['chordCount']}")
    
    print(f"\n🎵 Generated Chord Progression:")
    print("-" * 70)
    for i, chord in enumerate(analysis['chords'], 1):
        print(f"  {i}. {chord['name']:6s} | "
              f"Time: {chord['start_time']:5.1f}s | "
              f"Duration: {chord['duration']:4.1f}s | "
              f"Confidence: {chord['confidence']:.2f}")
        print(f"     MIDI notes: {chord['midi_notes']}")
    
    # Output JSON (useful for backend integration)
    output_file = Path(audio_file).stem + "_analysis.json"
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"\n✅ Analysis saved to: {output_file}")
    
    return result


if __name__ == "__main__":
    main()