"""FinShield AI - Alert Routes"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import math

from app.database import get_db
from app.models import Alert, Transaction, AuditLog
from app.schemas import AlertResponse, AlertUpdate

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=dict)
async def list_alerts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List fraud alerts with filtering and pagination."""
    query = select(Alert)
    if status:
        query = query.where(Alert.status == status)
    if severity:
        query = query.where(Alert.severity == severity)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Alert.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    alerts = result.scalars().all()

    # Enrich with transaction amount/user
    items = []
    for alert in alerts:
        txn_result = await db.execute(
            select(Transaction).where(Transaction.id == alert.transaction_id)
        )
        txn = txn_result.scalar_one_or_none()
        alert_data = AlertResponse.model_validate(alert).model_dump()
        if txn:
            alert_data["amount"] = txn.amount
            alert_data["user_id"] = txn.user_id
            alert_data["risk_score"] = txn.risk_score
            alert_data["country"] = txn.country
        items.append(alert_data)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": math.ceil(total / per_page) if total > 0 else 1,
    }


@router.patch("/{alert_id}")
async def update_alert(alert_id: str, payload: AlertUpdate, db: AsyncSession = Depends(get_db)):
    """Update alert status or add notes."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if payload.status:
        alert.status = payload.status
    if payload.notes is not None:
        alert.notes = payload.notes

    # Create audit log
    audit = AuditLog(
        action=f"alert_updated",
        details=f"Alert {alert_id} updated: status={payload.status}, notes={payload.notes}",
    )
    db.add(audit)

    await db.commit()
    return {"message": "Alert updated successfully"}
