"""FinShield AI - Auth Routes (simplified JWT auth)"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext

from app.database import get_db
from app.models import User, AuditLog, UserRole
from app.schemas import LoginRequest, SignupRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

SECRET_KEY = "finshield-super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new customer and return JWT token."""
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=pwd_context.hash(payload.password),
        role=UserRole.CUSTOMER,
    )
    db.add(new_user)
    
    # Audit log
    audit = AuditLog(user_id=new_user.id, action="signup", details=f"Customer {new_user.email} signed up")
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(new_user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})

    # Audit log
    audit = AuditLog(user_id=user.id, action="login", details=f"User {user.email} logged in")
    db.add(audit)
    await db.commit()

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me")
async def get_current_user():
    """Returns demo user for the prototype."""
    return {
        "id": "admin-001",
        "email": "admin@finshield.ai",
        "full_name": "Risk Administrator",
        "role": "admin",
    }
