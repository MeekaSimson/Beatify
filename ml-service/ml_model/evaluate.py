"""
Evaluate the trained Bi-GRU chord model against a rule-based baseline.
Outputs evaluation_results.json.
"""

import json
import numpy as np
import torch

from model import BeatifyChordModel

MAJOR_TRIAD = [0, 4, 7]
MINOR_TRIAD = [0, 3, 7]


def rule_based_predict(x_bar):
    """
    Full triad-matching rule-based predictor.
    For each of 24 possible chords, compute the sum of pitch-class weights
    that overlap with the triad, then return the highest-scoring chord class.
    """
    pch = x_bar[:12]
    best_score = -1
    best_class = 0

    for root in range(12):
        for is_minor, triad in enumerate([MAJOR_TRIAD, MINOR_TRIAD]):
            score = sum(float(pch[(root + i) % 12]) for i in triad)
            chord_class = 12 * is_minor + root
            if score > best_score:
                best_score = score
                best_class = chord_class

    return best_class


# --- Load dataset ---
data  = np.load("dataset.npz")
X_all = data["X"]   # (N, 16, 16)
y_all = data["y"]   # (N, 16)

# Use the last 20 % as held-out test set
split      = int(0.8 * len(X_all))
X_test     = X_all[split:]
y_test     = y_all[split:]

total_bars = y_test.size
print(f"Test set: {X_test.shape[0]} samples, {total_bars} bars")

# --- ML model predictions ---
model = BeatifyChordModel()
try:
    model.load_state_dict(torch.load("chord_model.pth", weights_only=True))
except TypeError:
    model.load_state_dict(torch.load("chord_model.pth"))
model.eval()

X_tensor = torch.tensor(X_test, dtype=torch.float32)
with torch.no_grad():
    ml_preds = model(X_tensor).argmax(dim=-1).numpy()   # (N_test, 16)

ml_correct  = int((ml_preds == y_test).sum())
ml_accuracy = ml_correct / total_bars * 100

# --- Rule-based baseline predictions ---
rule_preds = np.array([
    [rule_based_predict(x_bar) for x_bar in sample]
    for sample in X_test
])

rule_correct  = int((rule_preds == y_test).sum())
rule_accuracy = rule_correct / total_bars * 100

# --- Report ---
results = {
    "test_samples":          int(X_test.shape[0]),
    "test_bars":             int(total_bars),
    "ml_accuracy_pct":       round(ml_accuracy,   2),
    "rule_based_accuracy_pct": round(rule_accuracy, 2),
    "ml_correct_bars":       ml_correct,
    "rule_correct_bars":     rule_correct,
}

with open("evaluation_results.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"\n[OK] Evaluation results:")
print(f"   ML model accuracy    : {ml_accuracy:.2f}%")
print(f"   Rule-based accuracy  : {rule_accuracy:.2f}%")
print(f"   Saved: evaluation_results.json")
