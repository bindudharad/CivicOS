"""
Predictive Intelligence & Machine Learning Engine
-------------------------------------------------
Feature Addressed:
- Feature 3: Predictive Intelligence

Trains and serves a Scikit-learn classification model to forecast
the likelihood of an urban incident cascading into secondary failures.
Includes:
- Rigorous data leakage prevention (excludes priority and parent-child outcomes).
- One-hot encoding of categorical municipal attributes (incident_type, category, zone).
- Genuine test evaluation metrics (Accuracy, Precision, Recall, F1, Confusion Matrix).
- Gini feature importance extraction.
- Probability inference & risk tiering.
"""

from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix


# ===========================================================================
# FEATURE DEFINITIONS & DATA LEAKAGE CONTROLS
# ===========================================================================

# Genuine input predictor features available at the moment an incident is reported
NUMERICAL_FEATURES = [
    "severity_score",
    "impact_radius_meters",
    "affected_population",
    "rainfall_mm",
    "wind_speed_kmh",
    "temperature_c",
]

CATEGORICAL_FEATURES = [
    "incident_type",
    "category",
    "zone",
]

TARGET_COLUMN = "cascading_risk_flag"

# Explicitly excluded columns to prevent data leakage:
EXCLUDED_LEAKAGE_COLUMNS = [
    "incident_id",              # Identifier
    "timestamp",                # Non-generalizable time string
    "parent_incident_id",       # Directly encodes downstream consequence
    "priority_score",           # Downstream calculated metric that used cascading flag
    "prevention_impact_score",  # Downstream calculated metric
    "status",                   # Lifecycle resolution state
    "recommended_action",       # Prescriptive text
    "ward",                     # High-cardinality label (zone provides generalization)
]


