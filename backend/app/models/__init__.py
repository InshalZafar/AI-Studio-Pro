"""
Import all models here so that Base.metadata.create_all() picks them up.
"""
from app.models.user import User
from app.models.chat import Chat, Message
from app.models.document import UploadedDocument
from app.models.csv_project import CSVProject
from app.models.recipe import RecipeHistory
from app.models.api_setting import APISetting

__all__ = [
    "User",
    "Chat",
    "Message",
    "UploadedDocument",
    "CSVProject",
    "RecipeHistory",
    "APISetting",
]
