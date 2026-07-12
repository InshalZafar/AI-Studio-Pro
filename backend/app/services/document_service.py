"""
Document AI (RAG) service — lightweight retrieval using TF-IDF instead of
FAISS + sentence-transformers, to keep local setup fast and torch-free.

Pipeline:
  1. Extract raw text from PDF / DOCX / TXT / MD
  2. Chunk text into overlapping windows
  3. Fit a TF-IDF vectorizer over chunks (per query, cheap for typical doc sizes)
  4. Retrieve top-k chunks most similar to the question
  5. Feed retrieved chunks + question to the chosen AI provider as context
"""
from pathlib import Path
import fitz  # PyMuPDF
import docx as docx_lib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

CHUNK_SIZE = 800  # characters
CHUNK_OVERLAP = 150


def extract_text(file_path: Path, file_type: str) -> str:
    file_type = file_type.lower()
    if file_type == "pdf":
        text_parts = []
        with fitz.open(file_path) as doc:
            for page in doc:
                text_parts.append(page.get_text())
        return "\n".join(text_parts)
    elif file_type == "docx":
        d = docx_lib.Document(str(file_path))
        return "\n".join(p.text for p in d.paragraphs)
    elif file_type in ("txt", "md"):
        return file_path.read_text(encoding="utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return [c.strip() for c in chunks if c.strip()]


def retrieve_top_chunks(
    question: str,
    documents: list[dict],  # [{"document_id", "filename", "chunks": [str, ...]}]
    top_k: int = 5,
) -> list[dict]:
    """
    Builds a flat pool of (doc_id, filename, chunk_text) across all provided documents,
    TF-IDF-vectorizes them together with the question, and returns the top_k most similar.
    """
    pool = []
    for doc in documents:
        for chunk in doc["chunks"]:
            pool.append({"document_id": doc["document_id"], "filename": doc["filename"], "text": chunk})

    if not pool:
        return []

    corpus = [item["text"] for item in pool] + [question]
    vectorizer = TfidfVectorizer(stop_words="english", max_features=20000)
    tfidf_matrix = vectorizer.fit_transform(corpus)

    question_vec = tfidf_matrix[-1]
    chunk_vecs = tfidf_matrix[:-1]
    scores = cosine_similarity(question_vec, chunk_vecs).flatten()

    top_indices = np.argsort(scores)[::-1][:top_k]
    results = []
    for idx in top_indices:
        if scores[idx] <= 0:
            continue
        item = pool[idx]
        results.append({
            "document_id": item["document_id"],
            "filename": item["filename"],
            "chunk_text": item["text"],
            "score": float(scores[idx]),
        })
    return results


def build_rag_prompt(question: str, retrieved_chunks: list[dict]) -> list[dict[str, str]]:
    context_blocks = "\n\n".join(
        f"[Source: {c['filename']}]\n{c['chunk_text']}" for c in retrieved_chunks
    )
    system = (
        "You are a helpful assistant that answers questions strictly using the provided "
        "document excerpts. If the answer isn't in the excerpts, say you don't know. "
        "Always mention which source file(s) you used."
    )
    user = f"Context:\n{context_blocks}\n\nQuestion: {question}"
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
