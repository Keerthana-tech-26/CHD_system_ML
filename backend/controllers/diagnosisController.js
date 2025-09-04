const axios = require("axios");
const Diagnosis = require("../models/Diagnosis");

const saveDiagnosis = async (req, res) => {
  const { patientName, patientId, inputData, model, chestPain, maxHR, oldpeak } = req.body;
  
  if (!inputData || !patientName || !patientId || !model ||
      chestPain === undefined || maxHR === undefined || oldpeak === undefined) {
    return res.status(400).json({
      error: "Missing input data, model name, patient name, patient ID, or CHD-related parameters",
    });
  }
  
  try {
    const flaskRes = await axios.post("http://localhost:5000/predict", {
      inputData,
      model,
    });
    
    const { result, probability, model_used, metrics } = flaskRes.data;
    const actualModelUsed = model_used || model;
    
    const newDiagnosis = new Diagnosis({
      patientName,
      patientId,
      inputData,
      chestPain,
      maxHR,
      oldpeak,
      result,
      probability,
      model: actualModelUsed,
    });
    
    await newDiagnosis.save();
    
    res.json({
      message: "Diagnosis saved successfully ✅",
      result,
      probability,
      model_used: actualModelUsed,
      model: actualModelUsed,
      metrics: metrics || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Unknown error occurred" });
  }
};

const getDiagnosisHistory = async (req, res) => {
  const { patientName } = req.params;
  
  if (!patientName) {
    return res.status(400).json({ error: "Missing patient name in request" });
  }
  
  try {
    const normalizedName = patientName.replace(/_/g, " ");
    const history = await Diagnosis.find({
      patientName: new RegExp("^" + normalizedName + "$", "i"),
    }).sort({ createdAt: -1 });

    return res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch diagnosis history" });
  }
};

const getAllDiagnosis = async (req, res) => {
  try {
    const allData = await Diagnosis.find().sort({ createdAt: -1 });
    res.json(allData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all diagnoses" });
  }
};

const getLatestDiagnosisByPatientId = async (req, res) => {
  const { patientId } = req.params;
  
  if (!patientId) {
    return res.status(400).json({ error: "Missing patient ID" });
  }
  
  try {
    const diagnosis = await Diagnosis.findOne({
      patientName: new RegExp("^" + patientId + "$", "i"),
    }).sort({ createdAt: -1 });

    if (!diagnosis) {
      return res.status(404).json({ error: "No diagnosis found" });
    }
    
    const diagnosisObj = diagnosis.toObject();
    diagnosisObj.prediction = diagnosisObj.result;
    res.json(diagnosisObj);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch latest diagnosis" });
  }
};

const deleteDiagnosis = async (req, res) => {
  try {
    const deleted = await Diagnosis.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Diagnosis not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete diagnosis" });
  }
};

const getLatestDiagnosisByPatientName = async (req, res) => {
  try {
    const { patientName } = req.params;
    if (!patientName) {
      return res.status(400).json({ error: "Patient name is required" });
    }
    const normalizedName = patientName.replace(/_/g, " ");
    const latestDiagnosis = await Diagnosis.findOne({ 
      patientName: new RegExp("^" + normalizedName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + "$", "i")
    })
      .sort({ createdAt: -1 })
      .lean();
    if (!latestDiagnosis) {
      return res.status(404).json({ message: "No diagnosis found for this patient" });
    }
    res.json(latestDiagnosis);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  saveDiagnosis,
  getDiagnosisHistory,
  getAllDiagnosis,
  deleteDiagnosis,
  getLatestDiagnosisByPatientId,
  getLatestDiagnosisByPatientName,
};
