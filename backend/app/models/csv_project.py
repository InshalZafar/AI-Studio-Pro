from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from app.models.user import gen_uuid


class CSVProject(Base):
    __tablename__ = "csv_projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, default="Untitled Project")
    file_paths: Mapped[str] = mapped_column(Text, nullable=False)  # JSON list of paths
    table_names: Mapped[str] = mapped_column(Text, nullable=True)  # JSON list of DuckDB table names
    schema_summary: Mapped[str] = mapped_column(Text, nullable=True)  # cached column/type info
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="csv_projects")
