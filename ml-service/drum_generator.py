# ml-service/drum_generator.py

from typing import List, Dict


class DrumGenerator:
    """
    Generates basic 4/4 drum patterns aligned to melody start.
    """

    KICK         = 36
    SNARE        = 38
    SIDE_STICK   = 37
    HIHAT_CLOSED = 42
    RIDE         = 51

    def generate_pattern(
        self,
        bpm: float,
        duration: float,
        start_offset: float,
        style: str = "basic",
    ) -> List[Dict]:

        if bpm <= 0:
            raise ValueError("BPM must be positive")

        seconds_per_beat = 60.0 / bpm
        drum_hits = []

        current_time = start_offset
        beat_index = 0

        while current_time < start_offset + duration:
            beat_in_bar = beat_index % 4

            if style == "soft":
                # Ride cymbal every beat for a smoother texture
                drum_hits.append(self._hit(self.RIDE, current_time, 0.45))
                # Soft kick on beat 1
                if beat_in_bar == 0:
                    drum_hits.append(self._hit(self.KICK, current_time, 0.6))
                # Side stick on beat 3 (quieter, brush-like)
                if beat_in_bar == 2:
                    drum_hits.append(self._hit(self.SIDE_STICK, current_time, 0.5))
            else:
                # Hi-hat every beat
                drum_hits.append(self._hit(self.HIHAT_CLOSED, current_time, 0.6))
                # Kick on 1
                if beat_in_bar == 0:
                    drum_hits.append(self._hit(self.KICK, current_time, 0.9))
                # Snare on 3
                if beat_in_bar == 2:
                    drum_hits.append(self._hit(self.SNARE, current_time, 0.85))

            current_time += seconds_per_beat
            beat_index += 1

        return drum_hits

    @staticmethod
    def _hit(pitch: int, time: float, velocity: float) -> Dict:
        return {
            "pitch": pitch,
            "time": round(time, 3),
            "velocity": round(velocity, 2),
        }