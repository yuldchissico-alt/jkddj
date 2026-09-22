"""
Endpoint para verificar o status da configuração do Gemini.
Retorna se há contas configuradas e qual está ativa.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.core.connection import get_db
from database.models.gemini_account import GeminiAccount
from api.auth.deps import get_current_user, get_company_id

router = APIRouter(prefix="/gemini", tags=["gemini"])


@router.get("/status")
def get_gemini_status(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    """
    Retorna o status da configuração do Gemini:
    - Se há conta configurada
    - Quantas contas existem
    - Qual modelo está ativo
    """
    # Por enquanto, GeminiAccount não tem company_id (migração futura)
    # Então vamos buscar todas e retornar a primeira
    accounts = db.query(GeminiAccount).order_by(GeminiAccount.id.desc()).all()
    
    if not accounts:
        return {
            "configured": False,
            "account_count": 0,
            "active_model": None,
        }
    
    active = accounts[0]
    return {
        "configured": True,
        "account_count": len(accounts),
        "active_model": active.model,
        "active_account_name": active.name,
    }
