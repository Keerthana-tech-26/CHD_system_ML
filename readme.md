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

## 📂 Project Structure

CHD-DIAGNOSIS-AI-ML/
│
├── backend/                      # Node.js + Express API
│   ├── config/
│   ├── controllers/
│   ├── database/
│   ├── models/
│   ├── routes/
│   ├── .env                     # Environment variables
│   ├── migrate-chats.js         # Chat migration script
│   ├── requirement.txt          # Backend dependencies
│   ├── package.json
│   └── server.js                # Entry point
│
├── frontend/                     # React.js UI
│   ├── node_modules/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── App.test.js
│   │   ├── index.css
│   │   ├── index.js
│   │   └── setupTests.js
│   ├── res.json()               # Response helper
│   ├── setMetrics(data)         # Metrics setter
│   ├── package.json
│   └── package-lock.json
│
├── ml-api/
│   ├── catboost_info/
│   ├── data/
│   ├── models/
│   ├── app.py                   # Flask API server
│   ├── requirements.txt         # Python dependencies
│
├── env/                         # Python virtual environment

└── .vscode/                     # VS Code settings

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
