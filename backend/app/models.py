"""FinShield AI - SQLAlchemy Models"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


def generate_uuid():
    return str(uuid.uuid4())


def utcnow():
    return datetime.now(timezone.utc)


class TransactionStatus(str, enum.Enum):
    SAFE = "safe"
    REVIEW = "review"
    FRAUD = "fraud"
    PENDING = "pending"


class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    CUSTOMER = "customer"


# ─── Users ───────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default=UserRole.ANALYST)
    created_at = Column(DateTime, default=utcnow)

    audit_logs = relationship("AuditLog", back_populates="user")


# ─── Transactions ────────────────────────────────────────────────────────
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    country = Column(String, nullable=False)
    device_id = Column(String, nullable=True)
    transaction_type = Column(String, nullable=False)  # TRANSFER, CASH_OUT, etc.
    timestamp = Column(DateTime, default=utcnow, index=True)

    # Balance fields for ML
    old_balance_org = Column(Float, default=0.0)
    new_balance_org = Column(Float, default=0.0)
    old_balance_dest = Column(Float, default=0.0)
    new_balance_dest = Column(Float, default=0.0)

    # Risk evaluation
    risk_score = Column(Float, default=0.0)
    status = Column(String, default=TransactionStatus.PENDING)

    # Step (hour of simulation)
    step = Column(Integer, default=1)

    fraud_prediction = relationship("FraudPrediction", back_populates="transaction", uselist=False)
    alerts = relationship("Alert", back_populates="transaction")


# ─── Fraud Predictions ──────────────────────────────────────────────────
class FraudPrediction(Base):
    __tablename__ = "fraud_predictions"

    id = Column(String, primary_key=True, default=generate_uuid)
    transaction_id = Column(String, ForeignKey("transactions.id"), unique=True, nullable=False)
    probability = Column(Float, nullable=False)
    model_version = Column(String, default="xgboost-v1")
    insights_json = Column(Text, nullable=True)  # JSON-serialized insights list
    created_at = Column(DateTime, default=utcnow)

    transaction = relationship("Transaction", back_populates="fraud_prediction")


# ─── Alerts ──────────────────────────────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    severity = Column(String, default=AlertSeverity.MEDIUM)
    reason = Column(Text, nullable=False)
    status = Column(String, default=AlertStatus.OPEN)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    transaction = relationship("Transaction", back_populates="alerts")


# ─── Audit Logs ──────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="audit_logs")
