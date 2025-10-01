const express = require("express");
const router = express.Router();
const diagnosisController = require("../controllers/diagnosisController");
const Diagnosis = require("../models/Diagnosis");
const Chat = require("../models/Chat");

router.get("/", diagnosisController.getAllDiagnosis);
router.post("/predict", diagnosisController.predictDiagnosis);
router.post("/save", diagnosisController.saveDiagnosis);
router.get("/models", diagnosisController.getAvailableModels);
router.get("/models/comparison", diagnosisController.getModelComparison);
router.get("/model-metrics/:modelName", diagnosisController.getModelMetrics);
router.get("/ensemble-metrics", diagnosisController.getEnsembleMetrics);
router.get("/history", diagnosisController.getDiagnosisHistory);
router.get("/history/:patientName", diagnosisController.getDiagnosisHistory);
router.get("/:id", diagnosisController.getDiagnosisById);

if (typeof diagnosisController.getLatestDiagnosisByPatientId === "function") {
  router.get("/latest/:patientId", diagnosisController.getLatestDiagnosisByPatientId);
}

if (typeof diagnosisController.getLatestDiagnosisByPatientName === "function") {
  router.get("/latest/name/:patientName", diagnosisController.getLatestDiagnosisByPatientName);
}

router.delete("/delete/:id", async (req, res) => {
  try {
    const deleted = await Diagnosis.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Diagnosis not found" });
    }
    const patientName = deleted.patientName;
    await Chat.deleteMany({ patientId: patientName });
    res.json({
      message: "Deleted successfully along with related chat history.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete diagnosis" });
  }
});

module.exports = router;