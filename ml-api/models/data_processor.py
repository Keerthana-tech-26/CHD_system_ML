import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

def remove_outliers(df, columns):
    df_clean = df.copy()
    for col in columns:
        if col in df_clean.columns:
            Q1 = df_clean[col].quantile(0.25)
            Q3 = df_clean[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df_clean = df_clean[(df_clean[col] >= lower_bound) & (df_clean[col] <= upper_bound)]
    return df_clean

def engineer_features(df):
    df['bmi'] = df['weight'] / ((df['height'] / 100) ** 2)
    df['pulse_pressure'] = df['ap_hi'] - df['ap_lo']
    df['age_years'] = df['age'] / 365.25  
    df['age_group'] = pd.cut(
        df['age_years'],
        bins=[0, 40, 50, 60, 70, 100],
        labels=[1, 2, 3, 4, 5]
    ).astype(int)
    df['lifestyle_risk'] = df['smoke'] + df['alco'] + (1 - df['active'])
    df['metabolic_risk'] = (df['cholesterol'] - 1) + (df['gluc'] - 1)
    df['bp_category'] = 0
    df.loc[(df['ap_hi'] >= 140) | (df['ap_lo'] >= 90), 'bp_category'] = 2
    df.loc[(df['ap_hi'].between(120, 139)) | (df['ap_lo'].between(80, 89)), 'bp_category'] = 1
    def bmi_category(bmi):
        if bmi < 18.5:
            return 0
        elif bmi < 25:
            return 1
        elif bmi < 30:
            return 2
        else:
            return 3
    df['bmi_category'] = df['bmi'].apply(bmi_category)
    df['map'] = (df['ap_hi'] + 2 * df['ap_lo']) / 3
    df['risk_score'] = (
        df['smoke'] + df['alco'] +
        (df['cholesterol'] > 1).astype(int) +
        (df['gluc'] > 1).astype(int)
    )
    return df

def load_and_preprocess_data(filepath, test_size=0.2, random_state=42):
    df = pd.read_csv(filepath, sep=";")
    if 'id' in df.columns:
        df = df.drop(columns=["id"])
    if "cardio" in df.columns:
        df.rename(columns={"cardio": "target"}, inplace=True)
    df = engineer_features(df)
    outlier_cols = ['age', 'height', 'weight', 'ap_hi', 'ap_lo', 'bmi', 'pulse_pressure']
    df = remove_outliers(df, outlier_cols)
    feature_columns = [
        'age_years', 'gender', 'height', 'weight', 'bmi',
        'ap_hi', 'ap_lo', 'pulse_pressure', 'bp_category',
        'cholesterol', 'gluc', 'smoke', 'alco', 'active',
        'age_group', 'lifestyle_risk', 'metabolic_risk','bmi_category', 'map', 'risk_score'
    ]
    available_features = [col for col in feature_columns if col in df.columns]

    X = df[available_features]
    y = df["target"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    scaler = StandardScaler()
    scaler.fit(X_train)

    return X_train, X_test, y_train, y_test, scaler, available_features
