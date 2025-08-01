const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
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
    chestPain: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },
    maxHR: {
      type: Number,
      required: true,
      min: 0,
    },
    oldpeak: {
      type: Number,
      required: true,
      min: 0,
    },
    result: {
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
    model: {
      type: String,
      required: true,
      enum: ["logistic_regression", "random_forest", "xgboost"],
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Diagnosis", diagnosisSchema);
