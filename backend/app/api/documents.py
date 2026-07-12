from pathlib import Path
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.models.user import User
from app.models.document import UploadedDocument
from app.models.chat import Chat, Message
from app.schemas.document import DocumentOut, DocumentChatRequest, DocumentChatResponse, SourceCitation
from app.utils.deps import get_current_user
from app.services.settings_service import get_active_key
from app.services.document_service import extract_text, chunk_text, retrieve_top_chunks, build_rag_prompt
from app.ai.factory import get_provider

router = APIRouter(prefix="/api/documents", tags=["Document AI"])

ALLOWED_TYPES = {"pdf", "docx", "txt", "md"}


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(UploadedDocument).filter(UploadedDocument.user_id == user.id).order_by(
        UploadedDocument.created_at.desc()
    ).all()


@router.post("/upload", response_model=list[DocumentOut])
async def upload_documents(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    saved_docs = []
    for f in files:
        ext = (f.filename.rsplit(".", 1)[-1] if "." in f.filename else "").lower()
        if ext not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {f.filename}")

        dest_dir = settings.UPLOAD_DIR / "documents"
        dest_path = dest_dir / f"{uuid.uuid4()}_{f.filename}"
        with dest_path.open("wb") as out:
            shutil.copyfileobj(f.file, out)

        text = extract_text(dest_path, ext)
        chunks = chunk_text(text)

        doc = UploadedDocument(
            user_id=user.id,
            filename=f.filename,
            file_path=str(dest_path),
            file_type=ext,
            extracted_text=text,
            chunk_count=len(chunks),
        )
        db.add(doc)
        saved_docs.append(doc)

    db.commit()
    for d in saved_docs:
        db.refresh(d)
    return saved_docs


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc = db.query(UploadedDocument).filter(
        UploadedDocument.id == document_id, UploadedDocument.user_id == user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    try:
        Path(doc.file_path).unlink(missing_ok=True)
    except Exception:  # noqa: BLE001
        pass
    db.delete(doc)
    db.commit()
    return None


@router.post("/chat", response_model=DocumentChatResponse)
async def chat_with_documents(
    payload: DocumentChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    docs = db.query(UploadedDocument).filter(
        UploadedDocument.id.in_(payload.document_ids), UploadedDocument.user_id == user.id
    ).all()
    if not docs:
        raise HTTPException(status_code=404, detail="No matching documents found.")

    doc_chunks = [
        {
            "document_id": d.id,
            "filename": d.filename,
            "chunks": chunk_text(d.extracted_text or ""),
        }
        for d in docs
    ]

    retrieved = retrieve_top_chunks(payload.question, doc_chunks, top_k=5)
    messages = build_rag_prompt(payload.question, retrieved)

    # Chat history / persistence (module="document")
    if payload.chat_id:
        chat = db.query(Chat).filter(Chat.id == payload.chat_id, Chat.user_id == user.id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found.")
    else:
        title = payload.question[:50] + ("..." if len(payload.question) > 50 else "")
        chat = Chat(user_id=user.id, title=title, module="document", provider=payload.provider)
        db.add(chat)
        db.commit()
        db.refresh(chat)

    user_msg = Message(chat_id=chat.id, role="user", content=payload.question)
    db.add(user_msg)
    db.commit()

    api_key = get_active_key(db, user.id, payload.provider)
    provider = get_provider(payload.provider, api_key, payload.model)
    answer = await provider.chat(messages)

    assistant_msg = Message(chat_id=chat.id, role="assistant", content=answer)
    db.add(assistant_msg)
    db.commit()

    return DocumentChatResponse(
        answer=answer,
        sources=[SourceCitation(**r) for r in retrieved],
        chat_id=chat.id,
    )
