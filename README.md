# Sentinel AI — Enterprise Fraud Detection & Investigation Agent

**Intelligent Fraud Detection. AI-Powered Investigation. Human-Controlled Decisions.**

Sentinel AI is an end-to-end fraud detection and investigation platform designed to identify suspicious credit card transactions using Machine Learning and AI-powered investigation workflows.

The application combines a machine learning prediction pipeline, FastAPI backend, LangGraph orchestration, and a React dashboard to provide transaction risk assessment, investigation reports, and human analyst review.

## Key Features

- **Machine Learning Fraud Detection:** Classifies transactions as normal or potentially fraudulent.
- **Automated Feature Extraction:** Uses transaction samples from the dataset to automatically load the 28 PCA features.
- **Risk Assessment:** Generates risk scores, risk levels, and recommended actions.
- **AI Investigation Agent:** Uses an investigation workflow to generate explanations and reports.
- **Human-in-the-Loop Review:** Allows analysts to approve or reject cases.
- **FastAPI Backend:** Provides REST API endpoints for prediction and case management.
- **Interactive Dashboard:** Displays transaction analysis, risk intelligence, workflow stages, and investigation history.

## Technology Stack

| Component | Technology |
|---|---|
| Programming Language | Python |
| Machine Learning | Scikit-learn |
| Backend API | FastAPI |
| AI Workflow | LangGraph |
| LLM Integration | Gemini / configured LLM provider |
| Frontend | React, JavaScript, CSS |
| Data Processing | Pandas, NumPy |
| Model Persistence | Joblib |
| Dataset | Kaggle Credit Card Fraud Detection |

## Application Workflow

1. Select a transaction sample type: Normal, Fraud, or Random.
2. Enter the transaction Amount and Time.
3. Sentinel AI automatically retrieves the corresponding PCA features.
4. The trained ML model predicts the transaction class and fraud probability.
5. The AI investigation workflow generates risk intelligence and a report.
6. A human analyst can review and make a case decision.
7. Investigation records appear in the dashboard.

## Dataset

This project uses the Credit Card Fraud Detection dataset.

**Dataset:** [Credit Card Fraud Detection — Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)

The dataset contains anonymized transaction features, including:

- `Time`
- `V1` to `V28` — PCA-transformed features
- `Amount`
- `Class` — target label

The `Class` column is used as the target label during model training and for selecting dataset samples. It is not sent as an input feature during prediction.

**Important:** The application uses dataset samples to retrieve the PCA features automatically. The selected sample category is not itself the model's prediction.

## Project Structure

```text
Sentinel_AI/
│
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   ├── ml/
│   │   ├── routes/
│   │   └── main.py
│   ├── data/
│   │   └── creditcard.csv
│   ├── models/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── style.css
│   ├── package.json
│   └── index.html
│
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/sentinel-ai-fraud-detection.git
cd sentinel-ai-fraud-detection
```

### 2. Backend Setup

Open a terminal inside the backend directory:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Add the Dataset

Download the Kaggle dataset and place `creditcard.csv` inside:

```text
backend/data/creditcard.csv
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and add the required API key for your configured LLM provider.

Never commit your `.env` file or API keys to GitHub.

### 5. Train the Machine Learning Model

From the backend directory:

```powershell
python -m app.ml.train
```

The trained model should be saved in the project's configured model directory.

### 6. Start the Backend

```powershell
uvicorn app.main:app --reload
```

Backend API:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 7. Start the Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local frontend URL displayed by Vite, usually:

```text
http://localhost:5173
```

Keep the backend running while using the frontend.

## API Overview

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Backend welcome/status |
| `/api/sample` | GET | Load a dataset transaction sample |
| `/api/predict` | POST | Predict and investigate a transaction |
| `/api/cases` | GET | Retrieve investigation cases |
| `/api/cases/{case_id}/decision` | POST | Submit analyst decision |
| `/docs` | GET | Interactive API documentation |

*Endpoint availability depends on the backend router configuration.*

## Security and Responsible Use

- Keep API keys in environment variables.
- Do not upload private credentials or sensitive transaction data.
- Fraud predictions are decision-support signals, not definitive proof of criminal activity.
- Human review should be used for consequential decisions.
- Model performance should be evaluated on appropriate held-out data before production use.

## Future Improvements

- Live transaction stream monitoring.
- Advanced explainability using SHAP.
- Persistent investigation history.
- Role-based analyst access.
- Advanced model performance monitoring.
- Deployment with secure production configuration.

## Author

Developed as an Enterprise AI Fraud Detection and Investigation project.

**Sentinel AI — Detect. Investigate. Protect.**