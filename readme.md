# CHD Diagnosis System

AI-powered system for **Coronary Heart Disease (CHD) risk prediction**, patient history tracking, and personalized health advice using ML models and chatbot support.

---

## Features
- Multiple ML models for accurate CHD prediction
- AI Chatbot for health queries
- Patient history & diagnosis records
- React frontend + Node.js backend + Flask ML API
- MongoDB/JSON for storage

---

## Project Structure

CHD-DIAGNOSIS-AIML/
│
├── backend/ # Node.js + Express API
│ ├── config/
│ ├── controllers/
│ ├── database/
│ ├── models/
│ ├── routes/
│
├── frontend/ # React.js UI
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ ├── services/
│ │ ├── styles/
│ │ ├── utils/
│
├── ml-api/ # Python Flask ML API
│ ├── catboost_info/
│ ├── data/
│ ├── models/
│
├── env/ # Python virtual environment
└── .vscode/ # VS Code settings

---

## 🛠 Tech Stack
| Component   | Technology |
|-------------|------------|
| Frontend    | React.js   |
| Backend     | Node.js + Express |
| ML API      | Python + Flask |
| Database    | MongoDB + JSON |
| ML Libs     | Scikit-learn, XGBoost, LightGBM, CatBoost |
| Chatbot     | Google Gemini API |

---

## ML Models Overview
| Model               | Use Case |
|----------------------|----------|
| Logistic Regression  | Baseline predictions |
| Random Forest        | Robust classification |
| XGBoost             | High performance boosting |
| LightGBM            | Fast gradient boosting |
| CatBoost            | Handles categorical features |
| Stacking Ensemble   | Meta-learner combining models |
| Voting Ensemble     | Majority consensus |

---

## Quick Start
```bash
# Backend
cd backend && npm install && npm start  # Runs on http://localhost:5000

# Frontend
cd frontend && npm install && npm start # Runs on http://localhost:3000

# ML API
cd ml-api
pip install -r requirements.txt
python app.py                           # Runs on http://localhost:5001
