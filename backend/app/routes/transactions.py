"""FinShield AI - Transaction Routes"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timezone
import math
import json

from app.database import get_db
from app.models import Transaction, FraudPrediction, Alert, TransactionStatus, AlertSeverity, User
from app.schemas import TransactionCreate, TransactionResponse, TransactionDetail
from app.services.fraud_detection import fraud_detector

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

TRANSACTION_TYPE_MAP = {
    "CASH_IN": "CASH_IN",
    "CASH_OUT": "CASH_OUT",
    "DEBIT": "DEBIT",
    "PAYMENT": "PAYMENT",
    "TRANSFER": "TRANSFER",
}


@router.post("", response_model=TransactionResponse)
async def create_transaction(payload: TransactionCreate, db: AsyncSession = Depends(get_db)):
    """Create a new transaction, run ML fraud detection, and generate alerts."""

    # Create transaction record
    txn = Transaction(
        user_id=payload.user_id,
        amount=payload.amount,
        currency=payload.currency,
        country=payload.country,
        device_id=payload.device_id,
        transaction_type=payload.transaction_type,
        old_balance_org=payload.old_balance_org,
        new_balance_org=payload.new_balance_org,
        old_balance_dest=payload.old_balance_dest,
        new_balance_dest=payload.new_balance_dest,
        step=payload.step,
    )
    db.add(txn)
    await db.flush()

    # Run ML prediction
    try:
        ml_input = {
            "step": payload.step,
            "type": payload.transaction_type,
            "amount": payload.amount,
            "oldbalanceOrg": payload.old_balance_org,
            "newbalanceOrig": payload.new_balance_org,
            "oldbalanceDest": payload.old_balance_dest,
            "newbalanceDest": payload.new_balance_dest,
        }
        result = fraud_detector.predict(ml_input)

        txn.risk_score = result["risk_score"]
        txn.status = result["classification"]

        # Deduct balance if safe
        if result["classification"] == "safe":
            user_result = await db.execute(select(User).where(User.id == payload.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                user.account_balance = max(0.0, user.account_balance - payload.amount)

        # Save fraud prediction with insights
        pred = FraudPrediction(
            transaction_id=txn.id,
            probability=result["fraud_probability"],
            insights_json=json.dumps(result.get("insights", [])),
        )
        db.add(pred)

        # Generate alert if risky — use ML insights for richer reasons
        if result["risk_score"] >= 40:
            reasons = []
            insights = result.get("insights", [])

            if result["risk_score"] >= 80:
                reasons.append(f"High fraud probability: {result['fraud_probability']:.2%}")
                severity = AlertSeverity.CRITICAL if result["risk_score"] >= 90 else AlertSeverity.HIGH
            else:
                reasons.append(f"Elevated risk score: {result['risk_score']:.1f}")
                severity = AlertSeverity.MEDIUM

            # Add insight-driven reasons
            for insight in insights:
                if insight["severity"] in ("critical", "high"):
                    reasons.append(insight["label"])

            alert = Alert(
                transaction_id=txn.id,
                severity=severity,
                reason=" | ".join(reasons),
            )
            db.add(alert)

    except Exception as e:
        # If ML fails, mark as pending
        txn.status = TransactionStatus.PENDING
        txn.risk_score = 0.0
        import traceback
        traceback.print_exc()

    await db.commit()
    await db.refresh(txn)
    
    response = TransactionResponse.model_validate(txn)
    if 'result' in locals() and "fraud_probability" in result:
        response.raw_risk_score = result["fraud_probability"] * 100
    else:
        response.raw_risk_score = 0.0
    return response


@router.get("", response_model=dict)
async def list_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    min_risk: Optional[float] = None,
    max_risk: Optional[float] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: str = Query("timestamp", regex="^(timestamp|amount|risk_score|status)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    """List transactions with filtering, sorting, and pagination."""
    query = select(Transaction)

    # Filters
    if status:
        query = query.where(Transaction.status == status)
    if min_risk is not None:
        query = query.where(Transaction.risk_score >= min_risk)
    if max_risk is not None:
        query = query.where(Transaction.risk_score <= max_risk)
    if min_amount is not None:
        query = query.where(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.where(Transaction.amount <= max_amount)
    if search:
        query = query.where(
            or_(
                Transaction.id.contains(search),
                Transaction.user_id.contains(search),
                Transaction.country.contains(search),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Sorting
    sort_col = getattr(Transaction, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    # Pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    transactions = result.scalars().all()

    return {
        "items": [TransactionResponse.model_validate(t) for t in transactions],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": math.ceil(total / per_page) if total > 0 else 1,
    }


@router.get("/{transaction_id}", response_model=TransactionDetail)
async def get_transaction(transaction_id: str, db: AsyncSession = Depends(get_db)):
    """Get transaction details including fraud prediction and alerts."""
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.alerts))
        .where(Transaction.id == transaction_id)
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Get prediction
    pred_result = await db.execute(
        select(FraudPrediction).where(FraudPrediction.transaction_id == transaction_id)
    )
    pred = pred_result.scalar_one_or_none()

    # Get alerts
    alerts_result = await db.execute(
        select(Alert).where(Alert.transaction_id == transaction_id)
    )
    alerts = alerts_result.scalars().all()

    detail = TransactionDetail.model_validate(txn)
    if pred:
        detail.fraud_probability = pred.probability
        detail.model_version = pred.model_version
        # Deserialize stored insights
        if pred.insights_json:
            try:
                detail.insights = json.loads(pred.insights_json)
            except (json.JSONDecodeError, TypeError):
                detail.insights = []
    detail.alerts = alerts

    return detail
