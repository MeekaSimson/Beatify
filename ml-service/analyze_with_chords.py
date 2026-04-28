"""
Enhanced Audio Analysis with Chord Generation + Bass + Drums
(BAR-ALIGNED HARMONY VERSION)

Usage:
  python analyze_with_chords.py <audio_file> [key] [scale] [--ml] [--soft] [--mix]

  --ml        Use trained Bi-GRU ML model for chord prediction (default: rule-based)
  --soft      Use softer instruments (strings, Rhodes, acoustic bass, ride drums)
  --mix       Render backing track to audio and mix with original voice → final song WAV
  --force-key Use the provided key/scale instead of auto-detecting
"""

import sys
import os
import json
import argparse
import numpy as np
from pathlib import Path
from melody_quantizer import MelodyQuantizer

from analyze_audio import analyze_audio
from chord_generator import ChordGenerator, Chord, Note
from bass_generator import BassGenerator
from drum_generator import DrumGenerator
from midi_exporter import MidiExporter


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def convert_basic_pitch_to_notes(basic_pitch_notes):
    notes = []
    for note_data in basic_pitch_notes:
        notes.append(
            Note(
                pitch=int(note_data["pitch"]),
                start_time=float(note_data["startTime"]),
                end_time=float(note_data["endTime"]),
                duration=float(note_data["duration"]),
                velocity=float(note_data["velocity"]),
            )
        )
    return notes


