# CHD Diagnosis System

This project is a **Coronary Heart Disease (CHD) Diagnosis System** that combines **Machine Learning models** and an **AI-driven chatbot** to provide health predictions, patient history tracking, and lifestyle recommendations.

## Features
- **Machine Learning Models**
  - Logistic Regression
  - Random Forest
  - XGBoost
- **AI Chatbot** for personalized responses and health advice.
- **Backend (Node.js + Express)** for handling API requests and patient data.
- **Frontend (React.js)** for user-friendly interactions and dashboards.
- **ML API (Flask/Python)** serving trained models for predictions.
- **Database Integration** for storing patient history and chatbot conversations.

---

## Project Structure
CHD-DIAGNOSIS-SYSTEM

├── backend/ # Node.js + Express server
│   ├── config/ # DB configuration
│   ├── controllers/ # Business logic
│   ├── database/ # JSON/mock database
│   ├── models/ # Mongoose models
│   ├── routes/ # Express routes
│   ├── .env # Environment variables
│   └── server.js # Entry point


├── frontend/ # React frontend
│   ├── public/ # Public assets
│   └── src/ # React components, styles, services


├── ml-api/ # Python Flask ML API
│   ├── data/ # Datasets
│   ├── models/ # Trained models + preprocessors
│   ├── utils/ # Helper functions
│   ├── app.py # Flask entry point
│   └── requirements.txt # Python dependencies


└── .vscode/ # Editor config

## Tech Stack
- **Frontend**: React.js  
- **Backend**: Node.js + Express  
- **ML API**: Python (Flask)  
- **Database**: MongoDB / JSON (for mock data)  
- **ML Models**: Logistic Regression, Random Forest, XGBoost

---

## Installation & Setup

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### ML API
```bash
cd ml-api
pip install -r requirements.txt
python app.py
```
