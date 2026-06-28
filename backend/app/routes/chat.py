"""FinShield AI - Chat Routes (Gemini RAG)"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.services.ai_analyst import ai_analyst

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


class ExplainRequest(BaseModel):
    transaction_id: str


SUGGESTIONS = [
    {"text": "What are the riskiest transactions?", "icon": "shield-alert"},
    {"text": "Summarize today's fraud activity", "icon": "bar-chart"},
    {"text": "Which countries have the highest fraud rates?", "icon": "globe"},
    {"text": "Explain the top alerts", "icon": "bell"},
    {"text": "What fraud patterns do you see?", "icon": "brain"},
    {"text": "Show me the largest suspicious transfers", "icon": "trending-up"},
]


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Send a message to the AI fraud analyst. Uses RAG to pull relevant data."""
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        reply = await ai_analyst.analyze(payload.message, db)
        return ChatResponse(reply=reply)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"[AI ERROR] {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI response. Please check your Gemini API key."
        )


@router.post("/explain", response_model=ChatResponse)
async def explain_transaction(payload: ExplainRequest, db: AsyncSession = Depends(get_db)):
    """Get an AI-powered explanation for why a specific transaction was flagged."""
    try:
        reply = await ai_analyst.explain_transaction(payload.transaction_id, db)
        return ChatResponse(reply=reply)
    except Exception as e:
        print(f"[AI ERROR] {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI explanation."
        )


@router.get("/suggestions")
async def get_suggestions():
    """Return starter prompt suggestions for the chat UI."""
    return {"suggestions": SUGGESTIONS}
