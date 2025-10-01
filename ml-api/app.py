from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)
scaler = joblib.load("models/scaler.pkl")
feature_selector = joblib.load("models/feature_selector.pkl")
original_features = joblib.load("models/original_features.pkl")

MODEL_PATHS = {
    "logistic_regression": "models/logistic_regression.pkl",
    "random_forest": "models/random_forest.pkl",
    "xgboost": "models/xgboost.pkl",
    "lightgbm": "models/lightgbm.pkl",
    "catboost": "models/catboost.pkl",
    "voting_ensemble": "models/voting_ensemble.pkl",
    "stacking_model": "models/stacking_model.pkl"
}

try:
    model_metrics = joblib.load("models/model_metrics.pkl")
    print("Loaded model metrics from pickle file")
except:
    model_metrics = {
        "lr": {"accuracy": 0.7136, "auc": 0.78, "precision": 0.68, "recall": 0.64, "f1": 0.66},
        "rf": {"accuracy": 0.7130, "auc": 0.77, "precision": 0.69, "recall": 0.67, "f1": 0.68},
        "xgb": {"accuracy": 0.7319, "auc": 0.79, "precision": 0.70, "recall": 0.69, "f1": 0.695}
    }

@app.route("/models", methods=["GET"])
def get_available_models():
    try:
        available_models = {}
        for model_key, model_path in MODEL_PATHS.items():
            if os.path.exists(model_path):
                metric_key = model_key
                if model_key == "voting_ensemble":
                    metric_key = "ensemble"
                elif model_key == "stacking_model":
                    metric_key = "stacking"
                elif model_key == "logistic_regression":
                    metric_key = "lr"
                elif model_key == "random_forest":
                    metric_key = "rf"
                elif model_key == "xgboost":
                    metric_key = "xgb"
                elif model_key == "lightgbm":
                    metric_key = "lgb"
                elif model_key == "catboost":
                    metric_key = "cat"
                
                available_models[model_key] = {
                    "name": model_key.replace("_", " ").title(),
                    "path": model_path,
                    "metrics": model_metrics.get(metric_key, {}),
                    "available": True
                }
            else:
                available_models[model_key] = {
                    "name": model_key.replace("_", " ").title(),
                    "path": model_path,
                    "metrics": {},
                    "available": False
                }
        
        return jsonify({
            "models": available_models,
            "total_models": len(available_models),
            "available_count": sum(1 for m in available_models.values() if m["available"])
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
        
        if not os.path.exists(MODEL_PATHS[model_name]):
            return jsonify({"error": f"Model file not found: {MODEL_PATHS[model_name]}"}), 404
        
        try:
            model = joblib.load(MODEL_PATHS[model_name])
        except Exception as load_error:
            print(f"Model loading error: {load_error}")
            return jsonify({"error": f"Failed to load model: {load_error}"}), 500
        
        features = input_data.get("inputData", {})
        if not features:
            return jsonify({"error": "Missing 'inputData' field"}), 400
        print(f"Features received: {list(features.keys())}")
        print(f"Original features expected: {original_features}")

        input_df = pd.DataFrame([features])
        missing_cols = set(original_features) - set(input_df.columns)
        if missing_cols:
            print(f"Missing columns: {missing_cols}")
            return jsonify({"error": f"Missing input fields: {list(missing_cols)}"}), 400
        input_df = input_df[original_features]
        print(f"Input data shape: {input_df.shape}")
        print(f"Input data: {input_df.iloc[0].to_dict()}")
        scaled_input = scaler.transform(input_df)
        print(f"Scaled input shape: {scaled_input.shape}")

        try:
            from sklearn.preprocessing import PolynomialFeatures
            poly = PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)
            poly_input = poly.fit_transform(scaled_input)
            selected_input = feature_selector.transform(poly_input)
            print(f"Selected input shape: {selected_input.shape}")
        except Exception as feature_error:
            print(f"Feature transformation error: {feature_error}")
            selected_input = scaled_input
        
        prediction = model.predict(selected_input)[0]
        print(f"Prediction: {prediction}")

        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(selected_input)[0]
            probability = float(probabilities[int(prediction)])
            prob_class_0 = float(probabilities[0])
            prob_class_1 = float(probabilities[1])
            print(f"Probabilities: {probabilities}")
        else:
            probability = None
            prob_class_0 = None
            prob_class_1 = None
        
        metric_key = model_name
        if model_name == "voting_ensemble":
            metric_key = "ensemble"
        elif model_name == "stacking_model":
            metric_key = "stacking"
        elif model_name == "logistic_regression":
            metric_key = "lr"
        elif model_name == "random_forest":
            metric_key = "rf"
        elif model_name == "xgboost":
            metric_key = "xgb"
        elif model_name == "lightgbm":
            metric_key = "lgb"
        elif model_name == "catboost":
            metric_key = "cat"
        
        response_data = {
            "result": int(prediction),
            "prediction": "High Risk" if prediction == 1 else "Low Risk",
            "probability": probability,
            "probabilities": {
                "low_risk": prob_class_0,
                "high_risk": prob_class_1
            },
            "model_used": model_name,
            "model_display_name": model_name.replace("_", " ").title(),
            "metrics": model_metrics.get(metric_key, {}),
            "confidence": float(max(probabilities)) if probabilities is not None else None
        }
        print(f"Response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"PREDICTION ERROR: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/model-metrics/<model_name>", methods=["GET"])
def get_model_metrics(model_name):
    try:
        metric_key = model_name
        if model_name == "voting_ensemble":
            metric_key = "ensemble"
        elif model_name == "stacking_model":
            metric_key = "stacking"
        elif model_name == "logistic_regression":
            metric_key = "lr"
        elif model_name == "random_forest":
            metric_key = "rf"
        elif model_name == "xgboost":
            metric_key = "xgb"
        elif model_name == "lightgbm":
            metric_key = "lgb"
        elif model_name == "catboost":
            metric_key = "cat"
        
        if metric_key not in model_metrics:
            return jsonify({
                "error": f"Model metrics not found for '{model_name}'",
                "available_models": list(MODEL_PATHS.keys())
            }), 404
        
        return jsonify({
            "model": model_name,
            "display_name": model_name.replace("_", " ").title(),
            "metrics": model_metrics[metric_key]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/model-comparison", methods=["GET"])
def model_comparison():
    try:
        comparison_data = {}
        
        for model_key, model_path in MODEL_PATHS.items():
            if os.path.exists(model_path):
                metric_key = model_key
                if model_key == "voting_ensemble":
                    metric_key = "ensemble"
                elif model_key == "stacking_model":
                    metric_key = "stacking"
                elif model_key == "logistic_regression":
                    metric_key = "lr"
                elif model_key == "random_forest":
                    metric_key = "rf"
                elif model_key == "xgboost":
                    metric_key = "xgb"
                elif model_key == "lightgbm":
                    metric_key = "lgb"
                elif model_key == "catboost":
                    metric_key = "cat"
                
                comparison_data[model_key] = {
                    "name": model_key.replace("_", " ").title(),
                    "metrics": model_metrics.get(metric_key, {}),
                    "type": "Ensemble" if "ensemble" in model_key or "stacking" in model_key else "Individual"
                }        
        sorted_models = sorted(
            comparison_data.items(),
            key=lambda x: x[1]["metrics"].get("accuracy", 0),
            reverse=True
        )
        
        return jsonify({
            "comparison": dict(sorted_models),
            "best_model": sorted_models[0][0] if sorted_models else None,
            "total_models": len(comparison_data)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/test", methods=["GET", "POST"])
def test_endpoint():
    if request.method == "GET":
        available_models = [k for k, v in MODEL_PATHS.items() if os.path.exists(v)]
        return jsonify({
            "message": "Flask ML-API server is running!",
            "available_models": available_models,
            "total_models": len(available_models),
            "status": "healthy"
        })
    else:
        return jsonify({"received": request.get_json()})

@app.route("/health", methods=["GET"])
def health_check():
    try:
        required_files = ["models/scaler.pkl", "models/feature_selector.pkl", "models/original_features.pkl"]
        missing_files = [f for f in required_files if not os.path.exists(f)]
        
        available_models = [k for k, v in MODEL_PATHS.items() if os.path.exists(v)]
        
        return jsonify({
            "status": "healthy" if not missing_files else "warning",
            "available_models": available_models,
            "missing_files": missing_files,
            "total_models": len(available_models)
        })
        
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

if __name__ == "__main__":
    print("Starting CHD Diagnosis ML-API...")
    app.run(debug=True, port=5000)