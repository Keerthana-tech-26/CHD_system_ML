import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DiagnosisForm.css";

const mapGender = (sex) => {
  if (sex === "Male") return 2;
  if (sex === "Female") return 1;
  return 0;
};

export default function DiagnosisForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    Age: "",
    Sex: "",
    Height: "",
    Weight: "",
    ap_hi: "",
    ap_lo: "",
    Cholesterol: "",
    gluc: "",
    Smoke: "",
    Alco: "",
    Active: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const requiredFields = [
      "patientName", "Age", "Sex", "Height", "Weight", "ap_hi", "ap_lo",
      "Cholesterol", "gluc", "Smoke", "Alco", "Active"
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        alert(`Please fill in the ${field} field.`);
        setIsLoading(false);
        return;
      }
    }

    const patientId = formData.patientName.trim().toLowerCase().replace(/\s+/g, "_");

    const mappedData = {
      age: parseInt(formData.Age),
      gender: mapGender(formData.Sex),
      height: parseInt(formData.Height),
      weight: parseInt(formData.Weight),
      ap_hi: parseInt(formData.ap_hi),
      ap_lo: parseInt(formData.ap_lo),
      cholesterol: parseInt(formData.Cholesterol),
      gluc: parseInt(formData.gluc),
      smoke: parseInt(formData.Smoke),
      alco: parseInt(formData.Alco),
      active: parseInt(formData.Active),
    };

    try {
      const response = await fetch("http://localhost:4000/api/diagnosis/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientData: mappedData,
          patientId,
          selectedModel: "voting_ensemble"
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        localStorage.setItem("chd_result", JSON.stringify(result));
        console.log("Diagnosis completed successfully");
        navigate("/results");
      } else {
        console.error("Unexpected response:", result);
        alert(result.error || "Prediction failed. Please try again.");
      }
    } catch (error) {
      console.error("Prediction failed:", error);
      alert("Prediction failed. Please check your input or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="diagnosis-form-container">
      <div className="form-header">
        <h2>Cardiovascular Disease Risk Assessment</h2>
        <p>Complete cardiovascular risk evaluation</p>
      </div>

      <form onSubmit={handleSubmit} className="diagnosis-form">
        <div className="form-section">
          <h3 className="section-title">Patient Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <span className="label-text">Patient Name *</span>
                <input 
                  type="text" 
                  name="patientName" 
                  value={formData.patientName} 
                  onChange={handleChange} 
                  placeholder="Enter patient name"
                  required 
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                <span className="label-text">Age (Years) *</span>
                <input 
                  type="number" 
                  name="Age" 
                  value={formData.Age} 
                  onChange={handleChange}
                  placeholder="Enter age"
                  min="30"
                  max="80"
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                <span className="label-text">Gender *</span>
                <select name="Sex" value={formData.Sex} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                <span className="label-text">Height (cm) *</span>
                <input 
                  type="number" 
                  name="Height" 
                  value={formData.Height} 
                  onChange={handleChange}
                  placeholder="Enter height in centimeters"
                  min="140"
                  max="200"
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                <span className="label-text">Weight (kg) *</span>
                <input 
                  type="number" 
                  name="Weight" 
                  value={formData.Weight} 
                  onChange={handleChange}
                  placeholder="Enter weight in kilograms"
                  min="40"
                  max="150"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Blood Pressure Measurements</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <span className="label-text">Systolic Blood Pressure *</span>
                <input 
                  type="number" 
                  name="ap_hi" 
                  value={formData.ap_hi} 
                  onChange={handleChange}
                  placeholder="e.g., 120"
                  min="80"
                  max="200"
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                <span className="label-text">Diastolic Blood Pressure *</span>
                <input 
                  type="number" 
                  name="ap_lo" 
                  value={formData.ap_lo} 
                  onChange={handleChange}
                  placeholder="e.g., 80"
                  min="50"
                  max="130"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Laboratory Results & Lifestyle</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <span className="label-text">Cholesterol Level *</span>
                <select name="Cholesterol" value={formData.Cholesterol} onChange={handleChange}>
                  <option value="">Select Level</option>
                  <option value={1}>Normal</option>
                  <option value={2}>Above Normal</option>
                  <option value={3}>Well Above Normal</option>
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                <span className="label-text">Glucose Level *</span>
                <select name="gluc" value={formData.gluc} onChange={handleChange}>
                  <option value="">Select Level</option>
                  <option value={1}>Normal</option>
                  <option value={2}>Above Normal</option>
                  <option value={3}>Well Above Normal</option>
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                <span className="label-text">Smoker *</span>
                <select name="Smoke" value={formData.Smoke} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                <span className="label-text">Alcohol Consumption *</span>
                <select name="Alco" value={formData.Alco} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                <span className="label-text">Physically Active *</span>
                <select name="Active" value={formData.Active} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="form-submit-section">
          <button type="submit" disabled={isLoading} className="btn-submit">
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              "Run Diagnosis"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}