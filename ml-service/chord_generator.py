from __future__ import annotations
from typing import List
from dataclasses import dataclass
from collections import Counter
import math


@dataclass
class Note:
    pitch: int
    start_time: float
    end_time: float
    duration: float
    velocity: float


@dataclass
class Chord:
    name: str
    root: int
    midi_notes: List[int]
    start_time: float
    duration: float
    confidence: float


class ChordGenerator:

    NOTES_IN_OCTAVE = 12
    NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
    MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10]

    MAJOR_TRIAD = [0, 4, 7]
    MINOR_TRIAD = [0, 3, 7]
    DIMINISHED_TRIAD = [0, 3, 6]

    MAJOR_KEY_CHORDS = {
        0: ('major', 'I'),
        2: ('minor', 'ii'),
        4: ('minor', 'iii'),
        5: ('major', 'IV'),
        7: ('major', 'V'),
        9: ('minor', 'vi'),
        11: ('diminished', 'vii°')
    }

    MINOR_KEY_CHORDS = {
        0: ('minor', 'i'),
        2: ('diminished', 'ii°'),
        3: ('major', 'III'),
        5: ('minor', 'iv'),
        7: ('major', 'V'),
        8: ('major', 'VI'),
        10: ('major', 'VII')
    }

    def __init__(self, key="C", scale="major"):
        self.key = key
        self.scale = scale
        self.key_midi = self._note_name_to_midi(key)

    def _note_name_to_midi(self, note_name):
        base = {'C':60,'D':62,'E':64,'F':65,'G':67,'A':69,'B':71}
        if '#' in note_name: return base[note_name[0]]+1
        if 'b' in note_name: return base[note_name[0]]-1
        return base[note_name]

    def _midi_to_note_name(self, midi):
        return self.NOTE_NAMES[midi % self.NOTES_IN_OCTAVE]

    def _get_scale_intervals(self):
        return self.MAJOR_SCALE if self.scale == "major" else self.MINOR_SCALE

    def _get_chord_quality(self, degree):
        d = self.MAJOR_KEY_CHORDS if self.scale=="major" else self.MINOR_KEY_CHORDS
        return d.get(degree, ('major','I'))

    def _build_chord_notes(self, root, quality):
        triad = self.MAJOR_TRIAD if quality=="major" else \
                 self.MINOR_TRIAD if quality=="minor" else \
                 self.DIMINISHED_TRIAD
        return [60 + (root % 12) + i for i in triad]

    def _analyze_bar(self, notes):
        pcs = [n.pitch % 12 for n in notes]
        weighted = []
        for n in notes:
            weighted += [n.pitch % 12] * max(1,int(n.duration*10))
        return Counter(weighted), set(pcs)

    def _best_chord_for_bar(self, pitch_set):
        key_pc = self.key_midi % 12
        scale_intervals = self._get_scale_intervals()
        default_quality = "major" if self.scale == "major" else "minor"
        best = (0, default_quality, 0.0)

        for deg in scale_intervals:
            quality, _ = self._get_chord_quality(deg)
            triad = (self.MAJOR_TRIAD if quality == "major"
                     else self.MINOR_TRIAD if quality == "minor"
                     else self.DIMINISHED_TRIAD)
            chord_pcs = set(((key_pc + deg + i) % 12) for i in triad)
            matches = len(pitch_set & chord_pcs)
            score = matches / len(pitch_set) if pitch_set else 0
            if score > best[2]:
                best = (deg, quality, score)
        return best

    def generate_chords(self, notes: List[Note], bpm: float, beats_per_bar=4, total_duration=None):

        if not notes:
            return []

        seconds_per_beat = 60 / bpm
        bar_duration = beats_per_bar * seconds_per_beat

        bars = {}
        for n in notes:
            idx = int(n.start_time // bar_duration)
            bars.setdefault(idx, []).append(n)

        # ✅ NEW: determine bars from full duration
        if total_duration:
            last_bar = int(total_duration // bar_duration)
        else:
            last_bar = int(max(n.end_time for n in notes) // bar_duration)

        chords = []
        prev = None

        for bar_idx in range(last_bar + 1):

            bar_notes = bars.get(bar_idx, [])

            if bar_notes:
                _, pitch_set = self._analyze_bar(bar_notes)
                root_deg, quality, conf = self._best_chord_for_bar(pitch_set)
                prev = (root_deg, quality, conf)
            else:
                if prev:
                    root_deg, quality, conf = prev
                else:
                    root_deg = 0
                    quality = "major" if self.scale=="major" else "minor"
                    conf = 0.3

            root_midi = self.key_midi + root_deg
            chord_notes = self._build_chord_notes(root_midi, quality)
            name = self._midi_to_note_name(root_midi) + \
                   ("m" if quality=="minor" else "dim" if quality=="diminished" else "")

            chords.append(
                Chord(
                    name=name,
                    root=root_midi,
                    midi_notes=chord_notes,
                    start_time=bar_idx * bar_duration,
                    duration=bar_duration,
                    confidence=round(conf, 3),
                )
            )

        return chords

    def chords_to_dict(self, chords: List[Chord]):
        return [
            {
                "name": c.name,
                "root": c.root,
                "midi_notes": c.midi_notes,
                "start_time": round(c.start_time, 3),
                "duration": round(c.duration, 3),
                "confidence": round(c.confidence, 3),
            }
            for c in chords
        ]