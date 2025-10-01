import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier, StackingClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import accuracy_score, roc_auc_score, precision_score, recall_score, f1_score
from sklearn.feature_selection import SelectFromModel
from imblearn.combine import SMOTETomek
import joblib
import os
import warnings
import optuna
from models.data_processor import load_and_preprocess_data
from .data_processor import load_and_preprocess_data


warnings.filterwarnings('ignore')

def tune_rf(X, y, n_trials=100):
    def objective(trial):
        clf = RandomForestClassifier(
            n_estimators=trial.suggest_int("n_estimators", 100, 600, step=50),
            max_depth=trial.suggest_int("max_depth", 5, 20),
            min_samples_split=trial.suggest_int("min_samples_split", 2, 15),
            min_samples_leaf=trial.suggest_int("min_samples_leaf", 1, 6),
            random_state=42,
            n_jobs=-1
        )
        return cross_val_score(clf, X, y, cv=3, scoring="roc_auc").mean()
    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials)
    return RandomForestClassifier(**study.best_params, random_state=42, n_jobs=-1)

def tune_xgb(X, y, n_trials=100):
    def objective(trial):
        clf = XGBClassifier(
            n_estimators=trial.suggest_int("n_estimators", 100, 600, step=50),
            max_depth=trial.suggest_int("max_depth", 3, 12),
            learning_rate=trial.suggest_float("learning_rate", 0.01, 0.3),
            subsample=trial.suggest_float("subsample", 0.6, 1.0),
            colsample_bytree=trial.suggest_float("colsample_bytree", 0.6, 1.0),
            eval_metric="logloss",
            tree_method="gpu_hist",
            predictor="gpu_predictor",
            random_state=42,
            n_jobs=-1
        )
        return cross_val_score(clf, X, y, cv=3, scoring="roc_auc").mean()
    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials)
    return XGBClassifier(**study.best_params, eval_metric="logloss", tree_method="gpu_hist", predictor="gpu_predictor", random_state=42, n_jobs=-1)

def tune_lgbm(X, y, n_trials=100):
    def objective(trial):
        params = {
            'num_leaves': trial.suggest_int('num_leaves', 20, 150),
            'max_depth': trial.suggest_int('max_depth', 3, 12),
            'learning_rate': trial.suggest_loguniform('learning_rate', 1e-3, 0.3),
            'n_estimators': trial.suggest_int('n_estimators', 100, 1000, step=50),
            'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
            'subsample': trial.suggest_float('subsample', 0.5, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
            'reg_alpha': trial.suggest_float('reg_alpha', 0.0, 1.0),
            'reg_lambda': trial.suggest_float('reg_lambda', 0.0, 1.0),
            'device': 'gpu'
        }
        clf = LGBMClassifier(**params, random_state=42, n_jobs=-1)
        return cross_val_score(clf, X, y, cv=3, scoring='roc_auc').mean()
    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=n_trials)
    return LGBMClassifier(**study.best_params, random_state=42, n_jobs=-1, device='gpu')

def tune_catboost(X, y, n_trials=100):
    def objective(trial):
        params = {
            'iterations': trial.suggest_int('iterations', 200, 600, step=100),
            'depth': trial.suggest_int('depth', 3, 10),
            'learning_rate': trial.suggest_loguniform('learning_rate', 1e-3, 0.3),
            'l2_leaf_reg': trial.suggest_float('l2_leaf_reg', 1.0, 10.0),
            'border_count': trial.suggest_int('border_count', 32, 255),
            'task_type': 'GPU',
            'devices': '0'
        }
        clf = CatBoostClassifier(**params, verbose=0, random_seed=42)
        return cross_val_score(clf, X, y, cv=3, scoring='roc_auc', n_jobs=1).mean()

    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=n_trials)
    return CatBoostClassifier(**study.best_params, verbose=0, random_state=42, task_type='GPU', devices='0')

def evaluate_model(model, X_test, y_test, model_name):
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_test)[:, 1]
    else:
        probs = model.decision_function(X_test)
    preds = (probs >= 0.5).astype(int)
    acc = accuracy_score(y_test, preds)
    auc = roc_auc_score(y_test, probs)
    prec = precision_score(y_test, preds)
    rec = recall_score(y_test, preds)
    f1 = f1_score(y_test, preds)
    print(f"{model_name}: Acc={acc:.4f}, AUC={auc:.4f}, Precision={prec:.4f}, Recall={rec:.4f}, F1={f1:.4f}")
    return {"accuracy": acc, "auc": auc, "precision": prec, "recall": rec, "f1": f1}

