from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
from data_processor import load_and_preprocess_data
import joblib
import os

X_train_raw, X_test_raw, y_train, y_test, scaler = load_and_preprocess_data("data/cardio.csv")

os.makedirs("models", exist_ok=True)
joblib.dump(X_train_raw.columns.tolist(), "models/model_features.pkl")

X_train = scaler.transform(X_train_raw)
X_test = scaler.transform(X_test_raw)

models = {
    "logistic_regression": LogisticRegression(max_iter=1000),
    "random_forest": RandomForestClassifier(n_estimators=100, random_state=42),
    "xgboost": XGBClassifier(eval_metric='logloss', random_state=42)
}


for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    joblib.dump(model, f"models/{name}.pkl")

joblib.dump(scaler, "models/scaler.pkl")