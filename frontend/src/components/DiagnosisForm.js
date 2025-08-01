import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DiagnosisForm.css";

const mapChestPain = (type) => {
  switch (type) {
    case "Typical Angina": return 1;
    case "Atypical Angina": return 2;
    case "Non-anginal Pain": return 3;
    case "Asymptomatic": return 4;
    default: return 0;
  }
};

const mapGender = (sex) => {
  if (sex === "Male") return 2;
  if (sex === "Female") return 1;
  return 0;
};

export default function DiagnosisForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    patientName: "",
    Age: "",
    Sex: "",
    ChestPainType: "",
    RestingBP: "",
    ap_lo: "",
    Cholesterol: "",
    gluc: "",
    FastingBS: "",
    MaxHR: "",
    Oldpeak: "",
    Height: "",
    Weight: "",
    Smoke: "",
    Alco: "",
    Active: "",
    model: "",
  });

  useEffect(() => {
    const name = localStorage.getItem("chd_patient");
    if (name) {
      setFormData((prev) => ({ ...prev, patientName: name }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const requiredFields = [
      "patientName", "Age", "Sex", "ChestPainType", "RestingBP", "ap_lo",
      "Cholesterol", "gluc", "FastingBS", "MaxHR", "Oldpeak", "Height", "Weight",
      "Smoke", "Alco", "Active", "model"
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        alert(`Please fill in the ${field} field.`);
        setIsLoading(false);
        return;
      }
    }

    const patientId = formData.patientName.trim().toLowerCase().replace(/\s+/g, "_");
    localStorage.setItem("chd_patient", formData.patientName);
    localStorage.setItem("patientId", patientId);
    localStorage.setItem("currentPatientName", formData.patientName);

    const mappedData = {
      age: parseInt(formData.Age),
      gender: mapGender(formData.Sex),
      height: parseInt(formData.Height),
      weight: parseInt(formData.Weight),
      ap_hi: parseInt(formData.RestingBP),
      ap_lo: parseInt(formData.ap_lo),
      cholesterol: parseInt(formData.Cholesterol),
      gluc: parseInt(formData.gluc),
      smoke: parseInt(formData.Smoke),
      alco: parseInt(formData.Alco),
      active: parseInt(formData.Active),
    };

    const chestPain = mapChestPain(formData.ChestPainType);
    const maxHR = parseInt(formData.MaxHR);
    const oldpeak = parseFloat(formData.Oldpeak);

    try {
      const response = await fetch("http://localhost:4000/api/diagnosis/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputData: mappedData,
          patientName: formData.patientName,
          patientId,
          chestPain,
          maxHR,
          oldpeak,
          model: formData.model
        })
      });

      const result = await response.json();
      if (response.ok && result.result !== undefined && result.probability !== undefined) {
        localStorage.setItem("chd_result", JSON.stringify(result));
        navigate("/results");
      } else {
        alert(result.error || "Prediction failed. Please try again.");
      }
    } catch (error) {
      alert("Prediction failed. Please check your input or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const renderProgressBar = () => (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${(currentStep / 4) * 100}%` }}
        ></div>
      </div>
      <div className="step-labels">
        <span className={currentStep >= 1 ? "active" : ""}>Patient Info</span>
        <span className={currentStep >= 2 ? "active" : ""}>Vital Signs</span>
        <span className={currentStep >= 3 ? "active" : ""}>Health Factors</span>
        <span className={currentStep >= 4 ? "active" : ""}>Model Selection</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="form-step">
      <h3>👤 Patient Information</h3>
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
              min="1"
              max="120"
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            <span className="label-text">Sex *</span>
            <select name="Sex" value={formData.Sex} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>
        </div>
        <div className="form-group full-width">
          <label>
            <span className="label-text">Height (cm) *</span>
            <input 
              type="number" 
              name="Height" 
              value={formData.Height} 
              onChange={handleChange}
              placeholder="Enter height in centimeters"
              min="100"
              max="250"
            />
          </label>
        </div>
        <div className="form-group full-width">
          <label>
            <span className="label-text">Weight (kg) *</span>
            <input 
              type="number" 
              name="Weight" 
              value={formData.Weight} 
              onChange={handleChange}
              placeholder="Enter weight in kilograms"
              min="30"
              max="300"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      <h3>🩺 Vital Signs & Clinical Measurements</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>
            <span className="label-text">Resting BP (Systolic) *</span>
            <input 
              type="number" 
              name="RestingBP" 
              value={formData.RestingBP} 
              onChange={handleChange}
              placeholder="e.g., 120"
              min="80"
              max="200"
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            <span className="label-text">Diastolic BP *</span>
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
        <div className="form-group">
          <label>
            <span className="label-text">Max Heart Rate *</span>
            <input 
              type="number" 
              name="MaxHR" 
              value={formData.MaxHR} 
              onChange={handleChange}
              placeholder="e.g., 150"
              min="60"
              max="220"
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            <span className="label-text">Oldpeak *</span>
            <input 
              type="number" 
              step="0.1" 
              name="Oldpeak" 
              value={formData.Oldpeak} 
              onChange={handleChange}
              placeholder="e.g., 1.0"
              min="0"
              max="10"
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            <span className="label-text">Chest Pain Type *</span>
            <select name="ChestPainType" value={formData.ChestPainType} onChange={handleChange}>
              <option value="">Select Type</option>
              <option value="Typical Angina">Typical Angina</option>
              <option value="Atypical Angina">Atypical Angina</option>
              <option value="Non-anginal Pain">Non-anginal Pain</option>
              <option value="Asymptomatic">Asymptomatic</option>
            </select>
          </label>
        </div>
        <div className="form-group">
          <label>
            <span className="label-text">Fasting Blood Sugar *</span>
            <select name="FastingBS" value={formData.FastingBS} onChange={handleChange}>
              <option value="">Select</option>
              <option value={0}>Normal (≤ 120 mg/dl)</option>
              <option value={1}>High (&gt; 120 mg/dl)</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-step">
      <h3>🔬 Laboratory Results & Lifestyle</h3>
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
  );

  const renderStep4 = () => (
    <div className="form-step">
      <h3>🤖 AI Model Selection</h3>
      <div className="model-selection">
        <p className="model-description">
          Choose the machine learning model for your diagnosis:
        </p>
        <div className="model-cards">
          <div 
            className={`model-card ${formData.model === 'logistic_regression' ? 'selected' : ''}`}
            onClick={() => setFormData({...formData, model: 'logistic_regression'})}
          >
            <div className="model-icon">📊</div>
            <h4>Logistic Regression</h4>
            <p>Linear approach, good interpretability</p>
          </div>
          <div 
            className={`model-card ${formData.model === 'random_forest' ? 'selected' : ''}`}
            onClick={() => setFormData({...formData, model: 'random_forest'})}
          >
            <div className="model-icon">🌳</div>
            <h4>Random Forest</h4>
            <p>Ensemble method, balanced accuracy</p>
          </div>
          <div 
            className={`model-card ${formData.model === 'xgboost' ? 'selected' : ''}`}
            onClick={() => setFormData({...formData, model: 'xgboost'})}
          >
            <div className="model-icon">🚀</div>
            <h4>XGBoost</h4>
            <p>Advanced gradient boosting, high performance</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="diagnosis-form-container">
      <div className="form-header">
        <h2>🏥 CHD Diagnosis Assessment</h2>
        <p>Complete cardiovascular risk evaluation</p>
      </div>

      {renderProgressBar()}

      <form onSubmit={handleSubmit} className="diagnosis-form">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        <div className="form-navigation">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className="btn-secondary">
              ← Previous
            </button>
          )}
          
          {currentStep < 4 ? (
            <button type="button" onClick={nextStep} className="btn-primary">
              Next →
            </button>
          ) : (
            <button type="submit" disabled={isLoading} className="btn-submit">
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  🔍 Run Diagnosis
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}