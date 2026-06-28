"""FinShield AI - Gemini-Powered Fraud Analyst (RAG)"""
import os
import json
from datetime import datetime, timezone, timedelta
from google import genai
from sqlalchemy import select, func, desc, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Transaction, FraudPrediction, Alert, AuditLog

# ─── Configuration ───────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

SYSTEM_PROMPT = """You are **FinShield AI Analyst**, a senior fraud detection expert embedded in a real-time financial monitoring platform.

## Your Knowledge
- You have access to REAL transaction data from the platform's database (provided as context below).
- The platform uses an **XGBoost ML model** trained on the PaySim dataset to predict fraud.
- Risk scores range from 0-100: **0-40 = Safe**, **40-80 = Needs Review**, **80-100 = Fraud**.
- The model engineers features like: balance drain ratio, balance error detection, high-amount flags, suspicious transfer flags, and receiver growth anomalies.
- Transaction types: CASH_IN, CASH_OUT, DEBIT, PAYMENT, TRANSFER. Historically, TRANSFER and CASH_OUT account for ~75% of all fraud.

## Your Personality
- You are precise, data-driven, and authoritative.
- Always reference specific numbers from the data context.
- When explaining fraud flags, break down WHICH features triggered the flag and WHY that pattern is suspicious.
- Use bullet points and bold text for clarity.
- Keep responses concise but thorough (2-4 paragraphs max unless asked for detail).
- If asked about something not in the data, say so honestly.

## Formatting
- Use markdown formatting: **bold**, *italic*, bullet points, and code blocks where appropriate.
- Format currency as $X,XXX.XX.
- Format percentages to 1 decimal place.
"""


