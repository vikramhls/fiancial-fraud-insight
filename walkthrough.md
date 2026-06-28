# AI Features Walkthrough

## What Was Built

### 1. Gemini AI Fraud Analyst Chatbot (RAG)
A slide-out chat panel accessible from the **AI Analyst** button in the admin sidebar.

**How RAG works in this project:**
1. User asks a question like *"What are the riskiest transactions?"*
2. The backend **queries your SQLite database** for relevant transactions, alerts, stats (this is the **Retrieval** step)
3. That real data is combined with the question and sent to **Gemini** (this is the **Augmented Generation** step)
4. Gemini responds with an accurate, data-backed analysis

**Files:**
- Backend service: [ai_analyst.py](file:///c:/Users/Harsh/OneDrive/Desktop/financial/backend/app/services/ai_analyst.py)
- Backend route: [chat.py](file:///c:/Users/Harsh/OneDrive/Desktop/financial/backend/app/routes/chat.py)
- Frontend component: [AIChatPanel.tsx](file:///c:/Users/Harsh/OneDrive/Desktop/financial/frontend/src/components/AIChatPanel.tsx)

---

### 2. Flagged Transactions Page (with AI Explanations)
A new **"Flagged (AI)"** page in the admin sidebar showing all fraud/review transactions with:
- **ML Insights** — the feature-level reasons WHY each transaction was flagged (account drain, high amount, suspicious type, etc.)
- **Balance Movement** — visual breakdown of sender/receiver balances
- **AI Deep Analysis** — click "Generate AI Explanation" to get a Gemini-powered narrative explaining the fraud pattern in plain English

**Files:**
- Backend route: [flagged.py](file:///c:/Users/Harsh/OneDrive/Desktop/financial/backend/app/routes/flagged.py)
- Frontend page: [FlaggedTransactionsPage.tsx](file:///c:/Users/Harsh/OneDrive/Desktop/financial/frontend/src/pages/FlaggedTransactionsPage.tsx)

---

### 3. Updated Admin Layout
- Added **"Flagged (AI)"** navigation item in the sidebar
- Added **"AI Analyst"** button with a pulsing indicator at the bottom of the sidebar
- Updated: [Layout.tsx](file:///c:/Users/Harsh/OneDrive/Desktop/financial/frontend/src/components/Layout.tsx)

---

### 4. Backend Infrastructure
- Added `google-genai` and `python-dotenv` to [requirements.txt](file:///c:/Users/Harsh/OneDrive/Desktop/financial/backend/requirements.txt)
- Added `GEMINI_API_KEY` to [.env](file:///c:/Users/Harsh/OneDrive/Desktop/financial/backend/.env)
- Added dotenv loading in [main.py](file:///c:/Users/Harsh/OneDrive/Desktop/financial/backend/app/main.py)
- Registered new routers (`chat`, `flagged`) in main.py

---

## How to Test

1. Start the backend: `cd backend && .\venv\Scripts\uvicorn app.main:app --reload`
2. Start the frontend: `cd frontend && npm run dev`
3. Go to the admin dashboard (`/admin`)
4. **AI Chat**: Click the "AI Analyst" button in the sidebar → ask questions
5. **Flagged page**: Click "Flagged (AI)" in the sidebar → expand a transaction → click "Generate AI Explanation"
