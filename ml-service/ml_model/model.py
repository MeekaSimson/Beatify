import torch
import torch.nn as nn

class BeatifyChordModel(nn.Module):
    def __init__(self, input_dim=16, hidden_dim=128, num_layers=2, num_classes=24):
        super().__init__()

        self.projection = nn.Linear(input_dim, 64)

        self.gru = nn.GRU(
            64, hidden_dim, num_layers=num_layers,
            batch_first=True, bidirectional=True
        )

        self.attn_query = nn.Linear(hidden_dim * 2, hidden_dim)
        self.attn_key = nn.Linear(hidden_dim * 2, hidden_dim)

        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim * 2, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.projection(x)
        out, _ = self.gru(x)

        Q = self.attn_query(out)
        K = self.attn_key(out)

        attn = torch.matmul(Q, K.transpose(-2, -1)) / (128 ** 0.5)
        attn = torch.softmax(attn, dim=-1)

        context = torch.matmul(attn, out)

        logits = self.classifier(context)
        return logits