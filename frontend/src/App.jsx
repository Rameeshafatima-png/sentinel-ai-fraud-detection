
import React, { useEffect, useState } from "react";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const workflow = [
  ["01", "Transaction Input", "Input validation"],
  ["02", "ML Detection", "Fraud classification"],
  ["03", "AI Investigation", "Risk assessment"],
  ["04", "Analyst Review", "Human decision"],
  ["05", "Case Report", "Final documentation"],
];

export default function App() {
  const [amount, setAmount] = useState("2500");
  const [time, setTime] = useState("12000");
  const [sampleType, setSampleType] = useState("normal");

  const [transaction, setTransaction] = useState(null);
  const [result, setResult] = useState(null);
  const [cases, setCases] = useState([]);

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [analyst, setAnalyst] = useState("Admin");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("report");

  async function loadCases() {
    try {
      const res = await fetch(`${API}/api/cases`);
      const data = await res.json();
      if (res.ok) setCases(data.cases || []);
    } catch (e) {
      console.error("Cases:", e);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  async function loadSample() {
    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);

    try {
      const res = await fetch(`${API}/api/sample?kind=${sampleType}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Sample could not load");
      if (!data.transaction) throw new Error("Transaction data missing");

      setTransaction(data.transaction);
      setAmount(String(data.transaction.Amount));
      setTime(String(data.transaction.Time));
      setNotice(`${sampleType.toUpperCase()} dataset sample loaded successfully.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setError("");
    setNotice("");
    setResult(null);

    if (amount === "" || time === "" || Number(amount) < 0 || Number(time) < 0) {
      setError("Enter a valid transaction amount and time.");
      return;
    }

    setAnalyzing(true);

    try {
      let features = transaction;

      if (!features) {
        const sampleRes = await fetch(`${API}/api/sample?kind=${sampleType}`);
        const sampleData = await sampleRes.json();

        if (!sampleRes.ok) {
          throw new Error(sampleData.detail || "Unable to load PCA features");
        }

        features = sampleData.transaction;
        setTransaction(features);
      }

      const payload = {
        ...features,
        Amount: Number(amount),
        Time: Number(time),
      };

      const res = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Prediction failed");

      setResult(data);
      setActiveTab("report");
      setNotice("Transaction assessment completed.");
      await loadCases();
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function decideCase(decision) {
    if (!result?.case_id) return;

    setError("");
    setNotice("");

    try {
      const res = await fetch(
        `${API}/api/cases/${result.case_id}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, analyst, notes }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Decision failed");

      setResult(data);
      setNotice(`Case ${decision}d successfully.`);
      await loadCases();
    } catch (e) {
      setError(e.message);
    }
  }

  function resetForm() {
    setAmount("");
    setTime("");
    setTransaction(null);
    setResult(null);
    setError("");
    setNotice("");
    setNotes("");
  }

  const fraudCount = cases.filter(c => Number(c.prediction) === 1).length;
  const pendingCount = cases.filter(c => c.status === "Pending Review").length;
  const approvedCount = cases.filter(c => c.decision === "approve").length;

  const risk = Number(result?.risk_score || 0);
  const probability = Number(result?.fraud_probability || 0);
  const probabilityPercent = probability <= 1 ? probability * 100 : probability;
  const isFraud = Number(result?.prediction) === 1;

  return (
    <div className="sentinel-app">
      <header className="top-nav">
        <a className="logo" href="#home">
          <span className="logo-symbol">S</span>
          <span>Sentinel<span className="logo-accent">AI</span></span>
        </a>

        <nav>
          <a className="nav-active" href="#home">Dashboard</a>
          <a href="#workflow">AI Workflow</a>
          <a href="#analysis">Analysis</a>
          <a href="#cases">Investigations</a>
        </nav>

        <div className="system-pill">
          <span className="pulse-dot"></span>
          SYSTEM ONLINE
        </div>
      </header>

      <main className="dashboard" id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-tag">
              <span className="pulse-dot"></span>
              ENTERPRISE FRAUD INTELLIGENCE PLATFORM
            </div>

            <h1>
              Detect threats.<br />
              <span>Investigate smarter.</span>
            </h1>

            <p>
              An intelligent fraud detection and investigation system powered
              by Machine Learning, LangGraph and AI-driven risk analysis.
            </p>

            <div className="tech-tags">
              <span>Python</span>
              <span>FastAPI</span>
              <span>Machine Learning</span>
              <span>LangGraph</span>
              <span>LLM Intelligence</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="orbital orbital-one"></div>
            <div className="orbital orbital-two"></div>
            <div className="orbital orbital-three"></div>
            <div className="core-shield">
              <span>✦</span>
            </div>
            <div className="floating-label label-top">
              <span className="pulse-dot"></span> REAL-TIME MONITORING
            </div>
            <div className="floating-label label-bottom">
              <strong>AI</strong> Threat Intelligence
            </div>
          </div>
        </section>

        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-top">
              <span>Total Investigations</span>
              <span className="metric-icon cyan">▦</span>
            </div>
            <strong>{cases.length.toString().padStart(2, "0")}</strong>
            <small>Recorded transaction cases</small>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>Fraud Predictions</span>
              <span className="metric-icon red">⌁</span>
            </div>
            <strong>{fraudCount.toString().padStart(2, "0")}</strong>
            <small>Flagged by ML model</small>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>Pending Reviews</span>
              <span className="metric-icon violet">◷</span>
            </div>
            <strong>{pendingCount.toString().padStart(2, "0")}</strong>
            <small>Awaiting analyst decision</small>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>Approved Cases</span>
              <span className="metric-icon green">✓</span>
            </div>
            <strong>{approvedCount.toString().padStart(2, "0")}</strong>
            <small>Analyst decisions</small>
          </div>
        </section>

        <section className="workspace-grid" id="analysis">
          <div className="glass-card input-card">
            <div className="section-heading">
              <div>
                <span className="section-kicker">INPUT_01 / TRANSACTION</span>
                <h2>Start an Investigation</h2>
                <p>Provide transaction details for intelligent assessment.</p>
              </div>
              <span className="heading-symbol">⌘</span>
            </div>

            <div className="input-form">
              <div className="form-field">
                <label>TRANSACTION AMOUNT</label>
                <div className="field-control">
                  <span className="field-prefix">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 2500"
                  />
                </div>
                <small>Enter the transaction value.</small>
              </div>

              <div className="form-field">
                <label>TRANSACTION TIME</label>
                <div className="field-control">
                  <span className="field-prefix">◷</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    placeholder="e.g. 12000"
                  />
                </div>
                <small>Elapsed seconds from the dataset timeline.</small>
              </div>

              <div className="form-field">
                <label>DATASET SAMPLE TYPE</label>
                <select
                  value={sampleType}
                  onChange={e => {
                    setSampleType(e.target.value);
                    setTransaction(null);
                    setResult(null);
                    setNotice("");
                  }}
                >
                  <option value="normal">Normal Transaction</option>
                  <option value="fraud">Fraud Transaction</option>
                  <option value="random">Random Transaction</option>
                </select>
                <small>Choose the dataset category to load PCA features.</small>
              </div>
            </div>

            <div className="automation-note">
              <span className="sparkle">✦</span>
              <div>
                <strong>Automated Feature Extraction</strong>
                <p>
                  28 PCA features are retrieved from the selected dataset
                  sample. No manual feature entry is required.
                </p>
              </div>
              <span className="auto-badge">AUTO</span>
            </div>

            {error && <div className="feedback feedback-error">{error}</div>}
            {notice && <div className="feedback feedback-success">{notice}</div>}

            <div className="button-row">
              <button className="button button-outline" onClick={loadSample} disabled={loading || analyzing}>
                {loading ? "Loading..." : "↻ Load Dataset Sample"}
              </button>
              <button className="button button-clear" onClick={resetForm}>
                Reset
              </button>
            </div>

            <button className="button button-main" onClick={runAnalysis} disabled={loading || analyzing}>
              {analyzing ? "Processing Transaction..." : "✦ Run Fraud Analysis"}
              {!analyzing && <span>→</span>}
            </button>

            <div className="input-footnote">
              <span className="pulse-dot"></span>
              Connected to Sentinel AI prediction API
            </div>
          </div>

          <div className="glass-card intelligence-card">
            <div className="section-heading">
              <div>
                <span className="section-kicker">OUTPUT_02 / INTELLIGENCE</span>
                <h2>AI Investigation Center</h2>
                <p>Model output, risk intelligence and case findings.</p>
              </div>
              <span className="heading-symbol">◈</span>
            </div>

            {!result ? (
              <div className="intelligence-empty">
                <div className="empty-orbit">
                  <div className="empty-center">✦</div>
                </div>
                <h3>Awaiting Transaction Data</h3>
                <p>
                  Submit a transaction to activate the intelligence engine
                  and generate an investigation report.
                </p>
                <div className="waiting-line">
                  <span className="pulse-dot"></span> ENGINE READY
                </div>
              </div>
            ) : (
              <div className="intelligence-result">
                <div className="result-summary">
                  <div>
                    <span className="section-kicker">COMPOSITE RISK SCORE</span>
                    <div className="big-score">{risk}<small>/100</small></div>
                  </div>
                  <span className={`risk-chip ${String(result.risk_level || "").toLowerCase()}`}>
                    {result.risk_level || "Unknown"} Risk
                  </span>
                </div>

                <div className="risk-meter">
                  <div style={{ width: `${Math.min(100, Math.max(0, risk))}%` }}></div>
                </div>

                <div className="result-stat-grid">
                  <div>
                    <small>Fraud Probability</small>
                    <strong>{probabilityPercent.toFixed(2)}%</strong>
                  </div>
                  <div>
                    <small>ML Classification</small>
                    <strong className={isFraud ? "text-red" : "text-green"}>
                      {isFraud ? "Fraudulent" : "Normal"}
                    </strong>
                  </div>
                </div>

                <div className="recommendation-box">
                  <span className="section-kicker">RECOMMENDED ACTION</span>
                  <h3>{result.recommended_action || "Review transaction"}</h3>
                  <p>
                    {result.requires_human_review
                      ? "Human analyst review is required for this case."
                      : "The investigation engine did not request manual review."}
                  </p>
                </div>

                <div className="result-metadata">
                  <span>Model: {result.model_mode || "ML Pipeline"}</span>
                  <span>LLM: {result.llm_used ? "Active" : "Not used"}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="glass-card workflow-card" id="workflow">
          <div className="section-heading workflow-heading">
            <div>
              <span className="section-kicker">ORCHESTRATION / LANGGRAPH</span>
              <h2>AI Investigation Workflow</h2>
              <p>Multi-stage transaction analysis and human-in-the-loop review.</p>
            </div>
            <span className="ready-label">
              <span className="pulse-dot"></span> {result ? "ASSESSMENT COMPLETE" : "READY"}
            </span>
          </div>

          <div className="workflow-steps">
            {workflow.map((step, index) => (
              <div className={`workflow-step ${result && index < 3 ? "step-complete" : ""}`} key={step[0]}>
                <div className="step-number">{result && index < 3 ? "✓" : step[0]}</div>
                <div>
                  <strong>{step[1]}</strong>
                  <small>{step[2]}</small>
                </div>
                {index !== workflow.length - 1 && <span className="step-connector">→</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card report-card">
          <div className="report-top">
            <div>
              <span className="section-kicker">INVESTIGATION OUTPUT</span>
              <h2>Development Workspace</h2>
            </div>
            <span className="workspace-state">{result ? "OUTPUT AVAILABLE" : "NO OUTPUT YET"}</span>
          </div>

          <div className="workspace-tabs">
            <button className={activeTab === "report" ? "tab-active" : ""} onClick={() => setActiveTab("report")}>
              Investigation Report
            </button>
            <button className={activeTab === "explanation" ? "tab-active" : ""} onClick={() => setActiveTab("explanation")}>
              Model Explanation
            </button>
            <button className={activeTab === "decision" ? "tab-active" : ""} onClick={() => setActiveTab("decision")}>
              Analyst Review
            </button>
          </div>

          {!result ? (
            <div className="workspace-empty">
              <span>⌘</span>
              <p>Analysis output will appear here after a transaction is processed.</p>
            </div>
          ) : (
            <div className="workspace-output">
              {activeTab === "report" && (
                <>
                  <h3>AI Investigation Report</h3>
                  <p>{result.report || "No report was returned by the investigation agent."}</p>
                </>
              )}

              {activeTab === "explanation" && (
                <>
                  <h3>Model Explanation</h3>
                  <p>{result.explanation || "No model explanation available."}</p>
                </>
              )}

              {activeTab === "decision" && (
                <>
                  <h3>Human Analyst Review</h3>
                  <div className="decision-form">
                    <label>ANALYST NAME</label>
                    <input value={analyst} onChange={e => setAnalyst(e.target.value)} />
                    <label>INVESTIGATION NOTES</label>
                    <textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter review notes..." />
                    <div className="decision-buttons">
                      <button
                        className="button button-approve"
                        onClick={() => decideCase("approve")}
                        disabled={!result.requires_human_review || !!result.decision}
                      >
                        ✓ Approve Case
                      </button>
                      <button
                        className="button button-reject"
                        onClick={() => decideCase("reject")}
                        disabled={!result.requires_human_review || !!result.decision}
                      >
                        ✕ Reject Case
                      </button>
                    </div>
                    {result.decision && <div className="feedback feedback-success">Decision recorded: {result.decision}</div>}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <section className="glass-card cases-card" id="cases">
          <div className="section-heading cases-heading">
            <div>
              <span className="section-kicker">CASE MANAGEMENT / RECORDS</span>
              <h2>Recent Investigations</h2>
              <p>Transaction assessments recorded by Sentinel AI.</p>
            </div>
            <button className="button button-outline refresh-button" onClick={loadCases}>↻ Refresh Records</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>CASE REFERENCE</th>
                  <th>AMOUNT</th>
                  <th>CLASSIFICATION</th>
                  <th>RISK</th>
                  <th>SCORE</th>
                  <th>CASE STATUS</th>
                </tr>
              </thead>
              <tbody>
                {cases.length === 0 ? (
                  <tr><td colSpan="6" className="no-cases">No investigation records available.</td></tr>
                ) : (
                  cases.map(item => (
                    <tr key={item.case_id}>
                      <td className="case-reference">#{item.case_id}</td>
                      <td>${Number(item.amount).toFixed(2)}</td>
                      <td>
                        <span className={Number(item.prediction) === 1 ? "classification-fraud" : "classification-normal"}>
                          {Number(item.prediction) === 1 ? "Fraud" : "Normal"}
                        </span>
                      </td>
                      <td>{item.risk_level}</td>
                      <td>{item.risk_score}/100</td>
                      <td>{item.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="page-footer">
          <span>© 2026 Sentinel AI · Enterprise Fraud Detection</span>
          <span>Machine Learning · LangGraph · FastAPI · AI Investigation</span>
        </footer>
      </main>
    </div>
  );
}
