from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.api_setting import APISetting
from app.schemas.settings import APIKeyCreate, APIKeyOut, APIKeyTestRequest, APIKeyTestResponse
from app.utils.deps import get_current_user
from app.services.settings_service import mask_key
from app.ai.factory import get_provider, SUPPORTED_PROVIDERS

router = APIRouter(prefix="/api/settings", tags=["API Key Manager"])


@router.get("", response_model=list[APIKeyOut])
def list_keys(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(APISetting).filter(APISetting.user_id == user.id).all()
    return [
        APIKeyOut(
            id=r.id, provider=r.provider, is_active=r.is_active,
            masked_key=mask_key(r.api_key), updated_at=r.updated_at,
        )
        for r in rows
    ]


@router.post("/api-key", response_model=APIKeyOut)
def upsert_key(payload: APIKeyCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unsupported provider '{payload.provider}'.")

    existing = db.query(APISetting).filter(
        APISetting.user_id == user.id, APISetting.provider == payload.provider
    ).first()

    if existing:
        existing.api_key = payload.api_key
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        row = existing
    else:
        row = APISetting(user_id=user.id, provider=payload.provider, api_key=payload.api_key)
        db.add(row)
        db.commit()
        db.refresh(row)

    return APIKeyOut(
        id=row.id, provider=row.provider, is_active=row.is_active,
        masked_key=mask_key(row.api_key), updated_at=row.updated_at,
    )


@router.delete("/api-key/{provider}", status_code=204)
def delete_key(provider: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.query(APISetting).filter(APISetting.user_id == user.id, APISetting.provider == provider).first()
    if not row:
        raise HTTPException(status_code=404, detail="Key not found.")
    db.delete(row)
    db.commit()
    return None


@router.post("/test-connection", response_model=APIKeyTestResponse)
async def test_connection(payload: APIKeyTestRequest):
    if payload.provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unsupported provider '{payload.provider}'.")
    provider = get_provider(payload.provider, payload.api_key)
    success, message = await provider.test_connection()
    return APIKeyTestResponse(success=success, message=message)
