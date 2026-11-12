from __future__ import annotations
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from app.ml.preprocessing import FEATURES

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "models" / "fraud_pipeline.joblib"

class FraudModel:
    def __init__(self):
        self.artifact = None
        self.load_error = None
        self.load()

    def load(self):
        if MODEL_PATH.exists():
            try:
                self.artifact = joblib.load(MODEL_PATH)
                self.load_error = None
            except Exception as exc:
                self.artifact = None
                self.load_error = str(exc)
        else:
            self.artifact = None

    @property
    def ready(self) -> bool:
        return self.artifact is not None

    def predict(self, payload: dict) -> dict:
        missing = [name for name in FEATURES if name not in payload]
        if missing:
            raise ValueError(f"Missing features: {', '.join(missing)}")
        row = pd.DataFrame([[float(payload[name]) for name in FEATURES]], columns=FEATURES)
        if self.ready:
            probability = float(self.artifact["pipeline"].predict_proba(row)[0, 1])
            threshold = float(self.artifact.get("threshold", 0.5))
            return {
                "fraud_probability": probability,
                "prediction": int(probability >= threshold),
                "threshold": threshold,
                "model_mode": "trained"
            }

        # Safe, explicit demo-only heuristic; never presented as a trained prediction.
        amount = float(payload["Amount"])
        values = np.array([float(payload[f"V{i}"]) for i in range(1, 29)])
        anomaly = min(float(np.mean(np.abs(values))) / 5.0, 1.0)
        amount_signal = min(amount / 5000.0, 1.0)
        probability = min(0.05 + 0.65 * anomaly + 0.15 * amount_signal, 0.95)
        return {
            "fraud_probability": probability,
            "prediction": int(probability >= 0.5),
            "threshold": 0.5,
            "model_mode": "demo_untrained"
        }

fraud_model = FraudModel()
