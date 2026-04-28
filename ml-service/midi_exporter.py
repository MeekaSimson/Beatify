# ml-service/midi_exporter.py

import pretty_midi


class MidiExporter:
    """
    Exports melody, chords, bass, and drums to a multi-track MIDI file.
    BPM is set once at initialization and never recomputed.
    """

    # Velocity clamp range for melody notes
    MELODY_VEL_MIN = 70
    MELODY_VEL_MAX = 100

    INSTRUMENT_PRESETS = {
        "standard": {
            "melody":        "Acoustic Grand Piano",
            "melody_label":  "Melody (Grand Piano)",
            "chords":        "Acoustic Grand Piano",
            "chords_label":  "Chords (Grand Piano)",
            "bass":          "Electric Bass (finger)",
            "bass_label":    "Bass (Electric Bass)",
            "drums_label":   "Drums",
        },
        "soft": {
            "melody":        "Electric Piano 1",
            "melody_label":  "Melody - Rhodes Electric Piano",
            "chords":        "String Ensemble 1",
            "chords_label":  "Chords - String Ensemble",
            "bass":          "Acoustic Bass",
            "bass_label":    "Bass - Acoustic Bass",
            "drums_label":   "Drums - Ride + Side Stick (soft)",
        },
    }

    def __init__(self, bpm: float, style: str = "standard"):
        self.bpm = bpm
        self.style = style if style in self.INSTRUMENT_PRESETS else "standard"
        self.midi = pretty_midi.PrettyMIDI(initial_tempo=bpm)

    def add_melody(self, notes):
        preset = self.INSTRUMENT_PRESETS[self.style]
        instrument = pretty_midi.Instrument(
            program=pretty_midi.instrument_name_to_program(preset["melody"]),
            name=preset["melody_label"],
        )

        for n in notes:
            # Use note timing exactly as provided by the quantizer
            start = float(n.start_time)
            end = float(n.end_time)  # = start_time + duration from quantizer

            # Clamp velocity to musical range (70–100) to avoid overly quiet/loud hits
            raw_vel = int(n.velocity * 127)
            velocity = max(self.MELODY_VEL_MIN, min(self.MELODY_VEL_MAX, raw_vel))

            note = pretty_midi.Note(
                velocity=velocity,
                pitch=int(n.pitch),
                start=start,
                end=end,
            )
            instrument.notes.append(note)

        self.midi.instruments.append(instrument)

    def add_chords(self, chords):
        preset = self.INSTRUMENT_PRESETS[self.style]
        instrument = pretty_midi.Instrument(
            program=pretty_midi.instrument_name_to_program(preset["chords"]),
            name=preset["chords_label"],
        )

        for chord in chords:
            for pitch in chord["midi_notes"]:
                note = pretty_midi.Note(
                    velocity=int(chord["confidence"] * 127),
                    pitch=int(pitch),
                    start=float(chord["start_time"]),
                    end=float(chord["start_time"] + chord["duration"]),
                )
                instrument.notes.append(note)

        self.midi.instruments.append(instrument)

    def add_bass(self, bass_notes):
        preset = self.INSTRUMENT_PRESETS[self.style]
        instrument = pretty_midi.Instrument(
            program=pretty_midi.instrument_name_to_program(preset["bass"]),
            name=preset["bass_label"],
        )

        for b in bass_notes:
            note = pretty_midi.Note(
                velocity=int(b["velocity"] * 127),
                pitch=int(b["pitch"]),
                start=float(b["startTime"]),
                end=float(b["startTime"] + b["duration"]),
            )
            instrument.notes.append(note)

        self.midi.instruments.append(instrument)

    def add_drums(self, drum_pattern):
        preset = self.INSTRUMENT_PRESETS[self.style]
        instrument = pretty_midi.Instrument(program=0, is_drum=True, name=preset["drums_label"])

        for d in drum_pattern:
            note = pretty_midi.Note(
                velocity=int(d["velocity"] * 127),
                pitch=int(d["pitch"]),
                start=float(d["time"]),
                end=float(d["time"] + 0.05),  # short drum hit
            )
            instrument.notes.append(note)

        self.midi.instruments.append(instrument)

    def write(self, file_path: str):
        self.midi.write(file_path)