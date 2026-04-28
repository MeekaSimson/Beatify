import numpy as np

NUM_SAMPLES = 2400
SEQ_LEN = 16      # 16 bars
FEATURE_DIM = 16  # 12 pitch-class dims + 4 extra features

# Chord triad intervals
MAJOR_TRIAD = [0, 4, 7]
MINOR_TRIAD = [0, 3, 7]


def chord_histogram(root_pc, is_minor, noise_level):
    """Build a 12-dim pitch-class histogram strongly biased toward the chord's notes."""
    pch = np.full(12, noise_level / 12.0)
    triad = MINOR_TRIAD if is_minor else MAJOR_TRIAD
    for interval in triad:
        pc = (root_pc + interval) % 12
        pch[pc] += (1.0 - noise_level) / 3.0
    return pch / (pch.sum() + 1e-8)


X = []
y = []

rng = np.random.default_rng(42)

for _ in range(NUM_SAMPLES):
    sample = []
    labels = []

    for _ in range(SEQ_LEN):
        # Pick a random chord class (0-23): 0-11 = major, 12-23 = minor
        chord_class = rng.integers(0, 24)
        root_pc = chord_class % 12
        is_minor = chord_class >= 12

        noise = rng.uniform(0.1, 0.25)
        pch = chord_histogram(root_pc, is_minor, noise)

        density  = rng.random()
        avg_pitch = rng.random()
        dur_var  = rng.random()
        key_feat  = rng.integers(0, 12) / 11.0

        feature = np.concatenate([pch, [density, avg_pitch, dur_var, key_feat]])
        sample.append(feature)
        labels.append(chord_class)

    X.append(sample)
    y.append(labels)

X = np.array(X, dtype=np.float32)
y = np.array(y, dtype=np.int64)

np.savez("dataset.npz", X=X, y=y)

print("[OK] Dataset created:", X.shape, y.shape)
