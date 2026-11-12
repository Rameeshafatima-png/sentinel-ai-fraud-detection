from __future__ import annotations
import os
from dotenv import load_dotenv
from app.agent.state import InvestigationState

load_dotenv()

def risk_node(state: InvestigationState) -> InvestigationState:
    p = float(state["prediction"]["fraud_probability"])
    score = round(p * 100)
    if p >= 0.75:
        level, action, review = "High", "Block Transaction", True
    elif p >= 0.35:
        level, action, review = "Medium", "Hold for Review", True
    else:
        level, action, review = "Low", "Approve", False
    return {"risk_score": score, "risk_level": level,
            "recommended_action": action, "requires_human_review": review}

def explanation_node(state: InvestigationState) -> InvestigationState:
    tx = state["transaction"]
    p = float(state["prediction"]["fraud_probability"])
    reasons = []
    if float(tx.get("Amount", 0)) >= 1000:
        reasons.append("The transaction amount is relatively high compared with common card purchases.")
    else:
        reasons.append("The amount alone does not indicate an unusually large purchase.")
    v = [abs(float(tx.get(f"V{i}", 0))) for i in range(1, 29)]
    if max(v, default=0) > 5:
        reasons.append("One or more anonymized PCA features have large absolute values and may represent an unusual pattern.")
    else:
        reasons.append("No extreme value was found among the anonymized PCA features using the simple review heuristic.")
    reasons.append(f"The model's estimated fraud probability is {p:.1%}.")
    return {"explanation": " ".join(reasons)}

def report_node(state: InvestigationState) -> InvestigationState:
    pred = state["prediction"]
    report = (
        "SENTINEL AI — INVESTIGATION REPORT\n\n"
        f"Prediction: {'Potential Fraud' if pred['prediction'] else 'Likely Legitimate'}\n"
        f"Risk score: {state['risk_score']}/100 ({state['risk_level']})\n"
        f"Estimated fraud probability: {pred['fraud_probability']:.2%}\n"
        f"Recommended action: {state['recommended_action']}\n"
        f"Human review required: {'Yes' if state['requires_human_review'] else 'No'}\n\n"
        f"Investigation notes: {state['explanation']}\n\n"
        "Limitations: This report is decision support, not proof of fraud. "
        "An analyst must review cases requiring escalation."
    )
    return {"report": report}

def build_graph():
    try:
        from langgraph.graph import StateGraph, END
        graph = StateGraph(InvestigationState)
        graph.add_node("risk_assessment", risk_node)
        graph.add_node("explanation", explanation_node)
        graph.add_node("report", report_node)
        graph.set_entry_point("risk_assessment")
        graph.add_edge("risk_assessment", "explanation")
        graph.add_edge("explanation", "report")
        graph.add_edge("report", END)
        return graph.compile()
    except Exception:
        return None

_workflow = build_graph()

def run_investigation(transaction: dict, prediction: dict) -> dict:
    initial = {"transaction": transaction, "prediction": prediction}
    if _workflow:
        result = _workflow.invoke(initial)
    else:
        result = {**initial, **risk_node(initial)}
        result.update(explanation_node(result))
        result.update(report_node(result))
    result["llm_used"] = False
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = (
                "Rewrite the following fraud investigation notes into a concise, "
                "professional analyst report. Do not invent facts or change the "
                "risk score, prediction, or recommended action. State uncertainty.\n\n"
                + result["report"]
            )
            response = client.models.generate_content(
                model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
                contents=prompt
            )
            if response.text:
                result["report"] = response.text
                result["llm_used"] = True
        except Exception as exc:
            result["llm_error"] = f"Gemini unavailable; local report retained ({type(exc).__name__})."
    return result