class AIAnalyst:
    """RAG-powered fraud analyst using Gemini."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            api_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
            if not api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            self._client = genai.Client(api_key=api_key)
        return self._client

    async def retrieve_context(self, question: str, db: AsyncSession) -> str:
        """
        RAG Retrieval Step: Query the database for relevant context based on the question.
        This is what makes it RAG - we pull REAL data to feed the LLM.
        """
        context_parts = []
        q_lower = question.lower()

        # ── Always provide summary statistics ──
        total_q = await db.execute(select(func.count()).select_from(Transaction))
        total = total_q.scalar() or 0

        fraud_q = await db.execute(
            select(func.count()).select_from(Transaction).where(Transaction.status == "fraud")
        )
        fraud_count = fraud_q.scalar() or 0

        review_q = await db.execute(
            select(func.count()).select_from(Transaction).where(Transaction.status == "review")
        )
        review_count = review_q.scalar() or 0

        safe_count = total - fraud_count - review_count

        context_parts.append(
            f"## Database Summary\n"
            f"- Total transactions: {total}\n"
            f"- Fraud: {fraud_count} ({(fraud_count/max(total,1)*100):.1f}%)\n"
            f"- Under Review: {review_count} ({(review_count/max(total,1)*100):.1f}%)\n"
            f"- Safe: {safe_count} ({(safe_count/max(total,1)*100):.1f}%)\n"
        )

        # ── If asking about a specific transaction ──
        if any(kw in q_lower for kw in ["transaction", "txn", "why", "flagged", "explain"]):
            # Get top flagged transactions
            flagged_q = await db.execute(
                select(Transaction)
                .where(Transaction.status.in_(["fraud", "review"]))
                .order_by(desc(Transaction.risk_score))
                .limit(10)
            )
            flagged = flagged_q.scalars().all()

            if flagged:
                context_parts.append("\n## Top 10 Flagged Transactions (by risk score)")
                for t in flagged:
                    # Get insights for this transaction
                    pred_q = await db.execute(
                        select(FraudPrediction).where(FraudPrediction.transaction_id == t.id)
                    )
                    pred = pred_q.scalar_one_or_none()
                    insights_text = ""
                    if pred and pred.insights_json:
                        try:
                            insights = json.loads(pred.insights_json)
                            insights_text = " | Insights: " + ", ".join(
                                [f"{i['label']} ({i['severity']})" for i in insights]
                            )
                        except (json.JSONDecodeError, TypeError):
                            pass

                    context_parts.append(
                        f"- **{t.id[:8]}...** | {t.transaction_type} | ${t.amount:,.2f} | "
                        f"Risk: {t.risk_score:.1f} | Status: {t.status} | "
                        f"User: {t.user_id} | Country: {t.country} | "
                        f"Balance: ${t.old_balance_org:,.2f} → ${t.new_balance_org:,.2f}"
                        f"{insights_text}"
                    )

        # ── If asking about patterns, trends, or countries ──
        if any(kw in q_lower for kw in ["pattern", "trend", "country", "type", "summary", "overview", "risky", "suspicious"]):
            # Fraud by transaction type
            type_q = await db.execute(
                select(
                    Transaction.transaction_type,
                    func.count().label("total"),
                    func.sum(func.cast(Transaction.status == "fraud", type_=None)).label("fraud"),
                )
                .group_by(Transaction.transaction_type)
            )
            type_rows = type_q.all()
            if type_rows:
                context_parts.append("\n## Fraud by Transaction Type")
                for row in type_rows:
                    fraud_n = row[2] or 0
                    total_n = row[1]
                    context_parts.append(
                        f"- {row[0]}: {fraud_n}/{total_n} fraud ({(fraud_n/max(total_n,1)*100):.1f}%)"
                    )

            # Fraud by country (top 5)
            country_q = await db.execute(
                select(
                    Transaction.country,
                    func.count().label("total"),
                    func.avg(Transaction.risk_score).label("avg_risk"),
                )
                .group_by(Transaction.country)
                .order_by(desc("avg_risk"))
                .limit(5)
            )
            country_rows = country_q.all()
            if country_rows:
                context_parts.append("\n## Top 5 Countries by Average Risk")
                for row in country_rows:
                    context_parts.append(
                        f"- {row[0]}: {row[1]} transactions, avg risk: {row[2]:.1f}"
                    )

        # ── If asking about alerts ──
        if any(kw in q_lower for kw in ["alert", "open", "critical", "escalated"]):
            alerts_q = await db.execute(
                select(Alert)
                .order_by(desc(Alert.created_at))
                .limit(10)
            )
            alerts = alerts_q.scalars().all()
            if alerts:
                context_parts.append("\n## Recent Alerts (top 10)")
                for a in alerts:
                    context_parts.append(
                        f"- [{a.severity.upper()}] {a.reason} | Status: {a.status} | TXN: {a.transaction_id[:8]}..."
                    )

        # ── If asking about large amounts or specific amounts ──
        if any(kw in q_lower for kw in ["large", "big", "highest", "amount", "expensive"]):
            big_q = await db.execute(
                select(Transaction)
                .order_by(desc(Transaction.amount))
                .limit(5)
            )
            big_txns = big_q.scalars().all()
            if big_txns:
                context_parts.append("\n## Top 5 Largest Transactions")
                for t in big_txns:
                    context_parts.append(
                        f"- ${t.amount:,.2f} | {t.transaction_type} | Risk: {t.risk_score:.1f} | Status: {t.status}"
                    )

        return "\n".join(context_parts)

    async def analyze(self, question: str, db: AsyncSession) -> str:
        """Full RAG pipeline: Retrieve context → Generate answer with Gemini."""
        client = self._get_client()

        # Step 1: RAG Retrieval
        context = await self.retrieve_context(question, db)

        # Step 2: Build prompt with context
        user_prompt = (
            f"## Retrieved Data Context\n{context}\n\n"
            f"## Analyst Question\n{question}"
        )

        # Step 3: Call Gemini
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=user_prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
                max_output_tokens=1024,
            ),
        )

        return response.text

    async def explain_transaction(self, transaction_id: str, db: AsyncSession) -> str:
        """Generate a detailed AI explanation for why a specific transaction was flagged."""
        client = self._get_client()

        # Fetch the transaction
        txn_q = await db.execute(
            select(Transaction).where(Transaction.id == transaction_id)
        )
        txn = txn_q.scalar_one_or_none()
        if not txn:
            return "Transaction not found."

        # Fetch prediction and insights
        pred_q = await db.execute(
            select(FraudPrediction).where(FraudPrediction.transaction_id == transaction_id)
        )
        pred = pred_q.scalar_one_or_none()

        insights = []
        if pred and pred.insights_json:
            try:
                insights = json.loads(pred.insights_json)
            except (json.JSONDecodeError, TypeError):
                pass

        # Fetch alerts
        alerts_q = await db.execute(
            select(Alert).where(Alert.transaction_id == transaction_id)
        )
        alerts = alerts_q.scalars().all()

        # Build context
        context = (
            f"## Transaction Under Analysis\n"
            f"- **ID**: {txn.id}\n"
            f"- **Type**: {txn.transaction_type}\n"
            f"- **Amount**: ${txn.amount:,.2f}\n"
            f"- **Country**: {txn.country}\n"
            f"- **User ID**: {txn.user_id}\n"
            f"- **Risk Score**: {txn.risk_score:.2f}\n"
            f"- **ML Probability**: {pred.probability:.4f if pred else 'N/A'}\n"
            f"- **Classification**: {txn.status}\n"
            f"- **Sender Balance**: ${txn.old_balance_org:,.2f} → ${txn.new_balance_org:,.2f}\n"
            f"- **Receiver Balance**: ${txn.old_balance_dest:,.2f} → ${txn.new_balance_dest:,.2f}\n"
        )

        if insights:
            context += "\n## ML Model Insights (Feature Explanations)\n"
            for i in insights:
                context += f"- **{i['label']}** [{i['severity'].upper()}]: {i['description']}\n"

        if alerts:
            context += "\n## Generated Alerts\n"
            for a in alerts:
                context += f"- [{a.severity.upper()}] {a.reason}\n"

        prompt = (
            f"{context}\n\n"
            f"## Task\n"
            f"Provide a detailed, expert-level explanation of why this transaction was classified as **{txn.status}**. "
            f"Break down each risk signal detected by the ML model, explain the financial pattern it represents, "
            f"and give a clear conclusion with a recommended action for the analyst."
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2,
                max_output_tokens=1024,
            ),
        )

        return response.text


# Singleton
ai_analyst = AIAnalyst()
