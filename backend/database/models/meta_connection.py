from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT, UPDATED_AT_DEFAULT


class MetaConnection(Base):
    """Conexão OAuth da Meta/Facebook vinculada ao usuário da empresa."""

    __tablename__ = "meta_connections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    account_id = Column(String(120), nullable=True)
    account_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    scope = Column(Text, nullable=True)
    permissions = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="not_connected")
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT)
    updated_at = Column(DateTime, server_default=UPDATED_AT_DEFAULT, onupdate=UPDATED_AT_DEFAULT)
