import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "../styles/PatientHistory.css";

export default function PatientHistory() {
  console.log("PatientHistory component is rendering");
  const [groupedHistory, setGroupedHistory] = useState({});
  const [globalChartData, setGlobalChartData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("PatientHistory useEffect running");
    const fetchAllHistory = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/diagnosis/");
        const data = await res.json();

        if (Array.isArray(data)) {
          console.log("PatientHistory received data:", data); 
          const grouped = {};
          data.forEach((entry) => {
            const name = entry.patientName || entry.patientId || 'Unknown';
            if (!grouped[name]) grouped[name] = [];
            grouped[name].push(entry);
          });
          Object.keys(grouped).forEach((name) => {
            grouped[name].sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));
          });
          setGroupedHistory(grouped);
          const sortedGlobal = [...data].sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));
          const chartPoints = sortedGlobal.map((item) => ({
            id: item._id,
            time: new Date(item.timestamp || item.createdAt).toLocaleString(),
            probability: Number((item.probability * 100).toFixed(2)),
            patientName: item.patientName,
            riskLabel: item.prediction == 1 ? "At Risk" : "Not at Risk",
            strokeColor: item.prediction == 1 ? "#ff4d4f" : "#28a745", 
          }));
          setGlobalChartData(chartPoints);
        } else {
          console.error("Diagnosis API did not return an array");
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };
    fetchAllHistory();
  }, []);

  const handleDelete = async (id, patientName) => {
    if (window.confirm("Delete this prediction?")) {
      try {
        await fetch(`http://localhost:4000/api/diagnosis/delete/${id}`, { method: "DELETE" });
        setGroupedHistory((prev) => {
          const updated = { ...prev };
          updated[patientName] = updated[patientName].filter((entry) => entry._id !== id);
          if (updated[patientName].length === 0) delete updated[patientName];
          return updated;
        });
        setGlobalChartData((prev) => prev.filter((entry) => entry.id !== id));
      } catch (err) {
        console.error("Failed to delete:", err);
      }
    }
  };

  const handleNext = () => {
    navigate("/chatbot");
  };

  return (
    <div className="patient-history-container">
      <h2 className="page-title">Diagnosis History</h2>
      
      {Object.keys(groupedHistory).length === 0 ? (
        <div className="no-predictions">
          <p>No predictions found.</p>
        </div>
      ) : (
        Object.entries(groupedHistory).map(([patientName, entries]) => (
          <div key={`patient-${patientName}`} className="patient-card">
            <h3 className="patient-name">{patientName}</h3>
            <p className="total-predictions">
              <strong>Total Predictions:</strong> {entries.length}
            </p>
            <ul className="predictions-list">
              {entries.map((item) => (
                <li key={`diagnosis-${item._id}`} className="prediction-item">
                  <div className="prediction-detail">
                    <strong>Timestamp:</strong> {new Date(item.timestamp || item.createdAt).toLocaleString()}
                  </div>
                  <div className="prediction-detail">
                    <strong>Prediction:</strong>
                    <span className={item.prediction === 1 ? "prediction-result at-risk" : "prediction-result not-at-risk"}>
                      {item.prediction === 1 ? "At Risk" : "Not at Risk"}
                    </span>
                  </div>
                  <div className="prediction-detail">
                    <strong>Confidence:</strong>
                    <span className="confidence-badge">
                      {(item.probability * 100).toFixed(2)}%
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(item._id, patientName)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {globalChartData.length > 1 && (
        <div className="chart-section">
          <h3 className="chart-title">📈 Overall Risk Probability Trend</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={globalChartData}>
                <CartesianGrid stroke="#ccc" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return isNaN(date) ? value : date.toLocaleTimeString();
                  }}
                />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value, name) => [`${value.toFixed(2)}%`, "Confidence"]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return isNaN(date)
                      ? `Time: ${label}`
                      : `Time: ${date.toLocaleString()}`;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="probability"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={({ cx, cy, payload }) => {
                    const color =
                      payload.riskLabel === "At Risk" ? "#ff4d4f" : "#28a745";
                    return (
                      <circle
                        key={`dot-${payload.id}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={color}
                        stroke="#333"
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="legend-container">
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: "#ff4d4f" }}></div>
              <span>At Risk</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: "#28a745" }}></div>
              <span>Not at Risk</span>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleNext} className="next-button">
        Next
      </button>
    </div>
  );
}