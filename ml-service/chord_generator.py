"""
Beatify - Chord Generation Algorithm
Rule-based chord progression generator from melody notes
"""

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from collections import Counter
import math


@dataclass
class Note:
    """Represents a musical note"""
    pitch: int  # MIDI note number (0-127)
    start_time: float  # seconds
    end_time: float  # seconds
    duration: float  # seconds
    velocity: float  # 0-1


@dataclass
class Chord:
    """Represents a generated chord"""
    name: str  # e.g., "C", "Am", "G7"
    root: int  # Root note MIDI number
    midi_notes: List[int]  # MIDI notes in the chord
    start_time: float  # seconds
    duration: float  # seconds
    confidence: float  # 0-1, how well it fits the melody


class ChordGenerator:
    """
    Generates chord progressions from melody notes using music theory rules
    """
    
    # Musical constants
    NOTES_IN_OCTAVE = 12
    NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    # Scale intervals (semitones from root)
    MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]  # W-W-H-W-W-W-H
    MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10]  # W-H-W-W-H-W-W
    
    # Chord intervals (triad structures)
    MAJOR_TRIAD = [0, 4, 7]  # Root, Major 3rd, Perfect 5th
    MINOR_TRIAD = [0, 3, 7]  # Root, Minor 3rd, Perfect 5th
    DIMINISHED_TRIAD = [0, 3, 6]  # Root, Minor 3rd, Diminished 5th
    
    # Diatonic chords in major key (scale degrees)
    MAJOR_KEY_CHORDS = {
        0: ('major', 'I'),      # I
        2: ('minor', 'ii'),     # ii
        4: ('minor', 'iii'),    # iii
        5: ('major', 'IV'),     # IV
        7: ('major', 'V'),      # V
        9: ('minor', 'vi'),     # vi
        11: ('diminished', 'vii°')  # vii°
    }
    
    # Diatonic chords in minor key
    MINOR_KEY_CHORDS = {
        0: ('minor', 'i'),      # i
        2: ('diminished', 'ii°'),  # ii°
        3: ('major', 'III'),    # III
        5: ('minor', 'iv'),     # iv
        7: ('major', 'V'),      # V (often borrowed from harmonic minor)
        8: ('major', 'VI'),     # VI
        10: ('major', 'VII')    # VII
    }
    
    # Common chord progressions (by scale degree)
    COMMON_PROGRESSIONS = [
        [0, 7, 9, 5],   # I-V-vi-IV (very popular)
        [0, 5, 7, 0],   # I-IV-V-I (classic)
        [0, 9, 5, 7],   # I-vi-IV-V (50s progression)
        [2, 7, 0],      # ii-V-I (jazz standard)
        [0, 4, 5, 0],   # I-iii-IV-I
    ]
    
    def __init__(self, key: str = "C", scale: str = "major"):
        """
        Initialize chord generator with key and scale
        
        Args:
            key: Root note of key (e.g., "C", "D", "F#")
            scale: "major" or "minor"
        """
        self.key = key
        self.scale = scale
        self.key_midi = self._note_name_to_midi(key)
        
    def _note_name_to_midi(self, note_name: str) -> int:
        """Convert note name to MIDI number (middle octave)"""
        base_notes = {'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67, 'A': 69, 'B': 71}
        
        # Handle sharps and flats
        if '#' in note_name or '♯' in note_name:
            base = note_name[0]
            return base_notes[base] + 1
        elif 'b' in note_name or '♭' in note_name:
            base = note_name[0]
            return base_notes[base] - 1
        else:
            return base_notes[note_name]
    
    def _midi_to_note_name(self, midi: int) -> str:
        """Convert MIDI number to note name"""
        return self.NOTE_NAMES[midi % self.NOTES_IN_OCTAVE]
    
    def _get_scale_notes(self) -> List[int]:
        """Get MIDI notes in the current key's scale"""
        intervals = self.MAJOR_SCALE if self.scale == "major" else self.MINOR_SCALE
        return [(self.key_midi + interval) % self.NOTES_IN_OCTAVE for interval in intervals]
    
    def _get_chord_quality(self, root_scale_degree: int) -> Tuple[str, str]:
        """
        Get chord quality (major/minor/dim) and numeral for a scale degree
        
        Args:
            root_scale_degree: 0-11 representing scale degree
            
        Returns:
            Tuple of (quality, roman_numeral)
        """
        chords_dict = self.MAJOR_KEY_CHORDS if self.scale == "major" else self.MINOR_KEY_CHORDS
        return chords_dict.get(root_scale_degree, ('major', 'I'))
    
    def _build_chord_notes(self, root: int, quality: str) -> List[int]:
        """
        Build chord MIDI notes from root and quality
        
        Args:
            root: Root note MIDI number
            quality: 'major', 'minor', or 'diminished'
            
        Returns:
            List of MIDI notes forming the chord
        """
        if quality == 'major':
            intervals = self.MAJOR_TRIAD
        elif quality == 'minor':
            intervals = self.MINOR_TRIAD
        else:  # diminished
            intervals = self.DIMINISHED_TRIAD
        
        # Build chord in a comfortable octave (C4-C5 range)
        base_octave = 60  # C4
        return [base_octave + (root % self.NOTES_IN_OCTAVE) + interval for interval in intervals]
    
    def _segment_melody(self, notes: List[Note], segment_duration: float = 2.0) -> List[List[Note]]:
        """
        Segment melody into time-based chunks for chord assignment
        
        Args:
            notes: List of melody notes
            segment_duration: Duration of each segment in seconds
            
        Returns:
            List of note segments
        """
        if not notes:
            return []
        
        segments = []
        current_segment = []
        segment_start = 0.0
        
        for note in sorted(notes, key=lambda n: n.start_time):
            if note.start_time >= segment_start + segment_duration:
                if current_segment:
                    segments.append(current_segment)
                current_segment = [note]
                segment_start = note.start_time
            else:
                current_segment.append(note)
        
        if current_segment:
            segments.append(current_segment)
        
        return segments
    
    def _analyze_segment(self, segment: List[Note]) -> Dict:
        """
        Analyze a melody segment to determine best-fitting chord
        
        Args:
            segment: List of notes in the segment
            
        Returns:
            Dict with analysis info
        """
        if not segment:
            return {'pitch_classes': [], 'most_common': None}
        
        # Get pitch classes (0-11) of all notes in segment
        pitch_classes = [note.pitch % self.NOTES_IN_OCTAVE for note in segment]
        
        # Weight by duration
        weighted_pitches = []
        for note in segment:
            weight = int(note.duration * 10)  # Convert to integer weight
            weighted_pitches.extend([note.pitch % self.NOTES_IN_OCTAVE] * weight)
        
        # Find most common pitch classes
        counter = Counter(weighted_pitches)
        most_common = counter.most_common(3)  # Top 3 notes
        
        return {
            'pitch_classes': list(set(pitch_classes)),
            'most_common': most_common,
            'start_time': segment[0].start_time,
            'end_time': segment[-1].end_time
        }
    
    def _find_best_chord(self, segment_analysis: Dict) -> Tuple[int, str, float]:
        """
        Find the best chord for a melody segment
        
        Args:
            segment_analysis: Analysis dict from _analyze_segment
            
        Returns:
            Tuple of (root_midi, quality, confidence)
        """
        pitch_classes = segment_analysis['pitch_classes']
        scale_notes = self._get_scale_notes()
        
        best_chord = None
        best_score = 0
        
        # Try each scale degree as a potential chord root
        for scale_degree in scale_notes:
            quality, numeral = self._get_chord_quality(scale_degree)
            chord_intervals = self._build_chord_notes(scale_degree, quality)
            chord_pitch_classes = [n % self.NOTES_IN_OCTAVE for n in chord_intervals]
            
            # Score: how many melody notes are in the chord
            matches = sum(1 for pc in pitch_classes if pc in chord_pitch_classes)
            score = matches / len(pitch_classes) if pitch_classes else 0
            
            if score > best_score:
                best_score = score
                best_chord = (scale_degree, quality, score)
        
        if best_chord:
            return best_chord
        
        # Fallback to tonic chord
        tonic_quality = 'major' if self.scale == 'major' else 'minor'
        return (self.key_midi % self.NOTES_IN_OCTAVE, tonic_quality, 0.5)
    
    def generate_chords(self, notes: List[Note], segment_duration: float = 2.0) -> List[Chord]:
        """
        Generate chord progression from melody notes
        
        Args:
            notes: List of melody notes
            segment_duration: How long each chord should last (seconds)
            
        Returns:
            List of generated chords
        """
        if not notes:
            return []
        
        # Segment the melody
        segments = self._segment_melody(notes, segment_duration)
        
        chords = []
        for segment in segments:
            # Analyze segment
            analysis = self._analyze_segment(segment)
            
            # Find best chord
            root_degree, quality, confidence = self._find_best_chord(analysis)
            
            # Build chord
            root_midi = self.key_midi + root_degree
            chord_notes = self._build_chord_notes(root_midi, quality)
            
            # Create chord name
            root_name = self._midi_to_note_name(root_midi)
            if quality == 'minor':
                chord_name = f"{root_name}m"
            elif quality == 'diminished':
                chord_name = f"{root_name}dim"
            else:
                chord_name = root_name
            
            # Calculate timing
            start_time = analysis['start_time']
            duration = analysis['end_time'] - start_time
            
            chord = Chord(
                name=chord_name,
                root=root_midi,
                midi_notes=chord_notes,
                start_time=start_time,
                duration=duration,
                confidence=confidence
            )
            chords.append(chord)
        
        return chords
    
    def generate_progression(self, duration: float, bpm: float = 120) -> List[Chord]:
        """
        Generate a common chord progression for a given duration
        
        Args:
            duration: Total duration in seconds
            bpm: Beats per minute
            
        Returns:
            List of chords
        """
        # Calculate chord duration (typically 4 beats = 1 bar)
        beats_per_chord = 4
        seconds_per_beat = 60 / bpm
        chord_duration = beats_per_chord * seconds_per_beat
        
        # Select a common progression
        progression_degrees = self.COMMON_PROGRESSIONS[0]  # I-V-vi-IV
        
        chords = []
        current_time = 0.0
        
        while current_time < duration:
            for degree in progression_degrees:
                if current_time >= duration:
                    break
                
                quality, numeral = self._get_chord_quality(degree)
                root_midi = self.key_midi + degree
                chord_notes = self._build_chord_notes(root_midi, quality)
                
                root_name = self._midi_to_note_name(root_midi)
                if quality == 'minor':
                    chord_name = f"{root_name}m"
                elif quality == 'diminished':
                    chord_name = f"{root_name}dim"
                else:
                    chord_name = root_name
                
                chord = Chord(
                    name=chord_name,
                    root=root_midi,
                    midi_notes=chord_notes,
                    start_time=current_time,
                    duration=min(chord_duration, duration - current_time),
                    confidence=1.0
                )
                chords.append(chord)
                current_time += chord_duration
        
        return chords
    
    def chords_to_dict(self, chords: List[Chord]) -> List[Dict]:
        """Convert chords to dictionary format for JSON output"""
        return [
            {
                'name': chord.name,
                'root': chord.root,
                'midi_notes': chord.midi_notes,
                'start_time': round(chord.start_time, 3),
                'duration': round(chord.duration, 3),
                'confidence': round(chord.confidence, 3)
            }
            for chord in chords
        ]


# Example usage
if __name__ == "__main__":
    # Example: Generate chords from sample melody notes
    sample_notes = [
        Note(60, 0.0, 0.5, 0.5, 0.8),    # C4
        Note(64, 0.5, 1.0, 0.5, 0.7),    # E4
        Note(67, 1.0, 1.5, 0.5, 0.9),    # G4
        Note(65, 1.5, 2.0, 0.5, 0.6),    # F4
        Note(62, 2.0, 2.5, 0.5, 0.8),    # D4
        Note(67, 2.5, 3.0, 0.5, 0.7),    # G4
        Note(64, 3.0, 3.5, 0.5, 0.9),    # E4
        Note(60, 3.5, 4.0, 0.5, 0.8),    # C4
    ]
    
    # Create generator for C major
    generator = ChordGenerator(key="C", scale="major")
    
    # Generate chords from melody
    chords = generator.generate_chords(sample_notes, segment_duration=2.0)
    
    print("Generated Chords from Melody:")
    print("-" * 50)
    for i, chord in enumerate(chords, 1):
        print(f"{i}. {chord.name:6s} | Time: {chord.start_time:.1f}s | "
              f"Duration: {chord.duration:.1f}s | Confidence: {chord.confidence:.2f}")
        print(f"   MIDI: {chord.midi_notes}")
    
    print("\n" + "=" * 50)
    print("\nGenerated Common Progression (8 seconds):")
    print("-" * 50)
    
    # Generate a standard progression
    progression_chords = generator.generate_progression(duration=8.0, bpm=120)
    
    for i, chord in enumerate(progression_chords, 1):
        print(f"{i}. {chord.name:6s} | Time: {chord.start_time:.1f}s | "
              f"Duration: {chord.duration:.1f}s")
        print(f"   MIDI: {chord.midi_notes}")