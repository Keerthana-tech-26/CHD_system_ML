const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      trim: true,
    },
    patientId: {
      type: String,
      required: true,
      trim: true,
    },
    inputData: {
      type: Object,
      required: true,
    },
    prediction: {
      type: Number,
      required: true,
      enum: [0, 1],
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    probabilities: {
      low_risk: {
        type: Number,
        min: 0,
        max: 1,
      },
      high_risk: {
        type: Number,
        min: 0,
        max: 1,
      },
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    model: {
      type: String,
      required: true,
      enum: [
        "logistic_regression",
        "random_forest", 
        "xgboost",
        "lightgbm",
        "catboost",
        "voting_ensemble",
        "stacking_model"
      ],
    },
    modelDisplayName: {
      type: String,
    },
    metrics: {
      type: Object,
    },
    riskLevel: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Diagnosis", diagnosisSchema);