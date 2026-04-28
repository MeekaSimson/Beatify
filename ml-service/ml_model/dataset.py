import numpy as np
import torch
from torch.utils.data import Dataset

class BeatifyDataset(Dataset):
    def __init__(self, path="dataset.npz"):
        data = np.load(path)
        self.X = data["X"]
        self.y = data["y"]

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return (
            torch.tensor(self.X[idx], dtype=torch.float32),
            torch.tensor(self.y[idx], dtype=torch.long)
        )