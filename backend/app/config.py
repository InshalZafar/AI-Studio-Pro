"""
Central application configuration.
Reads from environment variables / .env file so nothing is hardcoded.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "AI Studio"
    ENV: str = "development"
    DEBUG: bool = True

    # --- Security / JWT ---
    SECRET_KEY: str = "CHANGE_THIS_SECRET_IN_PRODUCTION_1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # --- Database ---
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'ai_studio.db'}"

    # --- CORS ---
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # --- File storage ---
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    MAX_UPLOAD_MB: int = 25

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Ensure upload directories exist on startup
(settings.UPLOAD_DIR / "documents").mkdir(parents=True, exist_ok=True)
(settings.UPLOAD_DIR / "csv").mkdir(parents=True, exist_ok=True)
