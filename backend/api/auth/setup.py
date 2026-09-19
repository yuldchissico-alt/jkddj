from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from database.core.connection import get_db
from database.models.admin import Admin, UserRole

router = APIRouter()


class SetupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str


class InviteSetupRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str


class SetupStatusResponse(BaseModel):
    is_configured: bool


class InviteInfoResponse(BaseModel):
    name: str
    role: str


@router.get("/setup/status", response_model=SetupStatusResponse)
def setup_status(db: Session = Depends(get_db)):
    """
    Sempre retorna is_configured=False para permitir signups públicos.
    No modelo SaaS, setup está sempre disponível para novos usuários.
    """
    return {"is_configured": False}


@router.get("/setup/invite/{token}", response_model=InviteInfoResponse)
def get_invite_info(token: str, db: Session = Depends(get_db)):
    """Return name and role for an invite token (no auth needed)."""
    invite = db.query(Admin).filter(Admin.invite_token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Convite inválido ou expirado")
    return {"name": invite.name, "role": invite.role.value}


@router.post("/setup")
def create_admin(data: SetupRequest, db: Session = Depends(get_db)):
    """
    Public signup – qualquer pessoa pode criar sua empresa.
    Cada signup cria um novo company_id isolado (modelo SaaS).
    """
    try:
        # Verificar se email já existe
        existing = db.query(Admin).filter(Admin.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")

        if data.password != data.confirm_password:
            raise HTTPException(status_code=400, detail="Senhas não coincidem")

        if len(data.password) < 6:
            raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")

        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(data.password.encode("utf-8"), salt).decode("utf-8")

        # Gerar novo company_id único (auto-incremento)
        # Filtrar apenas company_id NOT NULL (ignorar superadmin)
        max_company = db.query(Admin).filter(
            Admin.company_id.isnot(None)
        ).order_by(Admin.company_id.desc()).first()
        new_company_id = (max_company.company_id + 1) if max_company and max_company.company_id else 1

        admin = Admin(
            name=data.name,
            email=data.email,
            password_hash=hashed_password,
            role=UserRole.owner,  # Cada signup vira owner da própria empresa
            company_id=new_company_id,  # SaaS: cada empresa isolada
            is_active=1,  # Explicitamente definir is_active
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return {"message": "Conta criada com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao criar conta: {str(e)}")


@router.post("/setup/invite/{token}")
def complete_invite(token: str, data: InviteSetupRequest, db: Session = Depends(get_db)):
    """Complete an invite – convidado sets email + password."""
    invite = db.query(Admin).filter(Admin.invite_token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Convite inválido ou expirado")

    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não coincidem")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")

    # Check if email is already taken
    existing = db.query(Admin).filter(Admin.email == data.email, Admin.id != invite.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já está em uso")

    salt = bcrypt.gensalt()
    invite.email = data.email
    invite.password_hash = bcrypt.hashpw(data.password.encode("utf-8"), salt).decode("utf-8")
    invite.invite_token = None  # consume the token
    db.commit()

    return {"message": "Conta criada com sucesso"}
