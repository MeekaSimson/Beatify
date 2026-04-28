# Beatify — Voice to Song Generator

Beatify takes a voice recording as input and produces a complete song — your voice as the melody, accompanied by generated chords, bass, and drums.

---

## How It Works

```
Voice Input (.mp3 / .wav / .m4a)
        │
        ▼
  Audio Analysis
  ├── Pitch detection     (Basic-Pitch by Spotify)
  ├── Key & scale         (Krumhansl-Schmuckler algorithm)
  └── Tempo / BPM         (Librosa beat tracking)
        │
        ▼
  Chord Generation        (Rule-based, bar-aligned)
  ├── Diatonic chord fitting per bar
  ├── Bass line generation
  └── Drum pattern generation
        │
        ▼
  MIDI Export             (pretty_midi)
  ├── Chords track
  ├── Bass track
  └── Drums track
        │
        ▼
  Audio Mix               (librosa + soundfile)
  └── Voice + Backing → Final Song (.wav)
```

---

## Project Structure

```
Beatify/
├── ml-service/                  # Core Python pipeline
│   ├── analyze_audio.py         # Pitch, key, tempo detection
│   ├── chord_generator.py       # Rule-based chord generation
│   ├── bass_generator.py        # Bass line from chord progression
│   ├── drum_generator.py        # Drum pattern generation
│   ├── midi_exporter.py         # Multi-track MIDI export
│   ├── melody_quantizer.py      # Quantize detected notes to grid
│   ├── audio_renderer.py        # Render MIDI to audio + mix with voice
│   ├── analyze_with_chords.py   # Main pipeline entry point
│   ├── smart_analysis.py        # Key validation with chord scoring
│   ├── demo.py                  # Demo runner
│   ├── ml_model/
│   │   ├── model.py             # Bi-GRU + Attention chord model
│   │   ├── train.py             # Model training script
│   │   ├── inference.py         # ML-based chord inference
│   │   ├── dataset.py           # Dataset loader
│   │   └── evaluate.py          # Model evaluation
│   └── requirements.txt
├── FrontEnd/                    # Next.js 14 web app
├── backend/                     # Node.js + Express API
└── README.md
```

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Homebrew (macOS)

---

### 1. ML Service

```bash
cd ml-service

# Create and activate virtual environment
python3.11 -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt
pip install pretty_midi
```

`requirements.txt` includes:
```
numpy==1.24.3
scipy==1.11.4
scikit-learn==1.3.2
tensorflow==2.13.1
librosa==0.10.1
soundfile==0.12.1
basic-pitch==0.3.3
```

---

### 2. Audio Rendering (optional — needed for final song WAV output)

```bash
# Install fluidsynth
brew install fluid-synth

# Download GeneralUser GS soundfont (~30MB) from:
# https://schristiancollins.com/generaluser.php
# Place the .sf2 file in ml-service/ as GeneralUser.sf2
```

---

### 3. Frontend

```bash
cd FrontEnd
npm install
npm run dev
```

Visit `http://localhost:3000`

---

### 4. Backend

```bash
cd backend
npm install
node server.js
```

Runs on `http://localhost:5000`

---

## Running the Pipeline

### Basic analysis — key, BPM, chords, MIDI export

```bash
cd ml-service
source venv/bin/activate
python analyze_with_chords.py <audio_file>
```

Outputs:
- `<name>_analysis.json` — detected key, BPM, notes, chord progression
- `<name>_arrangement.mid` — backing MIDI (chords + bass + drums)

---

### With known key (recommended)

When a melody uses only a few notes, auto key detection can be uncertain. Use `--force-key` to supply the key directly:

```bash
python analyze_with_chords.py song.mp3 A minor --force-key
python analyze_with_chords.py song.mp3 G major --force-key
```

---

### Full song output — voice + backing mixed

```bash
python analyze_with_chords.py song.mp3 G major --force-key --mix
```

