"""FinShield AI - Fraud Detection ML Service"""
import pickle
import pandas as pd
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # -> services/ -> app/ -> backend/


class FraudDetector:
    """Wraps the trained XGBoost model for fraud prediction."""

    def __init__(self):
        self.model = None
        self.encoder = None
        self.feature_columns = None
        self.quantile_95 = None
        self._loaded = False

    def load(self):
        """Load all ML artifacts from disk."""
        if self._loaded:
            return

        model_path = os.path.join(BASE_DIR, "fraud_model.pkl")
        encoder_path = os.path.join(BASE_DIR, "type_encoder.pkl")
        features_path = os.path.join(BASE_DIR, "feature_columns.pkl")
        quantile_path = os.path.join(BASE_DIR, "quantile_95.pkl")

        with open(model_path, "rb") as f:
            self.model = pickle.load(f)
        with open(encoder_path, "rb") as f:
            self.encoder = pickle.load(f)
        with open(features_path, "rb") as f:
            self.feature_columns = pickle.load(f)
        with open(quantile_path, "rb") as f:
            self.quantile_95 = pickle.load(f)

        self._loaded = True
        print("[OK] ML artifacts loaded successfully")

    def predict(self, transaction: dict) -> dict:
        """
        Run fraud prediction on a single transaction.

        Args:
            transaction: dict with keys matching the PaySim schema:
                step, type, amount, oldbalanceOrg, newbalanceOrig,
                oldbalanceDest, newbalanceDest

        Returns:
            dict with fraud_probability, risk_score, classification, insights
        """
        if not self._loaded:
            self.load()

        # Keep raw values for insight generation
        raw_type = transaction.get("type", "")
        raw_amount = float(transaction.get("amount", 0))
        raw_old_bal_org = float(transaction.get("oldbalanceOrg", 0))
        raw_new_bal_org = float(transaction.get("newbalanceOrig", 0))
        raw_old_bal_dest = float(transaction.get("oldbalanceDest", 0))
        raw_new_bal_dest = float(transaction.get("newbalanceDest", 0))

        input_df = pd.DataFrame([transaction])

        # Encode transaction type (handle both 'object' and 'string' dtypes)
        if not pd.api.types.is_numeric_dtype(input_df["type"]):
            input_df["type"] = self.encoder.transform(input_df["type"])

        # Feature Engineering (mirror training pipeline)
        input_df["sender_balance_change"] = (
            input_df["oldbalanceOrg"] - input_df["newbalanceOrig"]
        )
        input_df["receiver_balance_change"] = (
            input_df["newbalanceDest"] - input_df["oldbalanceDest"]
        )
        input_df["balance_error_origin"] = (
            input_df["oldbalanceOrg"] - input_df["amount"] - input_df["newbalanceOrig"]
        )
        input_df["balance_error_destination"] = (
            input_df["oldbalanceDest"] + input_df["amount"] - input_df["newbalanceDest"]
        )
        input_df["high_amount_flag"] = (
            input_df["amount"] > self.quantile_95
        ).astype(int)
        input_df["zero_balance_anomaly"] = (
            (input_df["oldbalanceOrg"] > 0) & (input_df["newbalanceOrig"] == 0)
        ).astype(int)
        input_df["suspicious_transfer_flag"] = (
            input_df["type"].isin(self.encoder.transform(["TRANSFER", "CASH_OUT"]))
        ).astype(int)
        input_df["drain_ratio"] = (
            (input_df["oldbalanceOrg"] - input_df["newbalanceOrig"])
            / (input_df["oldbalanceOrg"] + 1)
        )
        input_df["dest_growth_ratio"] = (
            (input_df["newbalanceDest"] - input_df["oldbalanceDest"])
            / (input_df["oldbalanceDest"] + 1)
        )

        # Compute derived values for insight generation
        balance_error_origin = float(input_df["balance_error_origin"].iloc[0])
        balance_error_dest = float(input_df["balance_error_destination"].iloc[0])
        drain_ratio = float(input_df["drain_ratio"].iloc[0])
        dest_growth_ratio = float(input_df["dest_growth_ratio"].iloc[0])
        high_amount_flag = int(input_df["high_amount_flag"].iloc[0])
        zero_balance_anomaly = int(input_df["zero_balance_anomaly"].iloc[0])

        # Select features in training order
        input_df = input_df[self.feature_columns]

        # Prediction
        prob = float(self.model.predict_proba(input_df)[0][1])
        risk_score = prob * 100

        # ── Business Rules ──
        if drain_ratio > 0.95 and raw_amount > 20000:
            risk_score = max(risk_score, 50.0)

        if drain_ratio > 0.99 and raw_amount > 100000:
            risk_score = max(risk_score, 85.0)
            
        if raw_type in ["TRANSFER", "CASH_OUT"] and risk_score > 70:
            risk_score = max(risk_score, 80.0)

        # Cap score at 99.9
        risk_score = min(risk_score, 99.9)

        if risk_score >= 80:
            classification = "fraud"
        elif risk_score >= 40:
            classification = "review"
        else:
            classification = "safe"

        # ── Generate Actionable Insights ──
        insights = self._generate_insights(
            raw_type=raw_type,
            raw_amount=raw_amount,
            raw_old_bal_org=raw_old_bal_org,
            raw_new_bal_org=raw_new_bal_org,
            high_amount_flag=high_amount_flag,
            zero_balance_anomaly=zero_balance_anomaly,
            drain_ratio=drain_ratio,
            dest_growth_ratio=dest_growth_ratio,
            balance_error_origin=balance_error_origin,
            balance_error_dest=balance_error_dest,
            risk_score=risk_score,
        )

        return {
            "fraud_probability": round(prob, 4),
            "risk_score": round(risk_score, 2),
            "classification": classification,
            "insights": insights,
        }

    def _generate_insights(
        self,
        raw_type: str,
        raw_amount: float,
        raw_old_bal_org: float,
        raw_new_bal_org: float,
        high_amount_flag: int,
        zero_balance_anomaly: int,
        drain_ratio: float,
        dest_growth_ratio: float,
        balance_error_origin: float,
        balance_error_dest: float,
        risk_score: float,
    ) -> list:
        """Generate human-readable, actionable insights from computed features."""
        insights = []

        # 1. High-risk transaction type
        if raw_type in ("TRANSFER", "CASH_OUT"):
            insights.append({
                "id": "high_risk_type",
                "label": "High-Risk Transaction Type",
                "description": (
                    f"{raw_type} transactions account for ~75% of all fraud. "
                    f"Money leaves the system immediately via {raw_type}, "
                    f"making recovery difficult."
                ),
                "severity": "high",
                "category": "transaction_type",
            })

        # 2. Unusually large amount
        if high_amount_flag:
            insights.append({
                "id": "large_amount",
                "label": "Unusually Large Amount",
                "description": (
                    f"Transaction amount (${raw_amount:,.2f}) exceeds the 95th "
                    f"percentile threshold. Fraud transactions above $50,000 "
                    f"deserve extra scrutiny."
                ),
                "severity": "high",
                "category": "amount",
            })

        # 3. Account drain detected
        if zero_balance_anomaly:
            insights.append({
                "id": "account_drain",
                "label": "Account Drain Detected",
                "description": (
                    f"Sender's account was completely emptied "
                    f"(${raw_old_bal_org:,.2f} → $0.00). "
                    f"Fraudsters often drain accounts entirely to maximize "
                    f"stolen funds before detection."
                ),
                "severity": "critical",
                "category": "balance",
            })

        # 4. High drain ratio (>90% of balance moved)
        if drain_ratio > 0.9 and not zero_balance_anomaly:
            pct = drain_ratio * 100
            insights.append({
                "id": "high_drain_ratio",
                "label": "High Balance Drain Ratio",
                "description": (
                    f"{pct:.1f}% of the sender's balance was transferred in "
                    f"a single transaction. Legitimate users rarely move "
                    f"more than 90% at once."
                ),
                "severity": "high",
                "category": "balance",
            })

        # 5. Balance mismatch at origin
        if abs(balance_error_origin) > 1.0:
            insights.append({
                "id": "balance_error_origin",
                "label": "Origin Balance Mismatch",
                "description": (
                    f"The sender's balance change doesn't match the "
                    f"transaction amount (discrepancy: ${abs(balance_error_origin):,.2f}). "
                    f"This may indicate tampered records or concurrent fraud."
                ),
                "severity": "medium",
                "category": "balance",
            })

        # 6. Balance mismatch at destination
        if abs(balance_error_dest) > 1.0:
            insights.append({
                "id": "balance_error_dest",
                "label": "Destination Balance Mismatch",
                "description": (
                    f"The receiver's balance change doesn't match the "
                    f"transaction amount (discrepancy: ${abs(balance_error_dest):,.2f}). "
                    f"Possible money laundering or layered fraud scheme."
                ),
                "severity": "medium",
                "category": "balance",
            })

        # 7. Unusual receiver growth
        if dest_growth_ratio > 5.0:
            insights.append({
                "id": "unusual_receiver_growth",
                "label": "Unusual Receiver Account Growth",
                "description": (
                    f"The receiver's balance grew by {dest_growth_ratio:.1f}x "
                    f"in this single transaction. This pattern is common in "
                    f"mule accounts used for money laundering."
                ),
                "severity": "medium",
                "category": "balance",
            })

        return insights


# Singleton instance
fraud_detector = FraudDetector()
