import optuna
import joblib
from pathlib import Path
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from models.data_processor import load_and_preprocess_data

def tune_rf(X, y):
    model_path = Path("models/rf_tuned.pkl")
    if model_path.exists():
        model = joblib.load(model_path)
        print("Loaded RF Model from file")
        return model
    def objective(trial):
        n_estimators = trial.suggest_int("n_estimators", 100, 400, step=50)
        max_depth = trial.suggest_int("max_depth", 5, 20)
        min_samples_split = trial.suggest_int("min_samples_split", 2, 10)
        min_samples_leaf = trial.suggest_int("min_samples_leaf", 1, 4)
        clf = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=min_samples_split,
            min_samples_leaf=min_samples_leaf,
            random_state=42,
            n_jobs=-1
        )
        scores = cross_val_score(clf, X, y, cv=3, scoring="accuracy")
        return scores.mean()
    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=20)
    best_params = study.best_params
    model = RandomForestClassifier(**best_params, random_state=42, n_jobs=-1)
    model.fit(X, y)
    joblib.dump(model, model_path)
    print("Best RF Params:", best_params)
    return model

def tune_xgb(X, y):
    model_path = Path("models/xgb_tuned.pkl")
    if model_path.exists():
        model = joblib.load(model_path)
        print("Loaded XGB Model from file")
        return model
    def objective(trial):
        n_estimators = trial.suggest_int("n_estimators", 100, 400, step=50)
        max_depth = trial.suggest_int("max_depth", 3, 10)
        learning_rate = trial.suggest_float("learning_rate", 0.01, 0.3, step=0.01)
        subsample = trial.suggest_float("subsample", 0.6, 1.0, step=0.1)
        colsample_bytree = trial.suggest_float("colsample_bytree", 0.6, 1.0, step=0.1)
        clf = XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=subsample,
            colsample_bytree=colsample_bytree,
            eval_metric="logloss",
            tree_method="gpu_hist",
            predictor="gpu_predictor",
            random_state=42,
            n_jobs=-1
        )
        scores = cross_val_score(clf, X, y, cv=3, scoring="accuracy")
        return scores.mean()
    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=20)
    best_params = study.best_params
    model = XGBClassifier(
        **best_params,
        eval_metric="logloss",
        tree_method="gpu_hist",
        predictor="gpu_predictor",
        random_state=42,
        n_jobs=-1
    )
    model.fit(X, y)
    joblib.dump(model, model_path)
    print("Best XGB Params:", best_params)
    return model

if __name__ == "__main__":
    X_train, X_test, y_train, y_test, scaler, features = load_and_preprocess_data(
        r"data/cardio.csv"
    )
    X_train_scaled = scaler.transform(X_train)
    best_rf = tune_rf(X_train_scaled, y_train)
    best_xgb = tune_xgb(X_train_scaled, y_train)
