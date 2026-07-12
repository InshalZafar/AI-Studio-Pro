from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.api_setting import APISetting


def get_active_key(db: Session, user_id: str, provider: str) -> str:
    setting = (
        db.query(APISetting)
        .filter(APISetting.user_id == user_id, APISetting.provider == provider, APISetting.is_active == True)  # noqa: E712
        .first()
    )
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No API key configured for provider '{provider}'. Add one in Settings first.",
        )
    return setting.api_key


def mask_key(key: str) -> str:
    if len(key) <= 8:
        return "*" * len(key)
    return f"{key[:4]}{'*' * (len(key) - 8)}{key[-4:]}"
