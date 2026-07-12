from datetime import datetime
from pydantic import BaseModel
from typing import Any


class CSVProjectOut(BaseModel):
    id: str
    name: str
    table_names: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class CSVChatRequest(BaseModel):
    project_id: str
    question: str
    provider: str = "openai"
    model: str | None = None


class ChartSpec(BaseModel):
    type: str  # bar | line | scatter | pie etc.
    figure_json: str  # Plotly figure as JSON string


class CSVChatResponse(BaseModel):
    answer: str
    sql: str | None = None
    result_preview: list[dict[str, Any]] | None = None
    chart: ChartSpec | None = None
