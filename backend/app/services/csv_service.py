"""
CSV Analytics AI service.
Loads one or more CSVs into DuckDB tables, builds a schema summary,
lets an LLM generate SQL from natural language, executes it, and
optionally renders a Plotly chart from the result.
"""
import json
import re
from pathlib import Path
import duckdb
import pandas as pd
import plotly.express as px


def load_csvs_to_duckdb(con: duckdb.DuckDBPyConnection, file_paths: list[str]) -> list[str]:
    """Registers each CSV as a DuckDB table named after its filename (sanitized). Returns table names."""
    table_names = []
    for path in file_paths:
        p = Path(path)
        table_name = re.sub(r"[^a-zA-Z0-9_]", "_", p.stem).lower()
        # avoid collisions
        base = table_name
        i = 1
        existing = {t[0] for t in con.execute("SHOW TABLES").fetchall()} if table_names else set()
        while table_name in existing:
            table_name = f"{base}_{i}"
            i += 1
        con.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM read_csv_auto(?)", [str(p)])
        table_names.append(table_name)
    return table_names


def build_schema_summary(con: duckdb.DuckDBPyConnection, table_names: list[str]) -> str:
    """Produces a human/LLM-readable summary of columns + types + sample rows for each table."""
    parts = []
    for t in table_names:
        cols = con.execute(f"DESCRIBE {t}").fetchdf()
        sample = con.execute(f"SELECT * FROM {t} LIMIT 3").fetchdf()
        parts.append(
            f"Table `{t}`:\n"
            f"Columns: {', '.join(f'{r.column_name} ({r.column_type})' for r in cols.itertuples())}\n"
            f"Sample rows:\n{sample.to_string(index=False)}"
        )
    return "\n\n".join(parts)


def build_sql_prompt(question: str, schema_summary: str) -> list[dict[str, str]]:
    system = (
        "You are a data analyst assistant. Given a DuckDB SQL schema and a natural-language "
        "question, respond with a JSON object with exactly these keys:\n"
        '  "sql": a single valid DuckDB SQL query answering the question,\n'
        '  "explanation": a short plain-English explanation of the answer,\n'
        '  "chart_type": one of "bar", "line", "scatter", "pie", or null if a chart doesn\'t make sense.\n'
        "Return ONLY the JSON object, no markdown fences, no extra text."
    )
    user = f"Schema:\n{schema_summary}\n\nQuestion: {question}"
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def parse_llm_sql_response(raw: str) -> dict:
    cleaned = raw.strip()
    cleaned = re.sub(r"^```json\s*|\s*```$", "", cleaned, flags=re.MULTILINE).strip()
    cleaned = re.sub(r"^```\s*|\s*```$", "", cleaned, flags=re.MULTILINE).strip()
    return json.loads(cleaned)


def execute_sql(con: duckdb.DuckDBPyConnection, sql: str) -> pd.DataFrame:
    return con.execute(sql).fetchdf()


def make_chart(df: pd.DataFrame, chart_type: str | None):
    if not chart_type or df.empty or len(df.columns) < 2:
        return None
    x_col, y_col = df.columns[0], df.columns[1]
    try:
        if chart_type == "bar":
            fig = px.bar(df, x=x_col, y=y_col)
        elif chart_type == "line":
            fig = px.line(df, x=x_col, y=y_col)
        elif chart_type == "scatter":
            fig = px.scatter(df, x=x_col, y=y_col)
        elif chart_type == "pie":
            fig = px.pie(df, names=x_col, values=y_col)
        else:
            return None
        return fig.to_json()
    except Exception:  # noqa: BLE001
        return None
