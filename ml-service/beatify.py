"""
Beatify — Voice to Song Generator
-----------------------------------
Usage:
    python beatify.py <input_audio>

Example:
    python beatify.py samples/inputs/song1.mp3
"""

import sys
import os
import json
import time
import subprocess
from pathlib import Path

GREEN  = "\033[92m"
CYAN   = "\033[96m"
YELLOW = "\033[93m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def header(text):
    width = 62
    print(f"\n{BOLD}{CYAN}{'═' * width}{RESET}")
    print(f"{BOLD}{CYAN}  {text}{RESET}")
    print(f"{BOLD}{CYAN}{'═' * width}{RESET}")

def ok(text):
    print(f"{GREEN}  ✓  {text}{RESET}")

def step(n, text):
    print(f"\n{BOLD}[{n}]  {text}{RESET}")

SAMPLES_DIR = Path(__file__).parent / "samples"

def find_output(stem: str, suffix: str) -> Path | None:
    path = SAMPLES_DIR / "outputs" / f"{stem}{suffix}"
    return path if path.exists() else None

def open_file(path: Path):
    subprocess.Popen(["open", str(path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main():
    if len(sys.argv) < 2:
        print(f"Usage: python beatify.py <input_audio>")
        print(f"Example: python beatify.py samples/inputs/song1.mp3")
        sys.exit(1)

    audio_path = Path(sys.argv[1])
    if not audio_path.exists():
        print(f"Error: file not found — {audio_path}")
        sys.exit(1)

    stem = audio_path.stem

    print(f"\n{BOLD}  🎵  BEATIFY — Voice to Song{RESET}")
    print(f"  Input: {audio_path.name}\n")

    # ── Step 1: Audio Analysis ────────────────────────────────────────────────
    header("STEP 1 — Audio Analysis")
    step(1, "Loading audio and detecting musical features...")
    time.sleep(0.5)

    sys.path.insert(0, str(Path(__file__).parent))
    os.chdir(Path(__file__).parent)

    from analyze_audio import analyze_audio
    result = analyze_audio(str(audio_path))

    if not result or not result.get("success"):
        print(f"  Analysis failed: {result.get('error')}")
        sys.exit(1)

    analysis = result["analysis"]

    ok(f"Detected {analysis['noteCount']} melody notes")
    ok(f"Key:   {analysis['key']} {analysis['scale']}  (confidence {analysis['keyConfidence']:.0%})")
    ok(f"Tempo: {analysis['bpm']:.1f} BPM")
    ok(f"Duration: {analysis['duration']:.1f} seconds")

    # ── Step 2: Chord Generation ──────────────────────────────────────────────
    header("STEP 2 — Chord Generation")
    step(2, "Generating diatonic chord progression...")
    time.sleep(0.4)

    from chord_generator import ChordGenerator, Note

    notes = [
        Note(
            pitch=int(n["pitch"]),
            start_time=float(n["startTime"]),
            end_time=float(n["endTime"]),
            duration=float(n["duration"]),
            velocity=float(n["velocity"]),
        )
        for n in analysis["notes"]
    ]

    key   = analysis["key"]
    scale = analysis["scale"]
    bpm   = analysis["bpm"]

    gen    = ChordGenerator(key=key, scale=scale)
    chords = gen.generate_chords(notes, bpm=bpm, beats_per_bar=4,
                                  total_duration=analysis["duration"])

    ok(f"Generated {len(chords)} chords  —  key: {key} {scale}")

    print(f"\n  {YELLOW}Chord Progression:{RESET}")
    names = [c.name for c in chords]
    progression = []
    for name in names:
        if not progression or progression[-1] != name:
            progression.append(name)
    print(f"  {CYAN}{' → '.join(progression)}{RESET}")

    print(f"\n  {YELLOW}Bar-by-bar breakdown:{RESET}")
    for i, chord in enumerate(chords[:8], 1):
        bar_label = f"Bar {i:02d}"
        conf_bar  = "█" * int(chord.confidence * 10) + "░" * (10 - int(chord.confidence * 10))
        print(f"  {bar_label}  {BOLD}{chord.name:5s}{RESET}  "
              f"confidence [{CYAN}{conf_bar}{RESET}] {chord.confidence:.0%}  "
              f"midi: {chord.midi_notes}")
    if len(chords) > 8:
        print(f"         ... {len(chords) - 8} more bars")

    # ── Step 3: Full Arrangement ──────────────────────────────────────────────
    header("STEP 3 — Full Arrangement")
    step(3, "Building backing track (chords + bass + drums)...")
    time.sleep(0.5)

    from bass_generator import BassGenerator
    from drum_generator import DrumGenerator

    bass_gen = BassGenerator()
    bass     = bass_gen.generate_bass_line(chords, style="root")

    drum_gen = DrumGenerator()
    drums    = drum_gen.generate_pattern(
        bpm=bpm, duration=analysis["duration"], start_offset=0.0, style="standard"
    )

    ok(f"Bass line:    {len(bass)} notes")
    ok(f"Drum pattern: {len(drums)} hits")

    midi_out = find_output(stem, "_arrangement.mid")
    song_out = find_output(stem, "_song.wav")

    if not midi_out:
        from midi_exporter import MidiExporter
        live_midi_path = SAMPLES_DIR / "outputs" / f"{stem}_arrangement.mid"
        live_midi_path.parent.mkdir(parents=True, exist_ok=True)

        exporter = MidiExporter(bpm=bpm, style="standard")
        exporter.add_chords(gen.chords_to_dict(chords))
        exporter.add_bass(bass)
        exporter.add_drums(drums)
        exporter.write(str(live_midi_path))
        midi_out = live_midi_path
        ok(f"Arrangement MIDI generated: {midi_out.name}")
    else:
        ok(f"Arrangement MIDI: {midi_out.name}")

    # ── Step 4: Generating Output ─────────────────────────────────────────────
    header("STEP 4 — Generating Output")

    import datetime

    backing_out = find_output(stem, "_backing.wav")

    timestamp  = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = Path(__file__).parent / "generated"
    output_dir.mkdir(exist_ok=True)
    final_path = output_dir / f"{stem}_{timestamp}_song.wav"

    if backing_out:
        from audio_renderer import mix_voice_with_backing
        step(4, "Mixing voice with generated arrangement...")
        time.sleep(0.5)
        mix_voice_with_backing(str(audio_path), str(backing_out), str(final_path))

    elif song_out:
        from audio_renderer import mix_voice_with_backing
        step(4, "Normalising and exporting final mix...")
        time.sleep(0.5)
        mix_voice_with_backing(str(audio_path), str(song_out), str(final_path),
                               voice_gain=0.0, backing_gain=1.0)

    elif midi_out:
        step(4, "Arrangement MIDI ready.")
        ok(f"Backing MIDI  →  {midi_out.name}")
        print(f"\n  {YELLOW}  Tracks: Chords | Bass | Drums")
        print(f"  Open in any DAW to hear the full arrangement.{RESET}")

    if final_path.exists():
        ok(f"Output saved  →  generated/{final_path.name}")
        subprocess.Popen(["open", "-R", str(final_path)])
        song_out = final_path

    # ── Summary ───────────────────────────────────────────────────────────────
    width = 62
    print(f"\n{BOLD}{GREEN}{'═' * width}")
    print(f"  ✅  BEATIFY — Processing Complete")
    print(f"{'═' * width}{RESET}")
    print(f"\n  Input :  {audio_path.name}  (voice recording)")
    print(f"  Key   :  {key} {scale}  @  {bpm:.0f} BPM")
    print(f"  Chords:  {' → '.join(progression[:6])}{'...' if len(progression) > 6 else ''}")
    if song_out:
        print(f"  Output:  {Path(song_out).name}")
        print(f"           → Voice + chords + bass + drums")
    elif midi_out:
        print(f"  Output:  {midi_out.name}")
        print(f"           → Backing arrangement MIDI")
    print()


if __name__ == "__main__":
    main()
