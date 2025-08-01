import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../styles/ResultsDisplay.css";

export default function ResultsDisplay() {
  const navigate = useNavigate();
  const patientName =
    localStorage.getItem("chd_patient")?.replace(/_/g, " ") || "Unknown";
  const result = JSON.parse(localStorage.getItem("chd_result"));
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const modelUsed = result?.model_used || result?.model || "logistic_regression";

  useEffect(() => {
    if (modelUsed) {
      fetch(`http://localhost:5000/model-metrics/${modelUsed}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setMetrics(data.metrics || {});
        })
        .catch((err) => {
          if (result?.metrics) {
            setMetrics(result.metrics);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [modelUsed, result]);

  if (
    !result ||
    typeof result.result === "undefined" ||
    typeof result.probability === "undefined"
  ) {
    return (
      <div className="results-container error-state">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>No Prediction Result Found</h2>
          <p>Please return to the form and complete a diagnosis first.</p>
          <button 
            onClick={() => navigate("/")} 
            className="btn-primary"
          >
            Back to Form
          </button>
        </div>
      </div>
    );
  }

  const { result: prediction, probability } = result;
  const isAtRisk = prediction === 1;
  
  const message = isAtRisk
    ? `⚠️ You are at risk of CHD. Follow precautions and consider consulting a cardiologist.`
    : `✅ You are not at risk of CHD. Keep maintaining a healthy lifestyle!`;

  const chartData =
    metrics?.precision && metrics?.recall && metrics?.f1_score
      ? ["0", "1"].map((label) => ({
          label: label === "0" ? "Not at Risk" : "At Risk",
          precision: metrics.precision?.[label] ?? 0,
          recall: metrics.recall?.[label] ?? 0,
          f1_score: metrics.f1_score?.[label] ?? 0,
        }))
      : [];
  const confidenceData = [
    { name: 'Confidence', value: probability * 100 },
    { name: 'Uncertainty', value: (1 - probability) * 100 }
  ];

  const COLORS = isAtRisk ? ['#e74c3c', '#ecf0f1'] : ['#27ae60', '#ecf0f1'];

  const handleNext = () => {
    const context = {
      prediction,
      probability,
      message,
      modelUsed,
    };
    localStorage.setItem("chd_chatbot_context", JSON.stringify(context));
    navigate("/history");
  };

  const safeAccuracy =
    metrics?.accuracy && !isNaN(metrics.accuracy)
      ? `${(metrics.accuracy * 100).toFixed(2)}%`
      : "N/A";

  const formatModelName = (modelName) => {
    if (!modelName) return "Unknown";
    return modelName
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderConfidenceLevel = () => {
    const confidenceLevel = probability * 100;
    let levelText, levelClass;
    
    if (confidenceLevel >= 90) {
      levelText = "Very High";
      levelClass = "very-high";
    } else if (confidenceLevel >= 75) {
      levelText = "High";
      levelClass = "high";
    } else if (confidenceLevel >= 60) {
      levelText = "Moderate";
      levelClass = "moderate";
    } else {
      levelText = "Low";
      levelClass = "low";
    }

    return (
      <div className={`confidence-level ${levelClass}`}>
        <span className="confidence-text">Confidence Level: {levelText}</span>
        <div className="confidence-bar">
          <div 
            className="confidence-fill" 
            style={{ width: `${confidenceLevel}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="results-container loading-state">
        <div className="loading-card">
          <div className="spinner-large"></div>
          <h3>Processing Results...</h3>
          <p>Analyzing your health data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>🏥 Health Assessment Results</h1>
        <p>Comprehensive cardiovascular risk analysis</p>
      </div>

      <div className={`result-card ${isAtRisk ? 'at-risk' : 'no-risk'}`}>
        <div className="result-icon">
          {isAtRisk ? '⚠️' : '✅'}
        </div>
        <div className="result-content">
          <h2>{isAtRisk ? 'Risk Detected' : 'Low Risk'}</h2>
          <p className="result-description">
            {isAtRisk 
              ? 'Our analysis indicates potential cardiovascular risk factors.' 
              : 'Your cardiovascular health appears to be in good condition.'
            }
          </p>
          {renderConfidenceLevel()}
        </div>
        <div className="confidence-chart">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={confidenceData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                startAngle={90}
                endAngle={450}
                dataKey="value"
              >
                {confidenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="confidence-percentage">
            {(probability * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <div className="info-icon">👤</div>
          <div className="info-content">
            <h3>Patient</h3>
            <p>{patientName}</p>
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-icon">🤖</div>
          <div className="info-content">
            <h3>AI Model</h3>
            <p>{formatModelName(modelUsed)}</p>
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-icon">📊</div>
          <div className="info-content">
            <h3>Accuracy</h3>
            <p>{safeAccuracy}</p>
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-icon">🎯</div>
          <div className="info-content">
            <h3>Prediction</h3>
            <p>{isAtRisk ? "At Risk" : "Not at Risk"}</p>
          </div>
        </div>
      </div>

      <div className="recommendations-card">
        <h3>📋 Medical Recommendations</h3>
        <div className="recommendation-content">
          <div className="recommendation-icon">
            {isAtRisk ? '🩺' : '💚'}
          </div>
          <p className="recommendation-text">{message}</p>
        </div>
        
        {isAtRisk && (
          <div className="action-items">
            <h4>Immediate Actions:</h4>
            <ul>
              <li>📞 Schedule consultation with a cardiologist</li>
              <li>🥗 Adopt a heart-healthy diet</li>
              <li>🏃‍♂️ Begin regular exercise routine</li>
              <li>🚭 Avoid smoking and excessive alcohol</li>
              <li>📈 Monitor blood pressure and cholesterol regularly</li>
            </ul>
          </div>
        )}
      </div>

      {metrics && chartData.length > 0 && (
        <div className="metrics-section">
          <h3>📊 Model Performance Analysis</h3>
          
          <div className="charts-container">
            <div className="chart-card">
              <h4>Performance Metrics by Risk Category</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip 
                    formatter={(value, name) => [`${(value * 100).toFixed(1)}%`, name]}
                    labelStyle={{ color: '#2c3e50' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e1e8ed',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="precision" fill="#3498db" name="Precision" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recall" fill="#2ecc71" name="Recall" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="f1_score" fill="#f39c12" name="F1 Score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="metrics-details">
            {chartData.map((item, index) => (
              <div key={`metrics-${index}`} className="metric-card">
                <h4>{item.label}</h4>
                <div className="metric-stats">
                  <div className="stat">
                    <span className="stat-label">🎯 Precision</span>
                    <span className="stat-value">{(item.precision * 100).toFixed(1)}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">📊 Recall</span>
                    <span className="stat-value">{(item.recall * 100).toFixed(1)}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">⭐ F1 Score</span>
                    <span className="stat-value">{(item.f1_score * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="results-navigation">
        <button onClick={() => navigate("/")} className="btn-secondary">
          ← New Assessment
        </button>
        <button onClick={handleNext} className="btn-primary">
          View History →
        </button>
      </div>
    </div>
  );
}