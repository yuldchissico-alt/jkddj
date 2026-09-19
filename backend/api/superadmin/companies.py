"""
Painel Super Admin - Gerenciamento de empresas/clientes do SaaS.
Apenas usuários com role=superadmin podem acessar.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from database.core.connection import get_db
from database.models.admin import Admin, UserRole
from database.models.transaction import Transaction, TransactionStatus
from database.models.customer import Customer
from database.models.product import Product
from api.auth.deps import get_current_user

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


def require_superadmin(current_user: Admin = Depends(get_current_user)) -> Admin:
    """Verifica se o usuário é superadmin."""
    if current_user.role != UserRole.superadmin:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado. Apenas super administradores."
        )
    return current_user


class CompanyStats(BaseModel):
    company_id: int
    owner_name: str
    owner_email: str
    is_active: bool
    created_at: datetime
    
    # Estatísticas
    total_users: int
    total_products: int
    total_customers: int
    total_transactions: int
    total_revenue: float
    
    # Assinatura (futuro)
    subscription_expires_at: Optional[datetime] = None


class CompanySuspendRequest(BaseModel):
    is_active: bool  # True=ativar, False=suspender


@router.get("/companies", response_model=list[CompanyStats])
def list_all_companies(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_superadmin),
):
    """
    Lista todas as empresas cadastradas no sistema.
    Retorna estatísticas de uso para análise.
    """
    # Buscar todos os owners (1 por empresa)
    owners = db.query(Admin).filter(
        Admin.role == UserRole.owner,
        Admin.company_id.isnot(None)
    ).order_by(Admin.created_at.desc()).all()
    
    companies = []
    
    for owner in owners:
        company_id = owner.company_id
        
        # Contar usuários da empresa
        total_users = db.query(func.count(Admin.id)).filter(
            Admin.company_id == company_id
        ).scalar() or 0
        
        # Contar produtos
        total_products = db.query(func.count(Product.id)).filter(
            Product.company_id == company_id
        ).scalar() or 0
        
        # Contar clientes
        total_customers = db.query(func.count(Customer.id)).filter(
            Customer.company_id == company_id
        ).scalar() or 0
        
        # Contar transações aprovadas
        total_transactions = db.query(func.count(Transaction.id)).filter(
            Transaction.company_id == company_id,
            Transaction.status == TransactionStatus.APPROVED
        ).scalar() or 0
        
        # Somar receita
        total_revenue = db.query(func.sum(Transaction.amount)).filter(
            Transaction.company_id == company_id,
            Transaction.status == TransactionStatus.APPROVED
        ).scalar() or 0.0
        
        companies.append(CompanyStats(
            company_id=company_id,
            owner_name=owner.name,
            owner_email=owner.email or "",
            is_active=owner.is_active == 1,
            created_at=owner.created_at,
            total_users=int(total_users),
            total_products=int(total_products),
            total_customers=int(total_customers),
            total_transactions=int(total_transactions),
            total_revenue=float(total_revenue),
            subscription_expires_at=owner.subscription_expires_at,
        ))
    
    return companies


@router.patch("/companies/{company_id}/status")
def toggle_company_status(
    company_id: int,
    payload: CompanySuspendRequest,
    db: Session = Depends(get_db),
    _: Admin = Depends(require_superadmin),
):
    """
    Ativa ou suspende uma empresa.
    Suspender bloqueia acesso de todos usuários da empresa.
    """
    # Atualizar todos os usuários da empresa
    users = db.query(Admin).filter(Admin.company_id == company_id).all()
    
    if not users:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    for user in users:
        user.is_active = 1 if payload.is_active else 0
    
    db.commit()
    
    status_text = "ativada" if payload.is_active else "suspensa"
    return {"message": f"Empresa {company_id} {status_text} com sucesso"}


@router.get("/stats")
def get_global_stats(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_superadmin),
):
    """
    Estatísticas globais do SaaS (todas as empresas).
    """
    total_companies = db.query(func.count(func.distinct(Admin.company_id))).filter(
        Admin.company_id.isnot(None)
    ).scalar() or 0
    
    active_companies = db.query(func.count(func.distinct(Admin.company_id))).filter(
        Admin.company_id.isnot(None),
        Admin.is_active == 1
    ).scalar() or 0
    
    total_users = db.query(func.count(Admin.id)).filter(
        Admin.company_id.isnot(None)
    ).scalar() or 0
    
    total_revenue = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == TransactionStatus.APPROVED
    ).scalar() or 0.0
    
    total_transactions = db.query(func.count(Transaction.id)).filter(
        Transaction.status == TransactionStatus.APPROVED
    ).scalar() or 0
    
    return {
        "total_companies": int(total_companies),
        "active_companies": int(active_companies),
        "suspended_companies": int(total_companies) - int(active_companies),
        "total_users": int(total_users),
        "total_revenue": float(total_revenue),
        "total_transactions": int(total_transactions),
        "avg_revenue_per_company": float(total_revenue) / max(int(total_companies), 1),
    }
