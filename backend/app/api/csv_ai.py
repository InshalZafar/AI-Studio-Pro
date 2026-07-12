import json
import shutil
import uuid
from pathlib import Path

import duckdb
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.models.user import User
from app.models.csv_project import CSVProject
from app.schemas.csv_ai import CSVProjectOut, CSVChatRequest, CSVChatResponse, ChartSpec
from app.utils.deps import get_current_user
from app.services.settings_service import get_active_key
from app.services.csv_service import (
    load_csvs_to_duckdb, build_schema_summary, build_sql_prompt,
    parse_llm_sql_response, execute_sql, make_chart,
)
from app.ai.factory import get_provider

router = APIRouter(prefix="/api/csv", tags=["CSV Analytics AI"])


@router.get("", response_model=list[CSVProjectOut])
def list_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(CSVProject).filter(CSVProject.user_id == user.id).order_by(
        CSVProject.created_at.desc()
    ).all()


@router.post("/upload", response_model=CSVProjectOut)
async def upload_csvs(
    files: list[UploadFile] = File(...),
    name: str = Form("Untitled Project"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    saved_paths = []
    dest_dir = settings.UPLOAD_DIR / "csv"
    for f in files:
        if not f.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail=f"Not a CSV file: {f.filename}")
        dest_path = dest_dir / f"{uuid.uuid4()}_{f.filename}"
        with dest_path.open("wb") as out:
            shutil.copyfileobj(f.file, out)
        saved_paths.append(str(dest_path))

    # Build an in-memory DuckDB just to derive schema summary + table names up front
    con = duckdb.connect(database=":memory:")
    table_names = load_csvs_to_duckdb(con, saved_paths)
    schema_summary = build_schema_summary(con, table_names)
    con.close()

    project = CSVProject(
        user_id=user.id,
        name=name,
        file_paths=json.dumps(saved_paths),
        table_names=json.dumps(table_names),
        schema_summary=schema_summary,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = db.query(CSVProject).filter(CSVProject.id == project_id, CSVProject.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    for path in json.loads(project.file_paths):
        try:
            Path(path).unlink(missing_ok=True)
        except Exception:  # noqa: BLE001
            pass
    db.delete(project)
    db.commit()
    return None


@router.post("/chat", response_model=CSVChatResponse)
async def chat_with_csv(
    payload: CSVChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = db.query(CSVProject).filter(
        CSVProject.id == payload.project_id, CSVProject.user_id == user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    file_paths = json.loads(project.file_paths)
    con = duckdb.connect(database=":memory:")
    table_names = load_csvs_to_duckdb(con, file_paths)

    api_key = get_active_key(db, user.id, payload.provider)
    provider = get_provider(payload.provider, api_key, payload.model)

    messages = build_sql_prompt(payload.question, project.schema_summary or "")
    raw = await provider.chat(messages)

    try:
        parsed = parse_llm_sql_response(raw)
        sql = parsed.get("sql", "")
        explanation = parsed.get("explanation", "")
        chart_type = parsed.get("chart_type")
    except Exception:
        con.close()
        # Fall back to just returning the raw answer if JSON parsing fails
        return CSVChatResponse(answer=raw, sql=None, result_preview=None, chart=None)

    chart_spec = None
    result_preview = None
    try:
        df = execute_sql(con, sql)
        result_preview = df.head(50).to_dict(orient="records")
        chart_json = make_chart(df, chart_type)
        if chart_json:
            chart_spec = ChartSpec(type=chart_type, figure_json=chart_json)
    except Exception as e:  # noqa: BLE001
        explanation += f"\n\n(Note: SQL execution failed: {e})"
    finally:
        con.close()

    return CSVChatResponse(answer=explanation, sql=sql, result_preview=result_preview, chart=chart_spec)
