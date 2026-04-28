import pretty_midi
import numpy as np

def extract_features_from_midi(file):
    midi = pretty_midi.PrettyMIDI(file)

    notes = []
    for inst in midi.instruments:
        for n in inst.notes:
            notes.append(n)

    # split into 16 fake bars
    bars = np.array_split(notes, 16)

    features = []

    for bar in bars:
        pch = np.zeros(12)

        for n in bar:
            pch[n.pitch % 12] += (n.end - n.start)

        if pch.sum() > 0:
            pch /= pch.sum()

        density = len(bar) / 10.0
        avg_pitch = np.mean([n.pitch for n in bar]) / 127 if bar else 0
        dur_var = np.var([n.end - n.start for n in bar]) if len(bar) > 1 else 0
        key = 0.5

        features.append(np.concatenate([pch, [density, avg_pitch, dur_var, key]]))

    return np.array(features)