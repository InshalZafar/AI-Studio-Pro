import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.chat import Chat, Message
from app.schemas.chat import (
    ChatOut, ChatDetailOut, ChatCreate, ChatRename, ChatSendRequest,
)
from app.utils.deps import get_current_user
from app.services.settings_service import get_active_key
from app.ai.factory import get_provider

router = APIRouter(prefix="/api/chat", tags=["General AI"])


@router.get("/conversations", response_model=list[ChatOut])
def list_chats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Chat)
        .filter(Chat.user_id == user.id, Chat.module == "general")
        .order_by(Chat.updated_at.desc())
        .all()
    )


@router.get("/conversations/{chat_id}", response_model=ChatDetailOut)
def get_chat(chat_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return chat


@router.post("/conversations", response_model=ChatOut, status_code=201)
def create_chat(payload: ChatCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chat = Chat(user_id=user.id, title=payload.title or "New Chat", module="general", provider=payload.provider)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


@router.patch("/conversations/{chat_id}", response_model=ChatOut)
def rename_chat(chat_id: str, payload: ChatRename, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    chat.title = payload.title
    db.commit()
    db.refresh(chat)
    return chat


@router.delete("/conversations/{chat_id}", status_code=204)
def delete_chat(chat_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    db.delete(chat)
    db.commit()
    return None


@router.post("")
async def send_message(payload: ChatSendRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Sends a message in a (possibly new) chat. Streams the assistant's reply as
    text/event-stream chunks if payload.stream is True, otherwise returns full JSON.
    """
    if payload.chat_id:
        chat = db.query(Chat).filter(Chat.id == payload.chat_id, Chat.user_id == user.id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found.")
    else:
        title = payload.message[:50] + ("..." if len(payload.message) > 50 else "")
        chat = Chat(user_id=user.id, title=title, module="general", provider=payload.provider)
        db.add(chat)
        db.commit()
        db.refresh(chat)

    # Save user message
    user_msg = Message(chat_id=chat.id, role="user", content=payload.message)
    db.add(user_msg)
    db.commit()

    # Build conversation history
    history = [{"role": m.role, "content": m.content} for m in chat.messages]

    api_key = get_active_key(db, user.id, payload.provider)
    provider = get_provider(payload.provider, api_key, payload.model)

    if payload.stream:
        async def event_generator():
            full_response = ""
            try:
                async for chunk in provider.chat_stream(history):
                    full_response += chunk
                    yield f"data: {json.dumps({'chunk': chunk, 'chat_id': chat.id})}\n\n"
            except Exception as e:  # noqa: BLE001
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                return
            # Save assistant message once streaming completes
            assistant_msg = Message(chat_id=chat.id, role="assistant", content=full_response)
            db.add(assistant_msg)
            chat.title = chat.title  # touch for updated_at
            db.commit()
            yield f"data: {json.dumps({'done': True, 'chat_id': chat.id})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
    else:
        reply = await provider.chat(history)
        assistant_msg = Message(chat_id=chat.id, role="assistant", content=reply)
        db.add(assistant_msg)
        db.commit()
        return {"chat_id": chat.id, "reply": reply}
