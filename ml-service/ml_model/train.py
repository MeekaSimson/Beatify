import torch
from torch.utils.data import DataLoader, random_split
import torch.nn as nn
import torch.optim as optim

from dataset import BeatifyDataset
from model import BeatifyChordModel

# --- Data ---
full_dataset = BeatifyDataset()
val_size = int(0.2 * len(full_dataset))
train_size = len(full_dataset) - val_size
train_set, val_set = random_split(
    full_dataset, [train_size, val_size],
    generator=torch.Generator().manual_seed(42)
)

train_loader = DataLoader(train_set, batch_size=32, shuffle=True)
val_loader   = DataLoader(val_set,   batch_size=32)

# --- Model ---
model     = BeatifyChordModel()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# --- Training loop (up to 80 epochs, early stopping patience=10) ---
EPOCHS   = 80
PATIENCE = 10

best_val_acc      = 0.0
best_epoch        = 0
patience_counter  = 0

for epoch in range(EPOCHS):
    # Train
    model.train()
    total_loss = 0.0
    for X, y in train_loader:
        optimizer.zero_grad()
        out  = model(X)                          # (B, T, 24)
        loss = criterion(out.view(-1, 24), y.view(-1))
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

    # Validate
    model.eval()
    correct = total = 0
    with torch.no_grad():
        for X, y in val_loader:
            preds    = model(X).argmax(dim=-1)   # (B, T)
            correct += (preds == y).sum().item()
            total   += y.numel()

    val_acc = correct / total * 100
    print(f"Epoch {epoch+1:3d}/{EPOCHS} | Loss: {total_loss:.4f} | Val Acc: {val_acc:.2f}%")

    if val_acc > best_val_acc:
        best_val_acc     = val_acc
        best_epoch       = epoch + 1
        patience_counter = 0
        torch.save(model.state_dict(), "chord_model.pth")
    else:
        patience_counter += 1
        if patience_counter >= PATIENCE:
            print(f"\nEarly stopping triggered at epoch {epoch+1} (no improvement for {PATIENCE} epochs)")
            break

print(f"\n[OK] Best model saved: epoch {best_epoch}, Val Acc = {best_val_acc:.2f}%")
print(f"     chord_model.pth written.")
