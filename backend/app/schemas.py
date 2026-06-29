"""FinShield AI - Pydantic Schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ─── Transaction Schemas ─────────────────────────────────────────────────
class TransactionCreate(BaseModel):
    user_id: str
    amount: float
    currency: str = "USD"
    country: str
    device_id: Optional[str] = None
    transaction_type: str
    old_balance_org: float = 0.0
    new_balance_org: float = 0.0
    old_balance_dest: float = 0.0
    new_balance_dest: float = 0.0
    step: int = 1


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    currency: str
    country: str
    device_id: Optional[str]
    transaction_type: str
    timestamp: datetime
    risk_score: float
    raw_risk_score: Optional[float] = None
    status: str
    old_balance_org: float
    new_balance_org: float
    old_balance_dest: float
    new_balance_dest: float

    class Config:
        from_attributes = True


class InsightItem(BaseModel):
    id: str
    label: str
    description: str
    severity: str  # critical, high, medium, info
    category: str  # transaction_type, amount, balance


class TransactionDetail(TransactionResponse):
    fraud_probability: Optional[float] = None
    model_version: Optional[str] = None
    insights: List[InsightItem] = []
    alerts: List["AlertResponse"] = []

    class Config:
        from_attributes = True


# ─── Alert Schemas ───────────────────────────────────────────────────────
class AlertResponse(BaseModel):
    id: str
    transaction_id: str
    severity: str
    reason: str
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


# ─── Analytics Schemas ───────────────────────────────────────────────────
class DashboardMetrics(BaseModel):
    total_transactions_today: int
    fraudulent_transactions: int
    average_risk_score: float
    total_revenue_processed: float
    fraud_detection_accuracy: float


class FraudTrend(BaseModel):
    date: str
    fraud_count: int
    total_count: int


class RiskDistribution(BaseModel):
    bucket: str
    count: int


class VolumeByDay(BaseModel):
    date: str
    volume: int
    amount: float


class CountryFraud(BaseModel):
    country: str
    fraud_count: int
    total_count: int
    fraud_rate: float


# ─── Audit Log Schemas ───────────────────────────────────────────────────
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    action: str
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


# ─── Auth Schemas ────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str
    initial_balance: Optional[float] = 54320.50


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    account_balance: float

    class Config:
        from_attributes = True


# ─── Pagination ──────────────────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    total_pages: int
