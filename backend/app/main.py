from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from app.routes import predict, analytics
from app.ml.predict import fraud_model
import os

app = FastAPI(
    title="Sentinel AI Fraud Detection API",
    description="ML-powered transaction risk scoring and AI-assisted investigation.",
    version="1.0.0"
)
origins = [os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins + ["http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.include_router(predict.router, prefix="/api", tags=["Fraud Detection"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])

@app.get("/")
def root():
    return {"name": "Sentinel AI", "docs": "/docs", "status": "running"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_ready": fraud_model.ready,
        "model_mode": "trained" if fraud_model.ready else "demo_untrained"
    }
