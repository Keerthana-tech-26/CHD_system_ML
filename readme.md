# CHD Diagnosis System

A comprehensive Coronary Heart Disease (CHD) Diagnosis System powered by advanced Machine Learning models and AI-driven chatbot for personalized health predictions, patient history tracking, and lifestyle recommendations.

---

## Project Structure

```
CHD-DIAGNOSIS-AIML/
│
├── backend/                    # Node.js + Express API
│   ├── config/
│   ├── controllers/
│   ├── database/
│   ├── models/
│   ├── routes/
│
├── frontend/                   # React.js UI
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│
├── ml-api/                     # Python Flask ML API
│   ├── catboost_info/
│   ├── data/
│   ├── models/
│
├── env/                        # Python virtual environment
└── .vscode/                    # VS Code settings
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React.js |
| Backend | Node.js + Express.js |
| ML API | Python + Flask |
| Database | MongoDB + JSON |
| ML Libraries | Scikit-learn, XGBoost, LightGBM, CatBoost |
| AI Chatbot | Google Gemini API |

---

## ML Models Overview

| Model | File | Type | Use Case |
|-------|------|------|----------|
| Logistic Regression | logistic_regression.pkl | Linear Model | Baseline predictions |
| Random Forest | random_forest.pkl | Ensemble | Robust classification |
| XGBoost | xgboost.pkl | Gradient Boosting | High performance |
| LightGBM | lightgbm.pkl | Gradient Boosting | Fast training |
| CatBoost | catboost.pkl | Gradient Boosting | Categorical features |
| Stacking Ensemble | stacking_model.pkl | Meta-Learner | Combined predictions |
| Voting Ensemble | voting_ensemble.pkl | Hard/Soft Voting | Majority consensus |

## Model Performance

All models are evaluated and compared based on:
- Accuracy - Overall correctness
- Precision - True positive rate
- Recall - Sensitivity
- F1-Score - Harmonic mean
- ROC-AUC - Area under curve

Performance metrics are stored in model_metrics.pkl.

---
