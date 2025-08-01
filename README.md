# CHD Diagnosis System 🫀

A smart web application that helps predict coronary heart disease risk using machine learning, complete with an AI chatbot for health guidance.

## What it does

- **Risk Assessment**: Upload your health data and get an instant CHD risk prediction
- **Smart Chatbot**: Ask questions about heart health and get personalized advice
- **Easy to Use**: Clean, simple interface that anyone can understand
- **Accurate Predictions**: Trained on real medical datasets with multiple ML models

## Quick Start

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
## Features

✅ **Machine Learning Models** - Random Forest and Logistic Regression  
✅ **Interactive Dashboard** - Real-time risk assessment  
✅ **AI Chatbot** - 24/7 health guidance  
✅ **Data Visualization** - Clear results and insights  
✅ **Responsive Design** - Works on all devices  

## Project Structure

```
chd-diagnosis-system/
├── backend/                    # Flask API server
│   ├── app.py                 # Main application
│   ├── models/                # ML models & chatbot logic
│   ├── routes/                # API endpoints
│   ├── utils/                 # Data processing utilities
│   └── data/                  # Dataset & trained models
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── services/          # API communication
│   │   └── styles/            # CSS styling
│   └── public/                # Static assets
├── dataset/                    # Raw & processed data
├── models/                     # Trained ML models & notebooks
├── docs/                       # Documentation
└── tests/                      # Test files
```

## Tech Stack

**Frontend**: React, CSS3  
**Backend**: Flask, Python  
**ML**: Scikit-learn, Pandas, NumPy  
**Data**: 70,000+ Patient Heart Disease Dataset  

## How to Use

1. Fill out the diagnosis form with your health parameters
2. Get instant risk assessment results
3. Chat with the AI bot for personalized advice
4. Review detailed explanations and recommendations

##Visit page:
http://192.168.0.104:3000

## Dataset

Uses a comprehensive 70,000+ patient heart disease dataset with features like:
- Age, gender, chest pain type
- Blood pressure, cholesterol levels
- Heart rate, exercise capacity
- And more clinical indicators

## Contributing

Found a bug or have an idea? Feel free to open an issue or submit a pull request!

## Disclaimer

⚠️ **Important**: This tool is for educational purposes only. Always consult with healthcare professionals for medical decisions.

---

Made with ❤️ for better heart health awareness