def _build_ml_chords(notes, bpm, key, scale, duration):
    """
    Generate chords using the trained Bi-GRU model.
    Returns a list of Chord objects (same interface as ChordGenerator).
    """
    ml_model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml_model")
    if ml_model_dir not in sys.path:
        sys.path.insert(0, ml_model_dir)

    try:
        import torch
        from model import BeatifyChordModel
    except ImportError as exc:
        raise RuntimeError(f"ML dependencies not available: {exc}") from exc

    NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    KEY_TO_NUM = {
        'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
        'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    }
    MAJOR_TRIAD = [0, 4, 7]
    MINOR_TRIAD = [0, 3, 7]

    key_offset       = KEY_TO_NUM.get(key, 0)
    seconds_per_beat = 60.0 / bpm
    bar_duration     = 4.0 * seconds_per_beat
    num_bars         = max(1, int(np.ceil(duration / bar_duration)))
    SEQ_LEN          = 16

    # Build per-bar feature vectors (same schema as g_dataset.py)
    features = []
    for bar_idx in range(SEQ_LEN):
        bar_start  = bar_idx * bar_duration
        bar_end    = bar_start + bar_duration
        bar_notes  = [n for n in notes if bar_start <= n.start_time < bar_end]

        pch = np.zeros(12, dtype=np.float32)
        if bar_notes:
            for n in bar_notes:
                pch[n.pitch % 12] += max(1, int(n.duration * 10))
            pch /= pch.sum() + 1e-8

        density   = min(len(bar_notes) / 8.0, 1.0)
        avg_pitch = float(np.clip(
            (np.mean([n.pitch for n in bar_notes]) - 60) / 24.0, 0.0, 1.0
        )) if bar_notes else 0.5
        dur_var   = float(min(
            np.std([n.duration for n in bar_notes]), 1.0
        )) if len(bar_notes) > 1 else 0.0
        key_feat  = key_offset / 11.0

        features.append(np.concatenate([pch, [density, avg_pitch, dur_var, key_feat]]))

    X = torch.tensor([features], dtype=torch.float32)  # (1, 16, 16)

    model_path = os.path.join(ml_model_dir, "chord_model.pth")
    ml_model   = BeatifyChordModel()
    try:
        ml_model.load_state_dict(torch.load(model_path, weights_only=True))
    except TypeError:
        ml_model.load_state_dict(torch.load(model_path))
    ml_model.eval()

    with torch.no_grad():
        preds = ml_model(X).argmax(dim=-1).squeeze(0).numpy()  # (16,)

    chords = []
    for bar_idx in range(min(num_bars, SEQ_LEN)):
        pred     = int(preds[bar_idx])
        root_pc  = pred % 12
        is_minor = pred >= 12
        triad    = MINOR_TRIAD if is_minor else MAJOR_TRIAD
        root_midi = 60 + root_pc

        chords.append(Chord(
            name       = NOTE_NAMES[root_pc] + ("m" if is_minor else ""),
            root       = root_midi,
            midi_notes = [root_midi + i for i in triad],
            start_time = bar_idx * bar_duration,
            duration   = bar_duration,
            confidence = 0.85,
        ))

    return chords


# ---------------------------------------------------------------------------
# Main analysis function
# ---------------------------------------------------------------------------

def analyze_audio_with_chords(audio_file, key="C", scale="major", use_ml=False, force_key=False, style="standard"):
    print(f"Analyzing audio file: {audio_file}")
    print("Running Basic-Pitch analysis...")

    result = analyze_audio(audio_file)

    if not result or not result.get("success"):
        return {"success": False, "error": result.get("error", "Analysis failed")}

    basic_pitch_analysis = result["analysis"]

    print(f"[OK] Basic-Pitch detected {len(basic_pitch_analysis['notes'])} notes")

    if force_key:
        detected_key   = key
        detected_scale = scale
        print(f"[OK] Using user-supplied key: {detected_key} {detected_scale} (override)")
    else:
        detected_key   = basic_pitch_analysis.get("key", key) or key
        detected_scale = basic_pitch_analysis.get("scale", scale) or scale
        if detected_key == "Unknown":
            detected_key = key
        print(f"[OK] Detected key: {detected_key} {detected_scale}")

    bpm      = basic_pitch_analysis.get("bpm", 120.0)
    duration = basic_pitch_analysis.get("duration", 0.0)

    raw_notes = convert_basic_pitch_to_notes(basic_pitch_analysis["notes"])

    # Chord generation — rule-based or ML
    if use_ml:
        print("Generating chords (ML Bi-GRU mode)...")
        chords       = _build_ml_chords(raw_notes, bpm, detected_key, detected_scale, duration)
        chord_method = "ml_hybrid"
    else:
        print("Generating chords (rule-based, bar-aligned)...")
        chord_generator = ChordGenerator(key=detected_key, scale=detected_scale)
        chords          = chord_generator.generate_chords(
            raw_notes, bpm=bpm, beats_per_bar=4, total_duration=duration
        )
        chord_method = "rule_based"

    chord_generator_for_dict = ChordGenerator(key=detected_key, scale=detected_scale)
    chords_dict = chord_generator_for_dict.chords_to_dict(chords)
    print(f"[OK] Generated {len(chords_dict)} chords (method: {chord_method})")

    # Bass
    print("Generating bass line...")
    bass_generator = BassGenerator()
    bass_notes     = bass_generator.generate_bass_line(chords, style="root")
    print(f"[OK] Generated {len(bass_notes)} bass notes")

    # Drums
    print("Generating drum pattern...")
    drum_generator = DrumGenerator()
    drum_pattern   = drum_generator.generate_pattern(
        bpm=bpm, duration=duration, start_offset=0.0, style=style
    )
    print(f"[OK] Generated {len(drum_pattern)} drum hits")

    # MIDI export — backing only (no melody piano; voice stays as original audio)
    print("Exporting backing MIDI...")
    midi_exporter = MidiExporter(bpm=bpm, style=style)
    midi_exporter.add_chords(chords_dict)
    midi_exporter.add_bass(bass_notes)
    midi_exporter.add_drums(drum_pattern)

    stem             = Path(audio_file).stem
    midi_output_path = stem + "_arrangement.mid"
    midi_exporter.write(midi_output_path)
    print(f"[OK] Backing MIDI exported: {midi_output_path}")

    enhanced_analysis = {
        "success": True,
        "analysis": {
            "notes":       basic_pitch_analysis["notes"],
            "noteCount":   basic_pitch_analysis["noteCount"],
            "key":         detected_key,
            "scale":       detected_scale,
            "bpm":         bpm,
            "duration":    duration,
            "chords":      chords_dict,
            "chordCount":  len(chords_dict),
            "chordMethod": chord_method,
            "bassNotes":   bass_notes,
            "drumPattern": drum_pattern,
            "midiPath":    midi_output_path,
        },
    }

    return enhanced_analysis


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Beatify — audio analysis with chord/bass/drum generation"
    )
    parser.add_argument("audio_file",           help="Path to input audio file")
    parser.add_argument("key",   nargs="?", default="C",     help="Key (default: C)")
    parser.add_argument("scale", nargs="?", default="major", help="Scale (default: major)")
    parser.add_argument("--ml",        action="store_true",
                        help="Use trained ML model instead of rule-based chord generation")
    parser.add_argument("--force-key", action="store_true",
                        help="Use the provided key/scale instead of auto-detecting from audio")
    parser.add_argument("--soft",      action="store_true",
                        help="Use softer instruments: Rhodes, strings, acoustic bass, ride drums")
    parser.add_argument("--mix",       action="store_true",
                        help="Render backing to audio and mix with original voice → final song WAV")
    args = parser.parse_args()

    style  = "soft" if args.soft else "standard"
    result = analyze_audio_with_chords(
        args.audio_file, args.key, args.scale, use_ml=args.ml, force_key=args.force_key, style=style
    )

    if not result.get("success"):
        print(f"[ERR] Analysis failed: {result.get('error')}")
        sys.exit(1)

    output_file = Path(args.audio_file).stem + "_analysis.json"
    with open(output_file, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\n[OK] Analysis saved to: {output_file}")
    print(f"   chordMethod: {result['analysis']['chordMethod']}")
    print(f"   Backing MIDI: {result['analysis']['midiPath']}")

    if args.mix:
        from audio_renderer import render_midi_to_wav, mix_voice_with_backing, check_fluidsynth

        stem       = Path(args.audio_file).stem
        midi_path  = result["analysis"]["midiPath"]
        backing_wav = stem + "_backing.wav"
        song_wav    = stem + "_song.wav"

        print("\n[1/2] Rendering backing MIDI to audio...")
        try:
            render_midi_to_wav(midi_path, backing_wav)
            print(f"[OK]  Backing audio: {backing_wav}")
        except RuntimeError as e:
            print(f"[ERR] {e}")
            sys.exit(1)

        print("[2/2] Mixing voice + backing...")
        mix_voice_with_backing(args.audio_file, backing_wav, song_wav)
        print(f"[OK]  Final song:    {song_wav}")
        print("\n✅  Open", song_wav, "to hear your voice with full accompaniment.")


if __name__ == "__main__":
    main()
