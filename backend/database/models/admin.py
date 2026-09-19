import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum
from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT


class UserRole(str, enum.Enum):
    superadmin = "superadmin"  # Você - gerencia o app inteiro
    owner = "owner"             # Dono da empresa (cliente)
    admin = "admin"             # Admin da empresa (cliente)
    viewer = "viewer"           # Visualizador (cliente)


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=True)  # Multi-tenant: NULL para superadmin
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(Enum(UserRole, name="userrole"), nullable=False, default=UserRole.owner)
    invite_token = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT)
    
    # Campos para controle de assinatura (futuro)
    is_active = Column(Integer, default=1, nullable=False)  # 1=ativo, 0=suspenso
    subscription_expires_at = Column(DateTime, nullable=True)  # NULL = sem limite
