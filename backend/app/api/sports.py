from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.chat import Chat, Message
from app.schemas.sports import SportsChatRequest, SportsChatResponse
from app.utils.deps import get_current_user
from app.services.settings_service import get_active_key
from app.services.sports_service import build_sports_prompt, SUPPORTED_SPORTS
from app.ai.factory import get_provider

router = APIRouter(prefix="/api/sports", tags=["Sports AI"])


@router.get("/supported")
def get_supported_sports():
    return {"sports": SUPPORTED_SPORTS}


@router.post("/chat", response_model=SportsChatResponse)
async def chat_sports(
    payload: SportsChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.sport not in SUPPORTED_SPORTS:
        raise HTTPException(status_code=400, detail=f"Unsupported sport '{payload.sport}'.")

    if payload.chat_id:
        chat = db.query(Chat).filter(Chat.id == payload.chat_id, Chat.user_id == user.id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found.")
        history = [{"role": m.role, "content": m.content} for m in chat.messages]
    else:
        title = payload.question[:50] + ("..." if len(payload.question) > 50 else "")
        chat = Chat(user_id=user.id, title=title, module="sports", provider=payload.provider)
        db.add(chat)
        db.commit()
        db.refresh(chat)
        history = []

    user_msg = Message(chat_id=chat.id, role="user", content=payload.question)
    db.add(user_msg)
    db.commit()

    api_key = get_active_key(db, user.id, payload.provider)
    provider = get_provider(payload.provider, api_key, payload.model)

    messages = build_sports_prompt(payload.sport, payload.question, history)
    answer = await provider.chat(messages)

    assistant_msg = Message(chat_id=chat.id, role="assistant", content=answer)
    db.add(assistant_msg)
    db.commit()

    return SportsChatResponse(answer=answer, chat_id=chat.id)