class PredictiveRiskEngine:
    """
    Scikit-learn powered machine learning classification engine for urban risk prediction.
    """

    def __init__(self):
        self.is_trained: bool = False
        self.model: Optional[RandomForestClassifier] = None
        self.feature_names: List[str] = []
        self.metrics: Dict[str, Any] = {}
        self.feature_importances: List[Dict[str, Any]] = []
        self.training_summary: Dict[str, Any] = {}

    def _prepare_training_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepares training feature matrix (X) and target vector (y) with one-hot encoding.
        """
        clean_df = df.copy()

        # Ensure target column exists
        if TARGET_COLUMN not in clean_df.columns:
            raise ValueError(f"Target column '{TARGET_COLUMN}' not found in DataFrame.")

        y = clean_df[TARGET_COLUMN].astype(int)

        # Select valid feature columns
        available_num = [c for c in NUMERICAL_FEATURES if c in clean_df.columns]
        available_cat = [c for c in CATEGORICAL_FEATURES if c in clean_df.columns]

        # Fill missing values
        num_df = clean_df[available_num].fillna(clean_df[available_num].median())
        cat_df = clean_df[available_cat].fillna("Unknown")

        # One-Hot Encoding for categorical features
        cat_encoded = pd.get_dummies(cat_df, drop_first=False, dtype=float)

        # Combine numerical and encoded categorical features
        X = pd.concat([num_df, cat_encoded], axis=1)
        return X, y

    def train(self, df: pd.DataFrame, test_size: float = 0.25, random_state: int = 42) -> Dict[str, Any]:
        """
        Train a Random Forest classifier to predict cascading risk flag (0 or 1).
        
        Args:
            df: Incidents dataset
            test_size: Proportion of dataset to hold out for evaluation (default: 25%)
            random_state: Reproducible seed
            
        Returns:
            Dictionary containing genuine model performance metrics
        """
        X, y = self._prepare_training_data(df)
        self.feature_names = list(X.columns)

        # Stratified train/test split to preserve target ratio
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=random_state,
            stratify=y
        )

        # Train Random Forest with regularization to avoid overfitting
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=random_state
        )
        self.model.fit(X_train, y_train)
        self.is_trained = True

        # Evaluate strictly on the hold-out test set
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))

        # Confusion Matrix [ [TN, FP], [FN, TP] ]
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])

        # Extract Gini feature importances
        raw_importances = self.model.feature_importances_
        importance_list = [
            {"feature": feat, "importance": round(float(imp), 4)}
            for feat, imp in zip(self.feature_names, raw_importances)
        ]
        importance_list.sort(key=lambda x: x["importance"], reverse=True)
        self.feature_importances = importance_list

        self.metrics = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": {
                "true_negatives": tn,
                "false_positives": fp,
                "false_negatives": fn,
                "true_positives": tp,
                "matrix": cm.tolist()
            },
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "target_distribution_train": {int(k): int(v) for k, v in pd.Series(y_train).value_counts().items()},
            "target_distribution_test": {int(k): int(v) for k, v in pd.Series(y_test).value_counts().items()}
        }

        self.training_summary = {
            "algorithm": "RandomForestClassifier(n_estimators=100, max_depth=5)",
            "total_records": len(df),
            "train_size": len(X_train),
            "test_size": len(X_test),
            "input_features_count": len(self.feature_names),
            "leakage_safeguards": "Strictly excluded priority_score, parent_id, prevention_score",
            "metrics": self.metrics,
            "top_features": self.feature_importances[:6]
        }

        return self.training_summary

    def predict(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict cascading failure probability for a single incident profile.
        
        Args:
            incident_data: Dictionary containing incident attributes
            
        Returns:
            Dictionary with prediction class, probability, risk tier, and top influencing factors
        """
        if not self.is_trained or self.model is None:
            raise RuntimeError("Model is not trained. Call train(df) first.")

        # Create 1-row DataFrame aligned with training columns
        input_row = pd.DataFrame([incident_data])
        
        # Prepare numeric
        row_features = {}
        for num_col in NUMERICAL_FEATURES:
            val = float(input_row.get(num_col, pd.Series([0.0])).iloc[0])
            row_features[num_col] = val

        # Prepare categorical One-Hot alignment
        for feat in self.feature_names:
            if feat in NUMERICAL_FEATURES:
                continue
            # Parse categorical match: e.g. "incident_type_Flooding / Waterlogging"
            parts = feat.split("_", 1)
            cat_name = parts[0]
            cat_val = parts[1] if len(parts) > 1 else ""

            actual_val = str(incident_data.get(cat_name, "")).strip()
            row_features[feat] = 1.0 if actual_val == cat_val else 0.0

        # DataFrame in exact column order as training
        X_single = pd.DataFrame([row_features])[self.feature_names]

        # Predict probability
        prob = float(self.model.predict_proba(X_single)[0, 1])
        prediction = int(prob >= 0.50)

        # Risk tiering
        if prob >= 0.75:
            risk_tier = "CRITICAL CASCADE RISK"
            color = "#DC2626"
            recommendation = "Immediate multi-agency emergency intervention required to arrest cascade."
        elif prob >= 0.50:
            risk_tier = "HIGH CASCADE RISK"
            color = "#EA580C"
            recommendation = "Deploy proactive zonal barricading and rapid containment squads."
        elif prob >= 0.30:
            risk_tier = "MODERATE PROPAGATION RISK"
            color = "#0284C7"
            recommendation = "Standard dispatch protocol with monitoring of nearby infrastructure."
        else:
            risk_tier = "LOW PROPAGATION RISK"
            color = "#10B981"
            recommendation = "Isolated incident with minimal probability of secondary failure."

        # Top factors contributing based on global model feature weights and input values
        active_factors = []
        for item in self.feature_importances[:5]:
            fname = item["feature"]
            active_factors.append({
                "factor": fname,
                "importance_weight": item["importance"],
                "input_value": row_features.get(fname, 0.0)
            })

        return {
            "cascading_risk_prediction": prediction,
            "cascading_probability": round(prob, 4),
            "risk_percentage": round(prob * 100, 1),
            "risk_tier": risk_tier,
            "tier_color": color,
            "recommended_stance": recommendation,
            "influencing_features": active_factors,
            "model_metadata": {
                "algorithm": "Random Forest Classifier",
                "test_accuracy": self.metrics.get("accuracy"),
                "test_f1": self.metrics.get("f1_score")
            }
        }