Outputs:
- `<name>_backing.wav` — rendered backing track audio
- `<name>_song.wav` — your voice mixed with the full arrangement

---

### Soft instrument preset

```bash
python analyze_with_chords.py song.mp3 --soft --mix
```

| Track   | Standard           | Soft                      |
|---------|--------------------|---------------------------|
| Chords  | Grand Piano        | String Ensemble           |
| Bass    | Electric Bass      | Acoustic Bass             |
| Drums   | Hi-hat + Snare     | Ride cymbal + Side stick  |

---

### ML chord generation (experimental)

```bash
python analyze_with_chords.py song.mp3 --ml
```

Uses the trained Bi-GRU model (`ml_model/chord_model.pth`) instead of the rule-based generator.

---

### Demo runner

```bash
python demo.py demo/inputs/song.mp3
```

Runs the full live analysis and saves the timestamped output to `ml-service/generated/`.

---

## Chord Generation — Rule-Based

The rule-based generator works in four steps:

1. **Detect notes per bar** — group melody notes into bars based on BPM
2. **Build pitch class set** — collect which pitch classes (C, D, E...) appear in each bar
3. **Score candidate chords** — for each diatonic chord in the key, count overlap with melody notes
4. **Pick the best fit** — highest overlap score wins

Supports all 12 major and minor keys. Use `--force-key` to bypass auto-detection.

---

## ML Model — Bi-GRU Chord Predictor

The ML model takes 16-bar sequences of melody features and predicts a chord label per bar.

**Architecture:**
- Input: `(batch, 16, 16)` — pitch class histogram + note density + avg pitch + key offset
- Projection: Linear(16 → 64)
- Bi-GRU: 2 layers, hidden size 128, bidirectional
- Self-attention: query/key projections over GRU output
- Classifier: Linear → ReLU → Dropout(0.3) → Linear(24 classes)
- Output: 24 chord classes (12 major + 12 minor)

**Train the model:**
```bash
cd ml-service/ml_model
python train.py
```

---

## API Output Format

```json
{
  "success": true,
  "analysis": {
    "notes": [
      {
        "pitch": 69,
        "startTime": 0.5,
        "endTime": 1.0,
        "duration": 0.5,
        "velocity": 0.8
      }
    ],
    "noteCount": 47,
    "key": "G",
    "scale": "major",
    "keyConfidence": 0.85,
    "bpm": 120.5,
    "tempoConfidence": 0.92,
    "duration": 21.8,
    "chords": [
      {
        "name": "G",
        "root": 67,
        "midi_notes": [67, 71, 74],
        "start_time": 0.0,
        "duration": 1.39,
        "confidence": 1.0
      }
    ],
    "chordCount": 16,
    "chordMethod": "rule_based"
  }
}
```

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'basic_pitch'`**
```bash
pip install -r requirements.txt
```

**`UnicodeEncodeError` when writing MIDI**
Ensure track names contain only ASCII characters. This is handled automatically in the current version.

**Backing audio is silent**
A valid General MIDI soundfont (`.sf2`) is required. Place `GeneralUser.sf2` in `ml-service/` and install fluidsynth via `brew install fluid-synth`.

**Key detection seems wrong**
Use `--force-key` with the known key. Auto-detection works best when the melody covers 5+ distinct notes. Melodies using only 3–4 notes produce ambiguous pitch class histograms.

**numpy version conflict**
```bash
pip install numpy==1.24.3
```

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS |
| Backend     | Node.js 18, Express                 |
| ML Service  | Python 3.11, TensorFlow, PyTorch    |
| Pitch AI    | Basic-Pitch (Spotify)               |
| Audio       | Librosa, soundfile, NumPy           |
| MIDI        | pretty_midi, mido                   |

---

## Team

Final Year Project — Computer Science & Engineering, 2024–2025

- **Musician + ML Lead** — Audio analysis, music theory, chord generation
- **Full-Stack Dev** — Frontend, backend API, integration
- **Project Manager** — Testing, documentation, presentation
