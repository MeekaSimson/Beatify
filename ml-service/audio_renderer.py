"""
Renders accompaniment MIDI to audio and mixes with the original voice.

Requirements:
  - fluidsynth installed:  brew install fluid-synth
  - A soundfont (.sf2):    place GeneralUser.sf2 in the ml-service folder
                           or set BEATIFY_SOUNDFONT env var to its path
"""

import os
import subprocess
import numpy as np
import soundfile as sf
import librosa

# Soundfont search order:
#   1. BEATIFY_SOUNDFONT env var
#   2. GeneralUser.sf2 next to this file (downloaded by user)
#   3. VintageDreamsWaves bundled with fluidsynth (fallback — FM sounds)
def _find_soundfont() -> str:
    if "BEATIFY_SOUNDFONT" in os.environ:
        return os.environ["BEATIFY_SOUNDFONT"]

    local = os.path.join(os.path.dirname(os.path.abspath(__file__)), "GeneralUser.sf2")
    if os.path.exists(local) and os.path.getsize(local) > 1_000_000:
        return local

    # Homebrew bundled soundfont
    import glob
    patterns = [
        "/opt/homebrew/Cellar/fluid-synth/*/share/fluid-synth/sf2/VintageDreamsWaves-v2.sf2",
        "/usr/local/Cellar/fluid-synth/*/share/fluid-synth/sf2/VintageDreamsWaves-v2.sf2",
        "/usr/share/sounds/sf2/*.sf2",
    ]
    for pattern in patterns:
        matches = glob.glob(pattern)
        if matches:
            return matches[0]

    return local  # let the error message handle the missing file case

SOUNDFONT_PATH = _find_soundfont()

TARGET_SR = 44100


def check_fluidsynth():
    """Returns True if fluidsynth binary is available."""
    try:
        subprocess.run(["fluidsynth", "--version"], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def render_midi_to_wav(midi_path: str, wav_path: str, soundfont: str = None, gain: float = 0.8) -> str:
    """
    Renders a MIDI file to WAV using fluidsynth.

    Args:
        midi_path:  Path to input .mid file
        wav_path:   Path for output .wav file
        soundfont:  Path to .sf2 soundfont (uses default if None)
        gain:       Fluidsynth output gain (0.0–5.0)

    Returns:
        wav_path on success.
    Raises:
        RuntimeError if fluidsynth is missing or the soundfont is not found.
    """
    sf2 = soundfont or SOUNDFONT_PATH

    if not check_fluidsynth():
        raise RuntimeError(
            "fluidsynth not found. Install it with: brew install fluid-synth"
        )
    if not os.path.exists(sf2):
        raise RuntimeError(
            f"Soundfont not found at: {sf2}\n"
            "Download GeneralUser GS and place it as ml-service/GeneralUser.sf2\n"
            "Or set the BEATIFY_SOUNDFONT environment variable to the .sf2 path."
        )

    cmd = [
        "fluidsynth",
        "-ni",           # non-interactive
        "-g", str(gain),
        "-F", wav_path,
        "-r", str(TARGET_SR),
        sf2,
        midi_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"fluidsynth failed:\n{result.stderr}")

    return wav_path


def mix_voice_with_backing(
    voice_path: str,
    backing_wav_path: str,
    output_path: str,
    voice_gain: float = 1.0,
    backing_gain: float = 0.65,
) -> str:
    """
    Mixes the original voice audio with the rendered backing track.

    The backing track is padded or trimmed to match the voice length.
    Output is normalized to prevent clipping.

    Args:
        voice_path:       Original voice audio file (.mp3 / .wav / etc.)
        backing_wav_path: Rendered backing track WAV
        output_path:      Output .wav path
        voice_gain:       Volume multiplier for voice (default 1.0)
        backing_gain:     Volume multiplier for backing (default 0.65 — sits behind voice)

    Returns:
        output_path on success.
    """
    voice,   sr = librosa.load(voice_path,       sr=TARGET_SR, mono=False)
    backing, _  = librosa.load(backing_wav_path, sr=TARGET_SR, mono=False)

    # Ensure both are 2D stereo (channels × samples)
    if voice.ndim == 1:
        voice = np.stack([voice, voice])
    if backing.ndim == 1:
        backing = np.stack([backing, backing])

    # Pad the shorter one to the length of the voice
    voice_len   = voice.shape[1]
    backing_len = backing.shape[1]

    if backing_len < voice_len:
        # Loop backing if it's shorter than the voice
        repeats = int(np.ceil(voice_len / backing_len))
        backing = np.tile(backing, (1, repeats))

    backing = backing[:, :voice_len]

    # Mix
    mixed = voice * voice_gain + backing * backing_gain

    # Normalize to prevent clipping
    peak = np.max(np.abs(mixed))
    if peak > 1.0:
        mixed = mixed / peak * 0.95

    # soundfile expects (samples × channels)
    sf.write(output_path, mixed.T, TARGET_SR)
    return output_path
