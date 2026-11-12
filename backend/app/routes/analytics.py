from fastapi import APIRouter
from app.routes.predict import CASES

router = APIRouter()

@router.get("/analytics")
def analytics():
    total = len(CASES)
    fraud = sum(1 for c in CASES if c["prediction"] == 1)
    high = sum(1 for c in CASES if c["risk_level"] == "High")
    pending = sum(1 for c in CASES if c["status"] == "Pending Review")
    avg_risk = round(sum(c["risk_score"] for c in CASES) / total, 1) if total else 0
    return {
        "total_transactions": total,
        "fraud_detected": fraud,
        "fraud_rate_percent": round(fraud / total * 100, 1) if total else 0,
        "high_risk_cases": high,
        "pending_reviews": pending,
        "average_risk_score": avg_risk,
        "recent_cases": CASES[:8]
    }
