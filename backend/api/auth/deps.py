from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.core.connection import get_db
from api.auth.token import verify_token
from database.models.admin import Admin, UserRole

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Admin:
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin_id = payload.get("sub")
    if admin_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar se a conta está ativa (não suspensa)
    if admin.is_active == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta suspensa. Entre em contato com o suporte.",
        )

    return admin


def get_company_id(current_user: Admin = Depends(get_current_user)) -> int:
    """
    Retorna o company_id do usuário logado.
    Usado para filtrar dados no sistema multi-tenant.
    Superadmin (company_id=NULL) não pode usar rotas de empresa.
    """
    if current_user.company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin não tem acesso a dados de empresas. Use o painel super admin.",
        )
    return current_user.company_id


def require_role(*roles: UserRole):
    """Dependency that checks if the current user has one of the required roles."""
    def _check(current_user: Admin = Depends(get_current_user)) -> Admin:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso",
            )
        return current_user
    return _check
