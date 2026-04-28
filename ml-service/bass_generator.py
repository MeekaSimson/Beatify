# ml-service/bass_generator.py

from typing import List, Dict
from dataclasses import dataclass

# Import Chord definition from chord_generator
# Adjust import if your structure differs
from chord_generator import Chord


class BassGenerator:
    """
    Generates bass lines from a chord progression.

    MVP implementation:
    - One bass note per chord
    - Root note only
    - Fixed octave displacement
    """

    def __init__(self, octave_down: int = 2):
        """
        :param octave_down: Number of octaves below chord root
        """
        self.octave_down = octave_down

    def generate_bass_line(
        self,
        chords: List[Chord],
        style: str = "root"
    ) -> List[Dict]:
        """
        Generate bass notes from chord progression.

        :param chords: List of Chord objects
        :param style: Bass style ('root' only for MVP)
        :return: List of bass note dictionaries
        """

        if style != "root":
            raise ValueError(f"Unsupported bass style: {style}")

        bass_notes = []

        for chord in chords:
            bass_note = self._generate_root_note(chord)
            if bass_note:
                bass_notes.append(bass_note)

        return bass_notes

    def _generate_root_note(self, chord: Chord) -> Dict:
        """
        Generate a single root bass note for a chord.
        """

        # Lower root by specified octaves
        pitch = chord.root - (12 * self.octave_down)

        # Clamp to valid MIDI range
        pitch = max(0, min(127, pitch))

        # Velocity scaled by chord confidence
        velocity = 0.6 + (0.3 * chord.confidence)
        velocity = round(min(1.0, max(0.0, velocity)), 2)

        return {
            "pitch": pitch,
            "startTime": round(chord.start_time, 3),
            "duration": round(chord.duration, 3),
            "velocity": velocity
        }
    