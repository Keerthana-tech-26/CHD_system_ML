from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import traceback
import json

app = Flask(__name__)
CORS(app)

scaler = joblib.load("models/scaler.pkl")
model_features = joblib.load("models/model_features.pkl")

MODEL_PATHS = {
    "logistic_regression": "models/logistic_regression.pkl",
    "random_forest": "models/random_forest.pkl",
    "xgboost": "models/xgboost.pkl"
}

MODEL_METRICS = {
    "logistic_regression": {
        "accuracy": 0.7136,
        "precision": {"0": 0.75, "1": 0.68},
        "recall": {"0": 0.78, "1": 0.64},
        "f1_score": {"0": 0.76, "1": 0.66}
    },
    "random_forest": {
        "accuracy": 0.7130,
        "precision": {"0": 0.74, "1": 0.69},
        "recall": {"0": 0.75, "1": 0.67},
        "f1_score": {"0": 0.74, "1": 0.68}
    },
    "xgboost": {
        "accuracy": 0.7319,
        "precision": {"0": 0.76, "1": 0.70},
        "recall": {"0": 0.77, "1": 0.69},
        "f1_score": {"0": 0.76, "1": 0.695}
    }
}

@app.route("/predict", methods=["POST"])
def predict():
    try:
        input_data = request.get_json()
        
        if not input_data or "model" not in input_data:
            return jsonify({"error": "Missing input data or model field."}), 400
        
        model_name = input_data.get("model", "").strip()
        
        if not model_name:
            return jsonify({"error": "Model name is empty"}), 400
        
        if model_name not in MODEL_PATHS:
            return jsonify({"error": f"Invalid model name: '{model_name}'. Choose from {list(MODEL_PATHS.keys())}"}), 400
        
        model_path = MODEL_PATHS[model_name]
        
        try:
            model = joblib.load(model_path)
        except Exception as load_error:
            return jsonify({"error": f"Failed to load model: {load_error}"}), 500
        
        features = input_data.get("inputData", {})
        if not features:
            return jsonify({"error": "Missing 'inputData' field"}), 400
        
        input_df = pd.DataFrame([features])
        missing_cols = set(model_features) - set(input_df.columns)
        if missing_cols:
            return jsonify({"error": f"Missing input fields: {missing_cols}"}), 400
        
        input_df = input_df[model_features]
        scaled_input = scaler.transform(input_df)
        prediction = model.predict(scaled_input)[0]
        probability = model.predict_proba(scaled_input)[0][prediction]
        
        metrics = MODEL_METRICS.get(model_name, {})
        
        response_data = {
            "result": int(prediction),
            "probability": float(probability),
            "model_used": model_name,
            "model": model_name,
            "metrics": metrics
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/test", methods=["GET", "POST"])
def test_endpoint():
    if request.method == "GET":
        return jsonify({
            "message": "Flask server is running!",
            "available_models": list(MODEL_PATHS.keys())
        })
    else:
        data = request.get_json()
        return jsonify({"received": data})

if __name__ == "__main__":
    app.run(debug=True, port=5000)