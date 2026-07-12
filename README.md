# AI Studio

A modular AI web application — choose specialized AI tools from a dashboard
instead of a single chatbot. Six channels: General AI, Document AI (RAG),
CSV Analytics AI, Recipe Generator, Sports AI, and an API Key Manager.

You bring your own API key for OpenAI, Claude, Gemini, or DeepSeek —
nothing is billed through this app, and keys are stored only in your local
SQLite database.

---

## Tech stack

**Frontend** — Next.js 15 (App Router) · TypeScript · Tailwind CSS ·
Framer Motion · Lucide icons

**Backend** — FastAPI · SQLAlchemy · SQLite · Pydantic · Uvicorn

**AI providers** — OpenAI · Anthropic Claude · Google Gemini · DeepSeek

**Document AI retrieval** — TF-IDF (scikit-learn) instead of FAISS +
sentence-transformers, so there's no `torch` install and no GPU needed.
It's a drop-in swap later if you want semantic embeddings.

---

## Prerequisites

- Python 3.11+ (3.12 recommended)
- Node.js 20+ and npm
- No database server needed — SQLite is a single file, created automatically

---

## 1. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file (defaults work fine for local dev)
cp .env.example .env

# Run the server
uvicorn app.main:app --reload --port 8000
```

The API is now live at **http://localhost:8000** — interactive docs at
**http://localhost:8000/docs**.

The SQLite database (`ai_studio.db`) and `uploads/` folder are created
automatically on first run.

---

## 2. Frontend setup

Open a **second terminal** (keep the backend running):

```bash
cd frontend

# Install dependencies
npm install

# Copy env file
cp .env.local.example .env.local

# Run the dev server
npm run dev
```

The app is now live at **http://localhost:3000**.

---

## 3. First run

1. Open http://localhost:3000 — you'll land on the login page.
2. Click **Create one** to register an account (stored locally in SQLite).
3. Go to **Settings** in the sidebar and add an API key for at least one
   provider (OpenAI, Claude, Gemini, or DeepSeek). Use **Test connection**
   to confirm it works before saving.
4. Open any module from the dashboard and start using it.

---

## Project structure

```
ai-studio/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route modules (one per feature)
│   │   ├── services/     # Business logic (RAG, CSV/SQL, recipes, sports)
│   │   ├── models/       # SQLAlchemy ORM models (7 tables)
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── database/     # DB session/engine setup
│   │   ├── ai/           # Provider abstraction (OpenAI/Claude/Gemini/DeepSeek)
│   │   ├── utils/        # Auth (JWT/bcrypt) helpers
│   │   └── main.py       # App entrypoint
│   └── requirements.txt
├── frontend/
│   ├── app/               # Next.js App Router pages
│   │   ├── login, register, forgot-password
│   │   └── dashboard/     # general, documents, csv, recipes, sports, settings
│   ├── components/        # UI primitives, layout, module-specific components
│   ├── hooks/              # useApiKeys, etc.
│   └── lib/                # api client, auth context, theme context, types
└── README.md
```

---

## Notes on running this locally

- **Everything runs on your machine.** No external services besides the AI
  provider you call (OpenAI/Claude/Gemini/DeepSeek) and, if you use them,
  their APIs.
- **SQLite is fine for development.** It's a single file (`ai_studio.db`) —
  delete it any time to reset the whole app.
- **Streaming chat** (General AI) uses Server-Sent Events over `fetch()`.
  If you deploy behind a reverse proxy, make sure it doesn't buffer SSE
  responses.
- **CSV Analytics AI** loads your CSVs into an in-memory DuckDB per request
  — nothing is persisted to a real database beyond the original CSV files.
- If you ever want real semantic search instead of TF-IDF for Document AI,
  swap `app/services/document_service.py`'s retrieval function for one using
  `sentence-transformers` + `faiss-cpu` — the API surface won't change.

---

## Troubleshooting

**Backend won't start / `ModuleNotFoundError`**
Make sure your virtual environment is activated (`source .venv/bin/activate`)
before running `pip install` and `uvicorn`.

**Frontend can't reach the backend / CORS errors**
Check `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
and that the backend is actually running on port 8000.

**"No API key configured" errors in a module**
Go to Settings and add a key for the provider selected in that module's
provider dropdown — each module lets you pick OpenAI/Claude/Gemini/DeepSeek
independently.

**Port already in use**
Backend: `uvicorn app.main:app --reload --port 8001` (then update
`NEXT_PUBLIC_API_URL` accordingly). Frontend: `npm run dev -- -p 3001`.
