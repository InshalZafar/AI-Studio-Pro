"""
AI Studio Backend — main FastAPI application.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.session import engine, Base
import app.models  # noqa: F401  (ensures all models are registered before create_all)

from app.api import auth, chat, documents, csv_ai, recipe, sports, settings as settings_routes

# Create all tables on startup (SQLite dev convenience; use Alembic migrations for production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Modular AI platform: General AI, Document AI (RAG), CSV Analytics AI, Recipe AI, and Sports AI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all module routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(csv_ai.router)
app.include_router(recipe.router)
app.include_router(sports.router)
app.include_router(settings_routes.router)


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "status": "running", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
