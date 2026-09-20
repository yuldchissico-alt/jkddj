from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, ForeignKey
from database.core.connection import Base
from database.core.timezone import CREATED_AT_DEFAULT, UPDATED_AT_DEFAULT


class UTMClick(Base):
    """Registro de clique em link com parâmteros UTM."""

    __tablename__ = "utm_clicks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    campaign_id = Column(String(255), nullable=True, index=True)
    campaign_name = Column(String(255), nullable=True)
    source = Column(String(255), nullable=True)
    medium = Column(String(255), nullable=True)
    campaign = Column(String(255), nullable=True)
    content = Column(String(255), nullable=True)
    term = Column(String(255), nullable=True)
    landing_url = Column(Text, nullable=True)
    referrer = Column(Text, nullable=True)
    page_url = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(Text, nullable=True)
    tracking_id = Column(String(255), nullable=True, index=True)
    click_hash = Column(String(64), nullable=True, index=True)
    is_conversion = Column(Boolean, default=False, nullable=False, server_default="false")
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT)
    updated_at = Column(DateTime, server_default=UPDATED_AT_DEFAULT, onupdate=UPDATED_AT_DEFAULT)


class UTMConversion(Base):
    """Conversões vinculadas a clique de campanha."""

    __tablename__ = "utm_conversions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, nullable=True, index=True)
    click_id = Column(Integer, ForeignKey("utm_clicks.id"), nullable=True, index=True)
    campaign_id = Column(String(255), nullable=True, index=True)
    campaign_name = Column(String(255), nullable=True)
    source = Column(String(255), nullable=True)
    medium = Column(String(255), nullable=True)
    campaign = Column(String(255), nullable=True)
    content = Column(String(255), nullable=True)
    term = Column(String(255), nullable=True)
    conversion_type = Column(String(120), nullable=True)
    value = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="BRL", nullable=False)
    reference = Column(String(255), nullable=True)
    payload = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=CREATED_AT_DEFAULT)
