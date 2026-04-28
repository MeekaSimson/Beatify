"""
Unit tests for Chord Generator
Run with: pytest test_chord_generator.py -v
"""

import unittest
from chord_generator import ChordGenerator, Note, Chord


class TestChordGenerator(unittest.TestCase):
    """Test suite for ChordGenerator class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.generator_c_major = ChordGenerator(key="C", scale="major")
        self.generator_a_minor = ChordGenerator(key="A", scale="minor")
        
        # Sample melody in C major (C-E-G-C pattern)
        self.sample_notes_c_major = [
            Note(60, 0.0, 0.5, 0.5, 0.8),  # C4
            Note(64, 0.5, 1.0, 0.5, 0.7),  # E4
            Note(67, 1.0, 1.5, 0.5, 0.9),  # G4
            Note(60, 1.5, 2.0, 0.5, 0.6),  # C4
        ]
        
        # Sample melody in A minor (A-C-E-A pattern)
        self.sample_notes_a_minor = [
            Note(69, 0.0, 0.5, 0.5, 0.8),  # A4
            Note(72, 0.5, 1.0, 0.5, 0.7),  # C5
            Note(76, 1.0, 1.5, 0.5, 0.9),  # E5
            Note(69, 1.5, 2.0, 0.5, 0.6),  # A4
        ]
    
    # ========== Initialization Tests ==========
    
    def test_initialization_c_major(self):
        """Test initialization with C major"""
        self.assertEqual(self.generator_c_major.key, "C")
        self.assertEqual(self.generator_c_major.scale, "major")
        self.assertEqual(self.generator_c_major.key_midi, 60)
    
    def test_initialization_a_minor(self):
        """Test initialization with A minor"""
        self.assertEqual(self.generator_a_minor.key, "A")
        self.assertEqual(self.generator_a_minor.scale, "minor")
        self.assertEqual(self.generator_a_minor.key_midi, 69)
    
    def test_initialization_with_sharps(self):
        """Test initialization with sharp keys"""
        gen = ChordGenerator(key="F#", scale="major")
        self.assertEqual(gen.key, "F#")
        self.assertEqual(gen.key_midi, 66)  # F# is 66
    
    # ========== Note Conversion Tests ==========
    
    def test_note_name_to_midi(self):
        """Test note name to MIDI conversion"""
        test_cases = [
            ("C", 60),
            ("D", 62),
            ("E", 64),
            ("F", 65),
            ("G", 67),
            ("A", 69),
            ("B", 71),
            ("C#", 61),
            ("F#", 66),
        ]
        
        for note_name, expected_midi in test_cases:
            with self.subTest(note=note_name):
                result = self.generator_c_major._note_name_to_midi(note_name)
                self.assertEqual(result, expected_midi)
    
    def test_midi_to_note_name(self):
        """Test MIDI to note name conversion"""
        test_cases = [
            (60, "C"),
            (61, "C#"),
            (62, "D"),
            (64, "E"),
            (65, "F"),
            (67, "G"),
            (69, "A"),
            (71, "B"),
        ]
        
        for midi, expected_name in test_cases:
            with self.subTest(midi=midi):
                result = self.generator_c_major._midi_to_note_name(midi)
                self.assertEqual(result, expected_name)
    
    # ========== Scale Tests ==========
    
    def test_get_scale_notes_c_major(self):
        """Test getting C major scale notes"""
        scale_notes = self.generator_c_major._get_scale_notes()
        expected = [0, 2, 4, 5, 7, 9, 11]  # C D E F G A B
        self.assertEqual(scale_notes, expected)
    
    def test_get_scale_notes_a_minor(self):
        """Test getting A minor scale notes"""
        scale_notes = self.generator_a_minor._get_scale_notes()
        # A minor: A B C D E F G (9, 11, 0, 2, 4, 5, 7 in pitch class)
        expected = [9, 11, 0, 2, 4, 5, 7]
        self.assertEqual(scale_notes, expected)
    
    # ========== Chord Quality Tests ==========
    
    def test_chord_quality_major_key(self):
        """Test chord qualities in major key"""
        test_cases = [
            (0, "major", "I"),      # I
            (2, "minor", "ii"),     # ii
            (4, "minor", "iii"),    # iii
            (5, "major", "IV"),     # IV
            (7, "major", "V"),      # V
            (9, "minor", "vi"),     # vi
            (11, "diminished", "vii°"),  # vii°
        ]
        
        for degree, expected_quality, expected_numeral in test_cases:
            with self.subTest(degree=degree):
                quality, numeral = self.generator_c_major._get_chord_quality(degree)
                self.assertEqual(quality, expected_quality)
                self.assertEqual(numeral, expected_numeral)
    
    def test_chord_quality_minor_key(self):
        """Test chord qualities in minor key"""
        test_cases = [
            (0, "minor", "i"),       # i
            (2, "diminished", "ii°"),  # ii°
            (3, "major", "III"),     # III
            (5, "minor", "iv"),      # iv
            (7, "major", "V"),       # V
        ]
        
        for degree, expected_quality, expected_numeral in test_cases:
            with self.subTest(degree=degree):
                quality, numeral = self.generator_a_minor._get_chord_quality(degree)
                self.assertEqual(quality, expected_quality)
    
    # ========== Chord Building Tests ==========
    
    def test_build_major_chord(self):
        """Test building a major chord"""
        chord_notes = self.generator_c_major._build_chord_notes(0, "major")
        # C major: C-E-G (60, 64, 67)
        self.assertEqual(chord_notes, [60, 64, 67])
    
    def test_build_minor_chord(self):
        """Test building a minor chord"""
        chord_notes = self.generator_c_major._build_chord_notes(2, "minor")
        # D minor: D-F-A (62, 65, 69)
        self.assertEqual(chord_notes, [62, 65, 69])
    
    def test_build_diminished_chord(self):
        """Test building a diminished chord"""
        chord_notes = self.generator_c_major._build_chord_notes(11, "diminished")
        # B diminished: B-D-F (71, 62, 65) -> wraps to next octave
        expected = [71, 74, 77]  # B-D-F in same octave
        self.assertEqual(chord_notes, expected)
    
    # ========== Melody Segmentation Tests ==========
    
    def test_segment_melody_simple(self):
        """Test segmenting a simple melody"""
        segments = self.generator_c_major._segment_melody(
            self.sample_notes_c_major, 
            segment_duration=1.0
        )
        
        # Should create 2 segments (0-1s and 1-2s)
        self.assertEqual(len(segments), 2)
        self.assertEqual(len(segments[0]), 2)  # First 2 notes
        self.assertEqual(len(segments[1]), 2)  # Last 2 notes
    
    def test_segment_melody_entire_duration(self):
        """Test segmenting entire melody as one segment"""
        segments = self.generator_c_major._segment_melody(
            self.sample_notes_c_major, 
            segment_duration=5.0
        )
        
        # All notes should be in one segment
        self.assertEqual(len(segments), 1)
        self.assertEqual(len(segments[0]), 4)
    
    def test_segment_melody_empty(self):
        """Test segmenting empty melody"""
        segments = self.generator_c_major._segment_melody([], segment_duration=2.0)
        self.assertEqual(segments, [])
    
    # ========== Segment Analysis Tests ==========
    
    def test_analyze_segment_c_major(self):
        """Test analyzing a C major melody segment"""
        analysis = self.generator_c_major._analyze_segment(self.sample_notes_c_major)
        
        self.assertIn('pitch_classes', analysis)
        self.assertIn('most_common', analysis)
        self.assertIn('start_time', analysis)
        self.assertIn('end_time', analysis)
        
        # Should detect C (0), E (4), G (7) pitch classes
        pitch_classes = set(analysis['pitch_classes'])
        self.assertTrue({0, 4, 7}.issubset(pitch_classes))
    
    def test_analyze_segment_empty(self):
        """Test analyzing empty segment"""
        analysis = self.generator_c_major._analyze_segment([])
        self.assertEqual(analysis['pitch_classes'], [])
        self.assertIsNone(analysis['most_common'])
    
    # ========== Chord Generation Tests ==========
    
    def test_generate_chords_from_melody(self):
        """Test generating chords from melody"""
        chords = self.generator_c_major.generate_chords(
            self.sample_notes_c_major,
            segment_duration=2.0
        )
        
        # Should generate at least one chord
        self.assertGreater(len(chords), 0)
        
        # Check chord structure
        for chord in chords:
            self.assertIsInstance(chord, Chord)
            self.assertIsInstance(chord.name, str)
            self.assertIsInstance(chord.midi_notes, list)
            self.assertEqual(len(chord.midi_notes), 3)  # Triads have 3 notes
            self.assertGreaterEqual(chord.confidence, 0)
            self.assertLessEqual(chord.confidence, 1)
    
    def test_generate_chords_c_major_melody_gives_c_chord(self):
        """Test that C major melody generates C major chord"""
        chords = self.generator_c_major.generate_chords(
            self.sample_notes_c_major,
            segment_duration=5.0
        )
        
        # Should generate a C major chord
        self.assertEqual(len(chords), 1)
        self.assertEqual(chords[0].name, "C")
        self.assertEqual(chords[0].midi_notes, [60, 64, 67])  # C-E-G
    
    def test_generate_chords_empty_notes(self):
        """Test generating chords from empty note list"""
        chords = self.generator_c_major.generate_chords([])
        self.assertEqual(chords, [])
    
    # ========== Progression Generation Tests ==========
    
    def test_generate_progression_basic(self):
        """Test generating a basic progression"""
        chords = self.generator_c_major.generate_progression(
            duration=8.0,
            bpm=120
        )
        
        # At 120 BPM, 4 beats = 2 seconds per chord
        # 8 seconds = 4 chords
        self.assertEqual(len(chords), 4)
        
        # Should follow I-V-vi-IV pattern (C-G-Am-F)
        expected_names = ["C", "G", "Am", "F"]
        actual_names = [chord.name for chord in chords]
        self.assertEqual(actual_names, expected_names)
    
    def test_generate_progression_timing(self):
        """Test progression timing is correct"""
        chords = self.generator_c_major.generate_progression(
            duration=8.0,
            bpm=120
        )
        
        # Each chord should be 2 seconds
        for chord in chords:
            self.assertEqual(chord.duration, 2.0)
        
        # Start times should be 0, 2, 4, 6
        expected_times = [0.0, 2.0, 4.0, 6.0]
        actual_times = [chord.start_time for chord in chords]
        self.assertEqual(actual_times, expected_times)
    
    def test_generate_progression_different_bpm(self):
        """Test progression with different BPM"""
        chords = self.generator_c_major.generate_progression(
            duration=4.0,
            bpm=60  # Slower tempo
        )
        
        # At 60 BPM, 4 beats = 4 seconds per chord
        # 4 seconds = 1 chord
        self.assertEqual(len(chords), 1)
        self.assertEqual(chords[0].duration, 4.0)
    
    # ========== Conversion Tests ==========
    
    def test_chords_to_dict(self):
        """Test converting chords to dictionary"""
        chords = self.generator_c_major.generate_chords(
            self.sample_notes_c_major,
            segment_duration=2.0
        )
        
        chord_dicts = self.generator_c_major.chords_to_dict(chords)
        
        # Check structure
        self.assertIsInstance(chord_dicts, list)
        self.assertGreater(len(chord_dicts), 0)
        
        for chord_dict in chord_dicts:
            self.assertIn('name', chord_dict)
            self.assertIn('root', chord_dict)
            self.assertIn('midi_notes', chord_dict)
            self.assertIn('start_time', chord_dict)
            self.assertIn('duration', chord_dict)
            self.assertIn('confidence', chord_dict)
            
            # Check data types
            self.assertIsInstance(chord_dict['name'], str)
            self.assertIsInstance(chord_dict['root'], int)
            self.assertIsInstance(chord_dict['midi_notes'], list)
            self.assertIsInstance(chord_dict['start_time'], float)
            self.assertIsInstance(chord_dict['duration'], float)
            self.assertIsInstance(chord_dict['confidence'], float)
    
    # ========== Integration Tests ==========
    
    def test_full_workflow_c_major(self):
        """Test complete workflow from notes to chords"""
        # Create notes
        notes = [
            Note(60, 0.0, 1.0, 1.0, 0.8),  # C
            Note(64, 1.0, 2.0, 1.0, 0.8),  # E
            Note(67, 2.0, 3.0, 1.0, 0.8),  # G
            Note(65, 3.0, 4.0, 1.0, 0.8),  # F
        ]
        
        # Generate chords
        chords = self.generator_c_major.generate_chords(notes, segment_duration=2.0)
        
        # Convert to dict
        chord_dicts = self.generator_c_major.chords_to_dict(chords)
        
        # Verify output
        self.assertEqual(len(chords), 2)  # 4 seconds / 2 second segments
        self.assertIsInstance(chord_dicts, list)
        
        # First chord should likely be C major (contains C, E, G)
        # Second chord should likely be F major or C major
        self.assertIn(chord_dicts[0]['name'], ['C', 'F', 'G'])
    
    def test_full_workflow_a_minor(self):
        """Test complete workflow with A minor"""
        chords = self.generator_a_minor.generate_chords(
            self.sample_notes_a_minor,
            segment_duration=5.0
        )
        
        # Should generate Am chord
        self.assertEqual(len(chords), 1)
        self.assertEqual(chords[0].name, "Am")


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling"""
    
    def setUp(self):
        self.generator = ChordGenerator(key="C", scale="major")
    
    def test_very_short_notes(self):
        """Test with very short duration notes"""
        notes = [
            Note(60, 0.0, 0.01, 0.01, 0.8),
            Note(64, 0.01, 0.02, 0.01, 0.8),
        ]
        
        chords = self.generator.generate_chords(notes, segment_duration=0.1)
        self.assertGreater(len(chords), 0)
    
    def test_long_duration(self):
        """Test with long duration notes"""
        notes = [
            Note(60, 0.0, 10.0, 10.0, 0.8),
        ]
        
        chords = self.generator.generate_chords(notes, segment_duration=2.0)
        self.assertGreater(len(chords), 0)
    
    def test_different_keys(self):
        """Test with various keys"""
        keys = ["C", "D", "E", "F", "G", "A", "B", "F#", "C#"]
        
        for key in keys:
            with self.subTest(key=key):
                gen = ChordGenerator(key=key, scale="major")
                self.assertEqual(gen.key, key)
                
                # Generate a simple progression
                chords = gen.generate_progression(duration=4.0, bpm=120)
                self.assertGreater(len(chords), 0)


# Run tests
if __name__ == "__main__":
    unittest.main(verbosity=2)