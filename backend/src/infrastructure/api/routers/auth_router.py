from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.auth_schema import (
    UsuarioRegistro,
    UsuarioLogin,
    Token,
    UsuarioResponse
)
from src.application.use_cases import auth_service
from src.infrastructure.security import create_access_token, get_current_user
from src.infrastructure.database.orm_models import Usuario

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar(registro: UsuarioRegistro, db: Session = Depends(get_db)):
    """
    Registra un usuario institucional nuevo.
    """
    try:
        usuario = auth_service.registrar_usuario(db, registro)
        return usuario
    except ValueError as e:
        # 400 Bad Request para correos duplicados o roles incorrectos
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
def login(credenciales: UsuarioLogin, db: Session = Depends(get_db)):
    """
    Inicia sesión y devuelve un token de acceso JWT.
    """
    try:
        usuario = auth_service.autenticar_usuario(db, credenciales)
        # Crear token de acceso con el email (sub) y rol del usuario
        access_token = create_access_token(
            data={"sub": usuario.email_institucional, "rol": usuario.rol_clave}
        )
        return Token(
            access_token=access_token,
            token_type="bearer",
            email=usuario.email_institucional,
            rol=usuario.rol_clave
        )
    except ValueError as e:
        # 401 Unauthorized para credenciales inválidas
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/me", response_model=UsuarioResponse)
def obtener_perfil(current_user: Usuario = Depends(get_current_user)):
    """
    Obtiene la información del usuario autenticado actual.
    """
    # Mapeamos la relación para devolver la clave del rol
    current_user.rol_clave = current_user.rol.clave if current_user.rol else None
    return current_user
