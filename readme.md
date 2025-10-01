# CHD Diagnosis System

A comprehensive Coronary Heart Disease (CHD) Diagnosis System powered by advanced Machine Learning models and AI-driven chatbot for personalized health predictions, patient history tracking, and lifestyle recommendations.

## Features

### Machine Learning Models
- Logistic Regression - Baseline statistical model
- Random Forest - Ensemble tree-based classifier
- XGBoost - Gradient boosting algorithm
- LightGBM - Fast gradient boosting framework
- CatBoost - Categorical feature handling
- Stacking Ensemble - Meta-learning approach combining multiple models
- Voting Ensemble - Combined predictions through majority voting

### Application Features
- AI Chatbot for personalized health advice and queries
- Multiple ML Models for accurate CHD risk prediction
- Patient History Tracking with diagnosis records
- Feature Selection and Engineering for optimal performance
- Hyperparameter Tuning for model optimization
- Database Integration for persistent data storage
- Chat Migration Tool for data management

---

## Project Structure

```
CHD-DIAGNOSIS-WITH-ML-DUP/
│
├── backend/                      # Node.js + Express API
│   ├── config/
│   │   └── db.js                # Database configuration
│   ├── controllers/
│   │   ├── chatbotController.js # Chatbot logic
│   │   ├── diagnosisController.js # Diagnosis handling
│   │   └── patientController.js # Patient management
│   ├── database/
│   │   └── diagnoses.json       # Diagnosis records
│   ├── models/
│   │   ├── Chat.js              # Chat schema
│   │   └── Diagnosis.js         # Diagnosis schema
│   ├── routes/
│   │   ├── chatbot.js           # Chatbot routes
│   │   ├── diagnosis.js         # Diagnosis routes
│   │   └── patients.js          # Patient routes
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
│   │   │   ├── Chatbot.js
│   │   │   ├── DiagnosisForm.js
│   │   │   ├── Navigation.js
│   │   │   ├── PatientHistory.js
│   │   │   └── ResultsDisplay.js
│   │   ├── services/
│   │   │   └── api.js           # API integration
│   │   ├── styles/
│   │   │   ├── Chatbot.css
│   │   │   ├── DiagnosisForm.css
│   │   │   ├── globals.css
│   │   │   ├── PatientHistory.css
│   │   │   └── ResultsDisplay.css
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
├── ml-api/                       # Python Flask ML API
│   ├── __pycache__/
│   ├── catboost_info/           # CatBoost training logs
│   │   └── learn/
│   ├── data/
│   │   └── cardio.csv           # Training dataset
│   ├── models/                  # Trained ML models
│   │   ├── __pycache__/
│   │   ├── __init__.py
│   │   ├── catboost.pkl
│   │   ├── chd_model.py         # Model definitions
│   │   ├── data_processor.py    # Data preprocessing
│   │   ├── feature_selector.pkl
│   │   ├── hyperparameter_tuning.py
│   │   ├── lightgbm.pkl
│   │   ├── logistic_regression.pkl
│   │   ├── model_metrics.pkl
│   │   ├── original_features.pkl
│   │   ├── random_forest.pkl
│   │   ├── scaler.pkl
│   │   ├── selected_features.pkl
│   │   ├── stacking_model.pkl   # Ensemble model
│   │   ├── voting_ensemble.pkl  # Voting ensemble
│   │   └── xgboost.pkl
│   ├── app.py                   # Flask API server
│   ├── .gitignore
│   ├── requirements.txt         # Python dependencies
│   ├── package.json
│   └── package-lock.json
│
├── env/                         # Python virtual environment
└── .vscode/                     # VS Code settings
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

## Installation and Setup

### Prerequisites
- Node.js version 14 or higher
- Python version 3.8 or higher
- MongoDB optional, if using MongoDB
- pip Python package manager

### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd CHD-DIAGNOSIS-WITH-ML-DUP
```

### Step 2: Backend Setup
```bash
cd backend
npm install
npm start
```

Backend runs on: http://localhost:5000

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:3000

### Step 4: ML API Setup
```bash
cd ml-api

python -m venv env

env\Scripts\activate
source env/bin/activate

pip install -r requirements.txt

python app.py
```
ML API runs on: http://localhost:5001

---

## Environment Variables

Create a .env file in the backend directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

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

### Additional ML Components
- Feature Selector (feature_selector.pkl) - Optimal feature selection
- Scaler (scaler.pkl) - Data normalization
- Model Metrics (model_metrics.pkl) - Performance tracking
- Hyperparameter Tuning (hyperparameter_tuning.py) - Model optimization

---

## Usage

1. Start Backend Server
   ```bash
   cd backend && npm start
   ```

2. Start Frontend
   ```bash
   cd frontend && npm start
   ```

3. Start ML API
   ```bash
   cd ml-api && python app.py
   ```

## API Endpoints

### Diagnosis API
- POST /api/diagnosis/predict - Get CHD risk prediction from all models
- GET /api/diagnosis/history/:patientId - Retrieve patient diagnosis history
- GET /api/diagnosis/:id - Get specific diagnosis

### Patient API
- GET /api/patients - Get all patients
- POST /api/patients - Create new patient record
- GET /api/patients/:id - Get patient by ID
- PUT /api/patients/:id - Update patient information

### Chatbot API
- POST /api/chatbot/chat - Send message to AI chatbot
- GET /api/chatbot/history/:patientId - Get chat conversation history
- DELETE /api/chatbot/clear/:patientId - Clear chat history

---

## Data Migration

Use the chat migration script to migrate chat data:

```bash
cd backend
node migrate-chats.js
```

---

## Model Performance

All models are evaluated and compared based on:
- Accuracy - Overall correctness
- Precision - True positive rate
- Recall - Sensitivity
- F1-Score - Harmonic mean
- ROC-AUC - Area under curve

Performance metrics are stored in model_metrics.pkl.

---