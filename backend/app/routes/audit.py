"""FinShield AI - Audit Log Routes"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional
import math

from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogResponse

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=dict)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List audit logs with filtering and pagination."""
    query = select(AuditLog)

    if action:
        query = query.where(AuditLog.action == action)
    if search:
        query = query.where(
            or_(
                AuditLog.action.contains(search),
                AuditLog.details.contains(search),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(AuditLog.timestamp.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    logs = result.scalars().all()

    return {
        "items": [AuditLogResponse.model_validate(log) for log in logs],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": math.ceil(total / per_page) if total > 0 else 1,
    }
