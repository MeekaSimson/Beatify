import torch
import numpy as np
from model import BeatifyChordModel

model = BeatifyChordModel()
model.load_state_dict(torch.load("chord_model.pth"))
model.eval()

# fake input = 16 bars
sample = np.random.rand(1, 16, 16)
sample = torch.tensor(sample, dtype=torch.float32)

with torch.no_grad():
    out = model(sample)
    probs = torch.softmax(out, dim=-1)
    pred = torch.multinomial(probs.view(-1, 24), 1)
    pred = pred.view(1, -1)

print("Predicted chords:", pred)