def load_or_train(path, train_fn, X, y):
    if os.path.exists(path):
        print(f"Loading {path}")
        return joblib.load(path)
    print(f"Training and saving {path}")
    model = train_fn(X, y)
    model.fit(X, y)
    joblib.dump(model, path)
    return model

def train_and_save_models():
    X_train, X_test, y_train, y_test, scaler, feature_columns = load_and_preprocess_data("data/cardio.csv")
    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    smt = SMOTETomek(random_state=42)
    X_train_balanced, y_train_balanced = smt.fit_resample(X_train_scaled, y_train)
    poly = PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)
    X_train_poly = poly.fit_transform(X_train_balanced)
    X_test_poly = poly.transform(X_test_scaled)
    feature_selector_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    feature_selector_model.fit(X_train_poly, y_train_balanced)
    selector = SelectFromModel(feature_selector_model, prefit=True, threshold="median")
    X_train_selected = selector.transform(X_train_poly)
    X_test_selected = selector.transform(X_test_poly)
    os.makedirs("models", exist_ok=True)
    rf = load_or_train("models/random_forest.pkl", tune_rf, X_train_selected, y_train_balanced)
    xgb = load_or_train("models/xgboost.pkl", tune_xgb, X_train_selected, y_train_balanced)
    lgb = load_or_train("models/lightgbm.pkl", tune_lgbm, X_train_selected, y_train_balanced)
    cat = load_or_train("models/catboost.pkl", tune_catboost, X_train_selected, y_train_balanced)
    if os.path.exists("models/logistic_regression.pkl"):
        print("Loading models/logistic_regression.pkl")
        lr = joblib.load("models/logistic_regression.pkl")
    else:
        print("Training and saving models/logistic_regression.pkl")
        lr = LogisticRegression(max_iter=2000, C=0.1, penalty='l2', solver='liblinear', random_state=42)
        lr.fit(X_train_selected, y_train_balanced)
        joblib.dump(lr, "models/logistic_regression.pkl")
    models = {'lr': lr, 'rf': rf, 'xgb': xgb, 'lgb': lgb, 'cat': cat}
    model_metrics = {}
    for name, model in models.items():
        metrics = evaluate_model(model, X_test_selected, y_test, name)
        model_metrics[name] = metrics
    if os.path.exists("models/voting_ensemble.pkl"):
        print("Loading models/voting_ensemble.pkl")
        voting = joblib.load("models/voting_ensemble.pkl")
    else:
        print("Training and saving models/voting_ensemble.pkl")
        estimators = [(name, model) for name, model in models.items()]
        voting = VotingClassifier(estimators=estimators, voting='soft')
        voting.fit(X_train_selected, y_train_balanced)
        joblib.dump(voting, "models/voting_ensemble.pkl")
    ensemble_metrics = evaluate_model(voting, X_test_selected, y_test, "Voting Ensemble")
    if os.path.exists("models/stacking_model.pkl"):
        print("Loading models/stacking_model.pkl")
        stack_clf = joblib.load("models/stacking_model.pkl")
    else:
        print("Training and saving models/stacking_model.pkl")
        estimators = [(name, model) for name, model in models.items()]
        stack_clf = StackingClassifier(estimators=estimators, final_estimator=LogisticRegression(max_iter=2000), cv=5, n_jobs=1)
        stack_clf.fit(X_train_selected, y_train_balanced)
        joblib.dump(stack_clf, "models/stacking_model.pkl")
    stacking_metrics = evaluate_model(stack_clf, X_test_selected, y_test, "Stacking Ensemble")
    joblib.dump(scaler, "models/scaler.pkl")
    joblib.dump(selector, "models/feature_selector.pkl")
    joblib.dump(feature_columns, "models/original_features.pkl")
    joblib.dump([poly.get_feature_names_out(feature_columns)[i] for i in selector.get_support(indices=True)], "models/selected_features.pkl")
    all_metrics = {**model_metrics, "ensemble": ensemble_metrics, "stacking": stacking_metrics}
    joblib.dump(all_metrics, "models/model_metrics.pkl")
    return all_metrics

if __name__ == "__main__":
    metrics = train_and_save_models()
    print("\nFINAL RESULTS SUMMARY:")
    print("=" * 50)
    for model_name, metric in metrics.items():
        print(f"{model_name.upper()}: Acc={metric['accuracy']:.4f}, AUC={metric['auc']:.4f}, Recall={metric['recall']:.4f}")
