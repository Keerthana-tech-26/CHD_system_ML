const axios = require('axios');
const Diagnosis = require('../models/Diagnosis');
const ML_API_BASE_URL = process.env.ML_API_URL || 'http://127.0.0.1:5000';

const calculateBMI = (height, weight) => {
    const heightM = height / 100;
    return weight / (heightM * heightM);
};

const calculateBMICategory = (bmi) => {
    if (bmi < 18.5) return 1;
    if (bmi < 25) return 2;
    if (bmi < 30) return 3;
    return 4;
};

const calculatePulsePressure = (systolic, diastolic) => {
    return systolic - diastolic;
};

const calculateMAP = (systolic, diastolic) => {
    return diastolic + (systolic - diastolic) / 3;
};

const calculateBPCategory = (systolic, diastolic) => {
    if (systolic < 120 && diastolic < 80) return 1;
    if (systolic < 130 && diastolic < 80) return 2;
    if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) return 3;
    if ((systolic >= 140 && systolic < 180) || (diastolic >= 90 && diastolic < 120)) return 4;
    return 5;
};

const calculateAgeGroup = (age) => {
    if (age < 40) return 1;
    if (age < 50) return 2;
    if (age < 60) return 3;
    return 4;
};

const calculateLifestyleRisk = (smoke, alco, active) => {
    let risk = 0;
    if (smoke === 1) risk += 2;
    if (alco === 1) risk += 1;
    if (active === 0) risk += 1;
    return risk;
};

const calculateMetabolicRisk = (cholesterol, gluc, bmi) => {
    let risk = 0;
    if (cholesterol >= 2) risk += 1;
    if (gluc >= 2) risk += 1;
    if (bmi > 30) risk += 1;
    return risk;
};

const calculateRiskScore = (age, bmi, systolic, diastolic, cholesterol, gluc, smoke, alco, active) => {
    let score = 0;
    score += age > 50 ? 2 : 0;
    score += bmi > 30 ? 2 : 0;
    score += systolic > 140 ? 2 : 0;
    score += diastolic > 90 ? 1 : 0;
    score += cholesterol >= 2 ? 1 : 0;
    score += gluc >= 2 ? 1 : 0;
    score += smoke === 1 ? 2 : 0;
    score += alco === 1 ? 1 : 0;
    score += active === 0 ? 1 : 0;
    return Math.min(score, 10);
};

const saveDiagnosis = async (req, res) => {
    try {
        const diagnosisData = req.body;
        
        if (!diagnosisData) {
            return res.status(400).json({ error: 'Diagnosis data is required' });
        }

        const diagnosis = new Diagnosis(diagnosisData);
        await diagnosis.save();

        res.json({
            success: true,
            message: 'Diagnosis saved successfully',
            diagnosisId: diagnosis._id,
            diagnosis: diagnosis
        });

    } catch (error) {
        console.error('Error saving diagnosis:', error.message);
        res.status(500).json({
            error: 'Failed to save diagnosis',
            details: error.message
        });
    }
};

const getAllDiagnosis = async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const skip = (page - 1) * limit;
        
        const diagnoses = await Diagnosis.find({})
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Diagnosis.countDocuments({});

        res.json(diagnoses);

    } catch (error) {
        console.error('Error fetching all diagnoses:', error.message);
        res.status(500).json({
            error: 'Failed to fetch diagnoses',
            details: error.message
        });
    }
};

const getLatestDiagnosisByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        if (!patientId) {
            return res.status(400).json({ error: 'Patient ID is required' });
        }

        const diagnosis = await Diagnosis.findOne({ patientId })
            .sort({ timestamp: -1 });

        if (!diagnosis) {
            return res.status(404).json({ error: 'No diagnosis found for this patient' });
        }

        res.json({
            success: true,
            diagnosis
        });

    } catch (error) {
        console.error('Error fetching latest diagnosis by patient ID:', error.message);
        res.status(500).json({
            error: 'Failed to fetch latest diagnosis',
            details: error.message
        });
    }
};

const getLatestDiagnosisByPatientName = async (req, res) => {
    try {
        const { patientName } = req.params;
        
        if (!patientName) {
            return res.status(400).json({ error: 'Patient name is required' });
        }

        const diagnosis = await Diagnosis.findOne({ 
            $or: [
                { patientName: patientName },
                { patientId: patientName.toLowerCase().replace(/\s+/g, "_") }
            ]
        }).sort({ timestamp: -1 });

        if (!diagnosis) {
            return res.status(404).json({ error: 'No diagnosis found for this patient' });
        }

        res.json({
            success: true,
            diagnosis
        });

    } catch (error) {
        console.error('Error fetching latest diagnosis by patient name:', error.message);
        res.status(500).json({
            error: 'Failed to fetch latest diagnosis',
            details: error.message
        });
    }
};

