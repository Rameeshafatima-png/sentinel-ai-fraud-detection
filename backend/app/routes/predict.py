from uuid import uuid4
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from app.ml.preprocessing import FEATURES
from app.ml.predict import fraud_model
from app.agent.graph import run_investigation
from pathlib import Path
import pandas as pd

router = APIRouter()
CASES = []
DATASET_PATH = Path(__file__).resolve().parents[2] / "data" / "creditcard.csv"

SAMPLE_CACHE = None
class TransactionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    Time: float = Field(ge=0)
    V1: float; V2: float; V3: float; V4: float; V5: float; V6: float; V7: float
    V8: float; V9: float; V10: float; V11: float; V12: float; V13: float; V14: float
    V15: float; V16: float; V17: float; V18: float; V19: float; V20: float; V21: float
    V22: float; V23: float; V24: float; V25: float; V26: float; V27: float; V28: float
    Amount: float = Field(ge=0)

class DecisionInput(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")
    analyst: str = Field(default="Admin", min_length=1, max_length=80)
    notes: str = Field(default="", max_length=1000)

@router.post("/predict")
def predict_transaction(payload: TransactionInput):
    transaction = payload.model_dump()
    try:
        prediction = fraud_model.predict(transaction)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    investigation = run_investigation(transaction, prediction)
    case = {
        "case_id": str(uuid4())[:8],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "amount": transaction["Amount"],
        "prediction": prediction["prediction"],
        "fraud_probability": prediction["fraud_probability"],
        "risk_score": investigation["risk_score"],
        "risk_level": investigation["risk_level"],
        "recommended_action": investigation["recommended_action"],
        "requires_human_review": investigation["requires_human_review"],
        "status": "Pending Review" if investigation["requires_human_review"] else "Auto-Processed",
        "decision": None,
        "analyst": None,
        "notes": None,
        "report": investigation["report"],
        "explanation": investigation["explanation"],
        "model_mode": prediction["model_mode"],
        "llm_used": investigation.get("llm_used", False)
    }
    CASES.insert(0, case)
    return case

@router.get("/cases")
def get_cases():
    return {"cases": CASES[:100]}

@router.post("/cases/{case_id}/decision")
def decide_case(case_id: str, payload: DecisionInput):
    case = next((c for c in CASES if c["case_id"] == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case["decision"] = payload.decision
    case["analyst"] = payload.analyst
    case["notes"] = payload.notes
    case["status"] = "Approved by Analyst" if payload.decision == "approve" else "Rejected by Analyst"
    return case



@router.get("/sample")
def get_sample(kind: str = "random"):
    global SAMPLE_CACHE

    if kind not in ["random", "normal", "fraud"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid sample type"
        )

    if not DATASET_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Dataset not found: {DATASET_PATH}"
        )

    try:
        if SAMPLE_CACHE is None:
            SAMPLE_CACHE = pd.read_csv(DATASET_PATH)

        data = SAMPLE_CACHE

        if kind == "normal":
            data = data[data["Class"] == 0]

        elif kind == "fraud":
            data = data[data["Class"] == 1]

        if data.empty:
            raise HTTPException(
                status_code=404,
                detail="No transaction available for this type"
            )

        row = data.sample(1).iloc[0]

        transaction = {
            feature: float(row[feature])
            for feature in FEATURES
        }

        return {
            "transaction": transaction,
            "amount": transaction["Amount"],
            "time": transaction["Time"],
            "sample_type": kind
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )
