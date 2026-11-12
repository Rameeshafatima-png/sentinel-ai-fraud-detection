from typing import TypedDict, Any

class InvestigationState(TypedDict, total=False):
    transaction: dict[str, Any]
    prediction: dict[str, Any]
    risk_level: str
    risk_score: int
    explanation: str
    recommended_action: str
    requires_human_review: bool
    report: str
