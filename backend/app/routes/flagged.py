"""FinShield AI - Flagged Transactions Routes"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import Optional
import math
import json

from app.database import get_db
from app.models import Transaction, FraudPrediction, Alert

router = APIRouter(prefix="/api/flagged", tags=["Flagged Transactions"])


@router.get("")
async def get_flagged_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all fraud and review transactions with their ML insights
    (the reason WHY they were flagged).
    """
    query = (
        select(Transaction)
        .where(Transaction.status.in_(["fraud", "review"]))
    )

    if severity == "fraud":
        query = query.where(Transaction.status == "fraud")
    elif severity == "review":
        query = query.where(Transaction.status == "review")

    # Count total
    count_q = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_q.scalar() or 0

    # Fetch paginated
    query = query.order_by(desc(Transaction.risk_score))
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    transactions = result.scalars().all()

    items = []
    for txn in transactions:
        # Fetch insights for each transaction
        pred_q = await db.execute(
            select(FraudPrediction).where(FraudPrediction.transaction_id == txn.id)
        )
        pred = pred_q.scalar_one_or_none()

        insights = []
        fraud_probability = None
        if pred:
            fraud_probability = pred.probability
            if pred.insights_json:
                try:
                    insights = json.loads(pred.insights_json)
                except (json.JSONDecodeError, TypeError):
                    pass

        # Fetch alerts
        alerts_q = await db.execute(
            select(Alert).where(Alert.transaction_id == txn.id)
        )
        alerts = alerts_q.scalars().all()

        items.append({
            "id": txn.id,
            "user_id": txn.user_id,
            "amount": txn.amount,
            "currency": txn.currency,
            "country": txn.country,
            "transaction_type": txn.transaction_type,
            "timestamp": txn.timestamp.isoformat(),
            "risk_score": txn.risk_score,
            "status": txn.status,
            "fraud_probability": fraud_probability,
            "old_balance_org": txn.old_balance_org,
            "new_balance_org": txn.new_balance_org,
            "old_balance_dest": txn.old_balance_dest,
            "new_balance_dest": txn.new_balance_dest,
            "insights": insights,
            "alert_count": len(alerts),
            "alerts": [
                {
                    "id": a.id,
                    "severity": a.severity,
                    "reason": a.reason,
                    "status": a.status,
                }
                for a in alerts
            ],
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": math.ceil(total / per_page) if total > 0 else 1,
    }
