---
title: Neural Networks: From Intuition to Inference
date: 2026-03-08
tags: ML, Deep Learning, Linear Algebra
summary: A concise walkthrough of how neural nets learn patterns and where they shine.
---

# Neural Networks: From Intuition to Inference

Neural networks are function approximators built by stacking simple linear transformations with non-linear activation functions. During training, they adjust millions of tiny weights so that the composed function maps inputs to desired outputs.

## Core idea
- Each layer computes `y = f(Wx + b)`, where `f` is typically ReLU, GELU, or sigmoid.
- Stacking layers lets the model build hierarchical representations: edges → shapes → objects for vision, or characters → tokens → meaning for language.
- Learning uses **gradient descent** on a loss function (e.g., cross-entropy). Backpropagation distributes error signals to update every weight.

## Training loop (condensed)
1. Forward pass: compute predictions.
2. Loss: measure error vs. labels.
3. Backward pass: compute gradients via backprop.
4. Optimizer step: adjust parameters (SGD, Adam, etc.).
5. Repeat for many batches/epochs with regularization (dropout, weight decay) to prevent overfitting.

## When to use them
- Patterns are high-dimensional and non-linear (images, audio, text, tabular data with complex interactions).
- You can supply sufficient data and compute; small datasets often favor simpler models.

## Simple PyTorch example
```python
import torch
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(784, 256), nn.ReLU(),
    nn.Linear(256, 64), nn.ReLU(),
    nn.Linear(64, 10)
)

loss_fn = nn.CrossEntropyLoss()
optim = torch.optim.Adam(model.parameters(), lr=1e-3)

for x, y in dataloader:
    logits = model(x)
    loss = loss_fn(logits, y)
    optim.zero_grad()
    loss.backward()
    optim.step()
```

## Takeaways
- Depth + non-linearity let nets model complex functions.
- Good initialization, normalization, and learning-rate schedules stabilize training.
- Evaluation should track both accuracy and calibration to avoid overconfident mistakes.

_Updated: March 8, 2026_
