from __future__ import annotations
import pandas as pd

TARGET = "Class"
FEATURES = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"]

def load_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    missing = [c for c in FEATURES + [TARGET] if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    df = df[FEATURES + [TARGET]].copy()
    df = df.drop_duplicates()
    for col in FEATURES + [TARGET]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=FEATURES + [TARGET])
    df[TARGET] = df[TARGET].astype(int)
    df = df[df[TARGET].isin([0, 1])]
    if df.empty:
        raise ValueError("No valid rows remain after cleaning.")
    return df
