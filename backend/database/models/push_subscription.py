from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from database.core.connection import Base


class PushSubscription(Base):
    """
    Armazena subscrições de push notifications dos usuários.
    Cada dispositivo/navegador terá uma subscrição única.
    """
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Multi-tenant
    company_id = Column(Integer, nullable=True, index=True)
    
    # Identificador do usuário/admin (pode ser None para subscrições anônimas)
    user_id = Column(Integer, nullable=True)
    
    # Endpoint da subscrição (URL única fornecida pelo navegador)
    endpoint = Column(Text, nullable=False, unique=True)
    
    # Chaves de autenticação (JSON stringificado)
    p256dh = Column(Text, nullable=False)
    auth = Column(Text, nullable=False)
    
    # Metadados
    user_agent = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "endpoint": self.endpoint,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
