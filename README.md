# FinProctector 🛡️

FinShield AI is an intelligent, real-time financial fraud detection platform. It uses a modern tech stack (FastAPI + React) combined with machine learning (XGBoost) and Large Language Models (Google Gemini) to detect, explain, and mitigate fraudulent transactions.

## Features ✨

*   **Real-Time Fraud Detection:** Uses an XGBoost model trained on financial datasets to instantly score and classify transactions (Safe, Review, Fraud).
*   **AI-Powered Explanations:** Integrates **Google Gemini** (via RAG) to provide natural-language, expert-level explanations for why specific transactions were flagged, breaking down complex ML insights into actionable intelligence.
*   **AI Chat Analyst:** A built-in chatbot that allows investigators to query the database using natural language (e.g., "What are the most common fraud patterns today?").
*   **Interactive Dashboard:** A beautiful, responsive React frontend built with TailwindCSS and Recharts for monitoring risk, volume, and trends.
*   **Role-Based Access Control:** Secure JWT authentication with distinct roles for Customers and Risk Analysts.

## Tech Stack 🛠️

*   **Frontend:** React 18, Vite, TailwindCSS, Recharts, Lucide Icons
*   **Backend:** Python 3, FastAPI, SQLAlchemy (Async), Uvicorn
*   **Database:** SQLite (Async) for rapid prototyping and local development
*   **Machine Learning:** XGBoost, Scikit-learn
*   **Generative AI:** Google GenAI SDK (Gemini 2.0 Flash)

## Setup & Installation 🚀

### 1. Backend Setup

Navigate to the `backend` directory and set up a Python virtual environment:

```bash
cd backend
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory and add your Google Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

*(Note: API keys are excluded from version control for security.)*

### 3. Frontend Setup

Navigate to the `frontend` directory and install the Node modules:

```bash
cd frontend
npm install
```

## Running the Application ▶️

You need to run both the backend API and the frontend development server simultaneously.

**Start the Backend:**
```bash
cd backend
# Make sure your virtual environment is activated
uvicorn app.main:app --reload
```
The API will run on `http://127.0.0.1:8000`. On first run, it will automatically seed the SQLite database with 500 realistic mock transactions, ML predictions, and alerts.

**Start the Frontend:**
```bash
cd frontend
npm run dev
```
The React application will run on `http://localhost:5173`.

## Usage 💡

1.  **Sign Up / Login:** Open the frontend URL. Create a new account or log in.
2.  **Dashboard:** View real-time analytics, recent alerts, and transaction volume.
3.  **Flagged (AI):** Navigate to the Flagged section to view transactions caught by the ML model. Click "Generate AI Explanation" to see Gemini's analysis.
4.  **AI Analyst:** Click the pulsing AI button in the sidebar to open the chat panel and ask questions about the current fraud landscape.

## License 📄

This project is licensed under the MIT License.
