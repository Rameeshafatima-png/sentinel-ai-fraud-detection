from __future__ import annotations
import json
from pathlib import Path
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (classification_report, confusion_matrix,
                             roc_auc_score, average_precision_score)
from app.ml.preprocessing import FEATURES, TARGET, load_dataset

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_PATH = BASE_DIR / "data" / "creditcard.csv"
MODEL_DIR = BASE_DIR / "models"
REPORT_DIR = BASE_DIR / "reports"

def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}\nDownload creditcard.csv from "
            "https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud and place it in backend/data/"
        )
    MODEL_DIR.mkdir(exist_ok=True)
    REPORT_DIR.mkdir(exist_ok=True)
    df = load_dataset(str(DATA_PATH))
    X, y = df[FEATURES], df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    preprocessor = ColumnTransformer(
        transformers=[("scale_time_amount", StandardScaler(), ["Time", "Amount"])],
        remainder="passthrough"
    )
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(
            class_weight="balanced", max_iter=1500, solver="lbfgs", random_state=42
        ))
    ])
    pipeline.fit(X_train, y_train)
    probabilities = pipeline.predict_proba(X_test)[:, 1]
    threshold = 0.5
    predictions = (probabilities >= threshold).astype(int)
    metrics = {
        "rows_after_cleaning": int(len(df)),
        "fraud_rows": int(y.sum()),
        "legitimate_rows": int((y == 0).sum()),
        "fraud_rate_percent": round(float(y.mean() * 100), 4),
        "threshold": threshold,
        "roc_auc": float(roc_auc_score(y_test, probabilities)),
        "average_precision_pr_auc": float(average_precision_score(y_test, probabilities)),
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        "classification_report": classification_report(
            y_test, predictions, output_dict=True, zero_division=0
        )
    }
    joblib.dump({"pipeline": pipeline, "features": FEATURES, "threshold": threshold},
                MODEL_DIR / "fraud_pipeline.joblib")
    (REPORT_DIR / "training_metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps({k: v for k, v in metrics.items()
                      if k != "classification_report"}, indent=2))
    print(f"\nSaved model: {MODEL_DIR / 'fraud_pipeline.joblib'}")
    print(f"Saved metrics: {REPORT_DIR / 'training_metrics.json'}")

if __name__ == "__main__":
    main()
