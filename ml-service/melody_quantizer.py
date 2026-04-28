from chord_generator import Note
import math


class MelodyQuantizer:
    def __init__(self, bpm, beats_per_bar=4, resolution=4):
        self.bpm = bpm
        self.spb = 60 / bpm
        self.beats_per_bar = beats_per_bar
        self.bar_duration = beats_per_bar * self.spb
        self.grid = self.spb * (4 / resolution)

    def quantize_notes(self, notes):
        if not notes:
            return []

        notes = sorted(notes, key=lambda n: n.start_time)

        quantized = []

        for i, n in enumerate(notes):
            # Snap start time to grid (absolute time reference)
            snapped_start = round(n.start_time / self.grid) * self.grid

            if quantized:
                prev_end = quantized[-1].end_time

                # If snapping caused overlap, push forward minimally
                if snapped_start < prev_end:
                    snapped_start = prev_end

            # Preserve original duration but snap to grid lightly
            snapped_duration = round(n.duration / self.grid) * self.grid

            # Prevent ultra-short notes
            if snapped_duration < self.grid * 0.5:
                snapped_duration = self.grid * 0.5

            end = snapped_start + snapped_duration

            quantized.append(
                Note(
                    pitch=n.pitch,
                    start_time=round(snapped_start, 4),
                    end_time=round(end, 4),
                    duration=round(snapped_duration, 4),
                    velocity=n.velocity,
                )
            )

        return quantized