const getAvailableModels = async (req, res) => {
    try {
        const response = await axios.get(`${ML_API_BASE_URL}/models`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching available models:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch available models',
            details: error.message 
        });
    }
};

const getModelComparison = async (req, res) => {
    try {
        const response = await axios.get(`${ML_API_BASE_URL}/model-comparison`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching model comparison:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch model comparison',
            details: error.message 
        });
    }
};

const getModelMetrics = async (req, res) => {
    try {
        const { modelName } = req.params;
        const response = await axios.get(`${ML_API_BASE_URL}/model-metrics/${modelName}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching model metrics:', error.message);
        if (error.response && error.response.status === 404) {
            res.status(404).json({ 
                error: 'Model not found',
                details: error.response.data 
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to fetch model metrics',
                details: error.message 
            });
        }
    }
};

const getEnsembleMetrics = async (req, res) => {
    try {
        const response = await axios.get(`${ML_API_BASE_URL}/model-metrics/voting_ensemble`);
        res.json({
            success: true,
            ensemble_metrics: response.data.metrics,
            model_name: 'Ensemble Model',
            description: 'Combined predictions from multiple ML models for enhanced accuracy'
        });
    } catch (error) {
        console.error('Error fetching ensemble metrics:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch ensemble metrics',
            details: error.message 
        });
    }
};

const predictDiagnosis = async (req, res) => {
    try {
        const { patientData, selectedModel = 'voting_ensemble' } = req.body;

        if (!patientData) {
            return res.status(400).json({ error: 'Patient data is required' });
        }

        const bmi = calculateBMI(patientData.height, patientData.weight);
        const pulsePressure = calculatePulsePressure(patientData.ap_hi, patientData.ap_lo);
        const map = calculateMAP(patientData.ap_hi, patientData.ap_lo);
        const bpCategory = calculateBPCategory(patientData.ap_hi, patientData.ap_lo);
        const ageGroup = calculateAgeGroup(patientData.age);
        const bmiCategory = calculateBMICategory(bmi);
        const lifestyleRisk = calculateLifestyleRisk(patientData.smoke, patientData.alco, patientData.active);
        const metabolicRisk = calculateMetabolicRisk(patientData.cholesterol, patientData.gluc, bmi);
        const riskScore = calculateRiskScore(
            patientData.age, bmi, patientData.ap_hi, patientData.ap_lo,
            patientData.cholesterol, patientData.gluc, patientData.smoke, 
            patientData.alco, patientData.active
        );
        
        const mappedData = {
            age_years: patientData.age,
            gender: patientData.gender,
            height: patientData.height,
            weight: patientData.weight,
            bmi: parseFloat(bmi.toFixed(2)),
            ap_hi: patientData.ap_hi,
            ap_lo: patientData.ap_lo,
            pulse_pressure: pulsePressure,
            bp_category: bpCategory,
            cholesterol: patientData.cholesterol,
            gluc: patientData.gluc,
            smoke: patientData.smoke,
            alco: patientData.alco,
            active: patientData.active,
            age_group: ageGroup,
            lifestyle_risk: lifestyleRisk,
            metabolic_risk: metabolicRisk,
            bmi_category: bmiCategory,
            map: parseFloat(map.toFixed(2)),
            risk_score: riskScore
        };

        const mlPayload = {
            model: selectedModel,
            inputData: mappedData
        };

        console.log('Sending to ML-API:', { model: selectedModel, inputDataKeys: Object.keys(mappedData) });
        const mlResponse = await axios.post(`${ML_API_BASE_URL}/predict`, mlPayload);
        const predictionResult = mlResponse.data;

        const diagnosisData = {
            patientId: req.body.patientId || `patient_${Date.now()}`,
            patientName: req.body.patientName || req.body.patientId || `Patient_${Date.now()}`,
            inputData: patientData,
            prediction: predictionResult.result,
            probability: predictionResult.probability,
            model: selectedModel,
            modelDisplayName: predictionResult.model_display_name,
            confidence: predictionResult.confidence,
            probabilities: predictionResult.probabilities,
            metrics: predictionResult.metrics,
            timestamp: new Date(),
            riskLevel: predictionResult.prediction
        };

        const diagnosis = new Diagnosis(diagnosisData);
        await diagnosis.save();

        const response = {
            success: true,
            diagnosisId: diagnosis._id,
            prediction: {
                result: predictionResult.result,
                riskLevel: predictionResult.prediction,
                probability: predictionResult.probability,
                confidence: predictionResult.confidence,
                probabilities: predictionResult.probabilities
            },
            modelInfo: {
                name: selectedModel,
                displayName: predictionResult.model_display_name,
                metrics: predictionResult.metrics,
                accuracy: predictionResult.metrics?.accuracy ? (predictionResult.metrics.accuracy * 100).toFixed(2) + '%' : null,
                precision: predictionResult.metrics?.precision ? (predictionResult.metrics.precision * 100).toFixed(2) + '%' : null,
                recall: predictionResult.metrics?.recall ? (predictionResult.metrics.recall * 100).toFixed(2) + '%' : null,
                f1_score: predictionResult.metrics?.f1 ? (predictionResult.metrics.f1 * 100).toFixed(2) + '%' : null,
                auc: predictionResult.metrics?.auc ? (predictionResult.metrics.auc * 100).toFixed(2) + '%' : null
            },
            timestamp: diagnosisData.timestamp
        };

        res.json(response);

    } catch (error) {
        console.error('Prediction error:', error.message);
        
        if (error.response) {
            res.status(error.response.status || 500).json({
                error: 'ML prediction failed',
                details: error.response.data?.error || error.message,
                mlApiError: true
            });
        } else if (error.code === 'ECONNREFUSED') {
            res.status(503).json({
                error: 'ML service unavailable',
                details: 'Please ensure the ML-API server is running on port 5000',
                serviceDown: true
            });
        } else {
            res.status(500).json({
                error: 'Diagnosis failed',
                details: error.message
            });
        }
    }
};

const batchPredict = async (req, res) => {
    try {
        const { patients, selectedModel = 'voting_ensemble' } = req.body;

        if (!patients || !Array.isArray(patients) || patients.length === 0) {
            return res.status(400).json({ error: 'Patients array is required' });
        }

        const predictions = [];
        const errors = [];

        for (let i = 0; i < patients.length; i++) {
            try {
                const patient = patients[i];
                const mlPayload = {
                    model: selectedModel,
                    inputData: patient.data
                };

                const mlResponse = await axios.post(`${ML_API_BASE_URL}/predict`, mlPayload);
                const predictionResult = mlResponse.data;

                predictions.push({
                    patientIndex: i,
                    patientId: patient.id || `batch_patient_${i}`,
                    prediction: predictionResult.result,
                    riskLevel: predictionResult.prediction,
                    probability: predictionResult.probability,
                    confidence: predictionResult.confidence
                });

            } catch (error) {
                errors.push({
                    patientIndex: i,
                    patientId: patients[i].id || `batch_patient_${i}`,
                    error: error.response?.data?.error || error.message
                });
            }
        }

        res.json({
            success: true,
            totalPatients: patients.length,
            successfulPredictions: predictions.length,
            failedPredictions: errors.length,
            predictions,
            errors,
            model: selectedModel
        });

    } catch (error) {
        console.error('Batch prediction error:', error.message);
        res.status(500).json({
            error: 'Batch prediction failed',
            details: error.message
        });
    }
};

const getDiagnosisHistory = async (req, res) => {
    try {
        const { patientId, limit = 50, page = 1 } = req.query;
        
        let query = {};
        if (patientId) {
            query.patientId = patientId;
        }

        const skip = (page - 1) * limit;
        
        const diagnoses = await Diagnosis.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Diagnosis.countDocuments(query);

        res.json({
            success: true,
            diagnoses,
            pagination: {
                current: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching diagnosis history:', error.message);
        res.status(500).json({
            error: 'Failed to fetch diagnosis history',
            details: error.message
        });
    }
};

const getDiagnosisById = async (req, res) => {
    try {
        const { id } = req.params;
        const diagnosis = await Diagnosis.findById(id);

        if (!diagnosis) {
            return res.status(404).json({ error: 'Diagnosis not found' });
        }

        res.json({
            success: true,
            diagnosis
        });

    } catch (error) {
        console.error('Error fetching diagnosis:', error.message);
        res.status(500).json({
            error: 'Failed to fetch diagnosis',
            details: error.message
        });
    }
};

const checkMLApiHealth = async (req, res) => {
    try {
        const response = await axios.get(`${ML_API_BASE_URL}/health`, { timeout: 5000 });
        res.json({
            mlApiStatus: 'healthy',
            mlApiData: response.data
        });
    } catch (error) {
        res.status(503).json({
            mlApiStatus: 'unhealthy',
            error: error.message,
            suggestion: 'Please ensure ML-API server is running on port 5000'
        });
    }
};

module.exports = {
    predictDiagnosis,
    batchPredict,
    getAvailableModels,
    getModelComparison,
    getModelMetrics,
    getEnsembleMetrics,
    getDiagnosisHistory,
    getDiagnosisById,
    checkMLApiHealth,
    saveDiagnosis,
    getAllDiagnosis,
    getLatestDiagnosisByPatientId,
    getLatestDiagnosisByPatientName
};