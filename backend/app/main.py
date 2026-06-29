"""FinShield AI - Main FastAPI Application"""
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"), override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import random
import uuid
from datetime import datetime, timedelta, timezone
import json

from app.database import init_db, async_session
from app.models import User, Transaction, FraudPrediction, Alert, AuditLog
from app.services.fraud_detection import fraud_detector


COUNTRIES = [
    "United States", "United Kingdom", "Germany", "France", "India",
    "Brazil", "Nigeria", "Russia", "China", "Japan",
    "Canada", "Australia", "South Africa", "Mexico", "Singapore",
    "United Arab Emirates", "Netherlands", "Italy", "Spain", "South Korea",
]

DEVICE_IDS = [f"DEV-{i:04d}" for i in range(1, 51)]
USER_IDS = [f"USR-{i:05d}" for i in range(1, 201)]
TRANSACTION_TYPES = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]


async def seed_database():
    """Seed the database with realistic sample transactions."""
    async with async_session() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        count_q = await db.execute(select(func.count()).select_from(Transaction))
        if count_q.scalar() > 0:
            print("[OK] Database already seeded, skipping...")
            return

        print("[SEED] Seeding database with sample data...")

        # Create admin user
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        admin = User(
            id="admin-001",
            email="admin@finshield.ai",
            hashed_password=pwd_context.hash("admin123"),
            full_name="Risk Administrator",
            role="admin",
        )
        analyst = User(
            id="analyst-001",
            email="analyst@finshield.ai",
            hashed_password=pwd_context.hash("analyst123"),
            full_name="Sarah Chen",
            role="analyst",
        )
        db.add_all([admin, analyst])

        # Generate 500 transactions spread over the last 30 days
        now = datetime.now(timezone.utc)
        transactions = []
        predictions = []
        alerts = []
        audit_logs = []

        for i in range(500):
            txn_id = str(uuid.uuid4())
            days_ago = random.randint(0, 29)
            hours_ago = random.randint(0, 23)
            timestamp = now - timedelta(days=days_ago, hours=hours_ago)

            txn_type = random.choice(TRANSACTION_TYPES)
            country = random.choice(COUNTRIES)

            # Generate realistic amounts
            if random.random() < 0.05:  # 5% very large transactions
                amount = random.uniform(100000, 2000000)
            elif random.random() < 0.15:
                amount = random.uniform(10000, 100000)
            else:
                amount = random.uniform(50, 10000)

            old_bal_org = random.uniform(0, 500000)
            # For fraud patterns: sometimes drain the account
            is_fraud_pattern = random.random() < 0.08

            if is_fraud_pattern and txn_type in ("TRANSFER", "CASH_OUT"):
                new_bal_org = 0  # Account drained
                old_bal_dest = random.uniform(0, 100000)
                new_bal_dest = old_bal_dest + amount
                risk_score = random.uniform(71, 99)
                status = "fraud"
                fraud_prob = risk_score / 100
            elif random.random() < 0.12:
                new_bal_org = old_bal_org - amount if old_bal_org > amount else 0
                old_bal_dest = random.uniform(0, 200000)
                new_bal_dest = old_bal_dest + amount * random.uniform(0.5, 1.0)
                risk_score = random.uniform(41, 70)
                status = "review"
                fraud_prob = risk_score / 100
            else:
                new_bal_org = old_bal_org - amount if old_bal_org > amount else old_bal_org
                old_bal_dest = random.uniform(0, 500000)
                new_bal_dest = old_bal_dest + amount
                risk_score = random.uniform(0, 40)
                status = "safe"
                fraud_prob = risk_score / 100

            txn = Transaction(
                id=txn_id,
                user_id=random.choice(USER_IDS),
                amount=round(amount, 2),
                currency="USD",
                country=country,
                device_id=random.choice(DEVICE_IDS),
                transaction_type=txn_type,
                timestamp=timestamp,
                old_balance_org=round(old_bal_org, 2),
                new_balance_org=round(new_bal_org, 2),
                old_balance_dest=round(old_bal_dest, 2),
                new_balance_dest=round(new_bal_dest, 2),
                risk_score=round(risk_score, 2),
                status=status,
                step=random.randint(1, 743),
            )
            transactions.append(txn)

            # Generate mock insights for seeded transactions
            mock_insights = []
            if status in ("fraud", "review"):
                if txn_type in ("TRANSFER", "CASH_OUT"):
                    mock_insights.append({
                        "id": "high_risk_type",
                        "label": "High-Risk Transaction Type",
                        "description": f"{txn_type} transactions account for ~75% of all fraud.",
                        "severity": "high",
                        "category": "transaction_type"
                    })
                if amount > 50000:
                    mock_insights.append({
                        "id": "large_amount",
                        "label": "Unusually Large Amount",
                        "description": f"Transaction amount (${amount:,.2f}) exceeds the 95th percentile threshold.",
                        "severity": "high",
                        "category": "amount"
                    })
                if old_bal_org > 0 and new_bal_org == 0:
                    mock_insights.append({
                        "id": "account_drain",
                        "label": "Account Drain Detected",
                        "description": f"Sender's account was completely emptied (${old_bal_org:,.2f} → $0.00).",
                        "severity": "critical",
                        "category": "balance"
                    })

            # Fraud prediction
            pred = FraudPrediction(
                id=str(uuid.uuid4()),
                transaction_id=txn_id,
                probability=round(fraud_prob, 4),
                insights_json=json.dumps(mock_insights)
            )
            predictions.append(pred)

            # Alerts for risky transactions
            if status in ("fraud", "review"):
                reasons = []
                if status == "fraud":
                    reasons.append(f"High fraud probability: {fraud_prob:.2%}")
                    severity = "critical" if risk_score >= 90 else "high"
                else:
                    reasons.append(f"Elevated risk score: {risk_score:.1f}")
                    severity = "medium"

                if amount > 200000:
                    reasons.append(f"Large amount: ${amount:,.2f}")
                if txn_type in ("TRANSFER", "CASH_OUT"):
                    reasons.append(f"Suspicious type: {txn_type}")

                alert_status = random.choice(["open", "open", "open", "resolved", "escalated"])
                alert = Alert(
                    id=str(uuid.uuid4()),
                    transaction_id=txn_id,
                    severity=severity,
                    reason=" | ".join(reasons),
                    status=alert_status,
                    created_at=timestamp + timedelta(seconds=random.randint(1, 30)),
                )
                alerts.append(alert)

        db.add_all(transactions)
        await db.flush()
        db.add_all(predictions)
        db.add_all(alerts)

        # Generate audit logs
        actions = [
            "login", "login", "login",
            "alert_resolved", "alert_escalated",
            "threshold_updated", "rule_changed",
            "transaction_investigated", "report_generated",
        ]
        for i in range(80):
            days_ago = random.randint(0, 29)
            log = AuditLog(
                id=str(uuid.uuid4()),
                user_id=random.choice(["admin-001", "analyst-001"]),
                action=random.choice(actions),
                details=f"Automated audit log entry #{i+1}",
                ip_address=f"192.168.1.{random.randint(1, 254)}",
                timestamp=now - timedelta(days=days_ago, hours=random.randint(0, 23)),
            )
            audit_logs.append(log)
        db.add_all(audit_logs)

        await db.commit()
        print(f"[DONE] Seeded {len(transactions)} transactions, {len(alerts)} alerts, {len(audit_logs)} audit logs")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    await init_db()
    await seed_database()

    # Load ML model
    try:
        fraud_detector.load()
    except Exception as e:
        print(f"[WARN] ML model not loaded (will use seeded data): {e}")

    yield


app = FastAPI(
    title="FinShield AI",
    description="Real-time Fraud Detection Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
from app.routes import transactions, alerts, analytics, audit, auth, chat, flagged

app.include_router(transactions.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(audit.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(flagged.router)


@app.get("/")
async def root():
    return {"name": "FinShield AI", "version": "1.0.0", "status": "operational"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "ml_model_loaded": fraud_detector._loaded}
