import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
def load_and_preprocess_data(filepath):
    df = pd.read_csv(filepath, sep=";")
    if 'id' in df.columns:
        df = df.drop(columns=["id"])
    if "cardio" in df.columns:
        df.rename(columns={"cardio": "target"}, inplace=True)

    X = df.drop("target", axis=1)
    y = df["target"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    scaler = StandardScaler()
    scaler.fit(X_train)

    return X_train, X_test, y_train, y_test, scaler