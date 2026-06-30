#from fastapi import APIRouter, Depends, HTTPException, status
#from sqlalchemy.orm import Session
#from src.infrastructure.database.database import get_db
#from src.infrastructure.api.schemas.auth_schema import (
#    UsuarioRegistro,
#    UsuarioLogin,
#    Token,
#    UsuarioResponse
#)
#from src.application.use_cases import auth_service
#from src.infrastructure.security import create_access_token, get_current_user
#from src.infrastructure.database.orm_models import Usuario
#
#router = APIRouter(prefix="/api/auth", tags=["Autenticación"])
#
#@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
#def registrar(registro: UsuarioRegistro, db: Session = Depends(get_db)):
#    """
#    Registra un usuario institucional nuevo.
#    """
#    try:
#        usuario = auth_service.registrar_usuario(db, registro)
#        return usuario
#    except ValueError as e:
#        # 400 Bad Request para correos duplicados o roles incorrectos
#        raise HTTPException(
#            status_code=status.HTTP_400_BAD_REQUEST,
#            detail=str(e)
#        )
#
#@router.post("/login", response_model=Token)
#def login(credenciales: UsuarioLogin, db: Session = Depends(get_db)):
#    """
#    Inicia sesión y devuelve un token de acceso JWT.
#    """
#    try:
#        usuario = auth_service.autenticar_usuario(db, credenciales)
#        # Crear token de acceso con el email (sub) y rol del usuario
#        access_token = create_access_token(
#            data={"sub": usuario.email_institucional, "rol": usuario.rol_clave}
#        )
#        return Token(
#            access_token=access_token,
#            token_type="bearer",
#            email=usuario.email_institucional,
#            rol=usuario.rol_clave
#        )
#    except ValueError as e:
#        # 401 Unauthorized para credenciales inválidas
#        raise HTTPException(
#            status_code=status.HTTP_401_UNAUTHORIZED,
#            detail=str(e),
#            headers={"WWW-Authenticate": "Bearer"},
#        )
#
#@router.get("/me", response_model=UsuarioResponse)
#def obtener_perfil(current_user: Usuario = Depends(get_current_user)):
#    """
#    Obtiene la información del usuario autenticado actual.
#    """
#    # Mapeamos la relación para devolver la clave del rol
#    current_user.rol_clave = current_user.rol.clave if current_user.rol else None
#    return current_user


# EJEMPLO DEL ROUTER USANDO UN LOGGER

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from src.infrastructure.database.database import get_db
from typing import List
from src.infrastructure.api.schemas.auth_schema import (
    UsuarioRegistro,
    UsuarioLogin,
    Token,
    UsuarioResponse,
    RolResponse,
    CambiarRolRequest,
    CambiarPasswordPropiaRequest,
    RestablecerPasswordRequest
)
from src.application.use_cases import auth_service
from src.infrastructure.security import create_access_token, get_current_user, require_roles
from src.infrastructure.database.orm_models import Usuario
from src.application.ports.output.logger_port import LoggerPort

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


def get_logger(request: Request) -> LoggerPort:
    """Inyecta el logger desde el estado de la aplicación."""
    logger = getattr(request.app.state, "logger", None)
    if logger is None:
        from src.infrastructure.adapters.output.logging.console_logger_adapter import ConsoleLoggerAdapter
        return ConsoleLoggerAdapter()
    return logger


@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles(["SUPER_ADMIN"]))])
def registrar(
    registro: UsuarioRegistro,
    request: Request,
    db: Session = Depends(get_db),
    logger: LoggerPort = Depends(get_logger),
):
    """Registra un usuario institucional nuevo."""
    trace_id = getattr(request.state, "trace_id", None)
    try:
        logger.info(
            f"Intentando registrar usuario: {registro.email_institucional}",
            context={"email": registro.email_institucional},
            trace_id=trace_id,
        )
        usuario = auth_service.registrar_usuario(db, registro)
        logger.info(
            f"Usuario registrado exitosamente: {usuario.email_institucional}",
            context={"usuario_id": usuario.id},
            trace_id=trace_id,
        )
        return usuario
    except ValueError as e:
        logger.warning(
            f"Error al registrar usuario: {str(e)}",
            context={"email": registro.email_institucional, "error": str(e)},
            trace_id=trace_id,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
def login(
    credenciales: UsuarioLogin,
    request: Request,
    db: Session = Depends(get_db),
    logger: LoggerPort = Depends(get_logger),
):
    """Inicia sesión y devuelve un token de acceso JWT."""
    trace_id = getattr(request.state, "trace_id", None)
    try:
        logger.info(
            f"Intentando login: {credenciales.email_institucional}",
            context={"email": credenciales.email_institucional},
            trace_id=trace_id,
        )
        usuario = auth_service.autenticar_usuario(db, credenciales)
        access_token = create_access_token(
            data={"sub": usuario.email_institucional, "rol": usuario.rol_clave}
        )
        logger.info(
            f"Login exitoso: {usuario.email_institucional}",
            context={"usuario_id": usuario.id, "rol": usuario.rol_clave},
            trace_id=trace_id,
        )
        return Token(
            access_token=access_token,
            token_type="bearer",
            email=usuario.email_institucional,
            rol=usuario.rol_clave
        )
    except ValueError as e:
        logger.warning(
            f"Fallo de autenticación: {str(e)}",
            context={"email": credenciales.email_institucional, "error": str(e)},
            trace_id=trace_id,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me", response_model=UsuarioResponse)
def obtener_perfil(
    request: Request,
    current_user: Usuario = Depends(get_current_user),
    logger: LoggerPort = Depends(get_logger),
):
    """Obtiene la información del usuario autenticado actual."""
    trace_id = getattr(request.state, "trace_id", None)
    try:
        logger.info(
            f"Obteniendo perfil del usuario: {current_user.email_institucional}",
            context={"usuario_id": current_user.id},
            trace_id=trace_id,
        )
        current_user.rol_clave = current_user.rol.clave if current_user.rol else None
        current_user.rol_nombre = current_user.rol.nombre if current_user.rol else None
        return current_user
    except Exception as e:
        logger.error(
            f"Error al obtener perfil: {str(e)}",
            context={"usuario_id": current_user.id, "error": str(e)},
            trace_id=trace_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener el perfil del usuario"
        )


@router.get("/usuarios", response_model=List[UsuarioResponse], dependencies=[Depends(require_roles(["SUPER_ADMIN"]))])
def listar_usuarios(db: Session = Depends(get_db)):
    """
    Retorna la lista de todos los usuarios registrados (solo SUPER_ADMIN).
    """
    return auth_service.obtener_usuarios(db)


@router.get("/roles", response_model=List[RolResponse], dependencies=[Depends(require_roles(["SUPER_ADMIN"]))])
def listar_roles(db: Session = Depends(get_db)):
    """
    Retorna todos los roles del sistema (solo SUPER_ADMIN).
    """
    return auth_service.obtener_roles(db)


@router.patch("/usuarios/{usuario_id}/toggle-activo", response_model=UsuarioResponse, dependencies=[Depends(require_roles(["SUPER_ADMIN"]))])
def toggle_usuario_activo(usuario_id: int, db: Session = Depends(get_db)):
    """
    Alterna el estado activo/inactivo de un usuario (solo SUPER_ADMIN).
    """
    try:
        return auth_service.cambiar_estado_usuario(db, usuario_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/usuarios/{usuario_id}/rol", response_model=UsuarioResponse, dependencies=[Depends(require_roles(["SUPER_ADMIN"]))])
def actualizar_usuario_rol(usuario_id: int, body: CambiarRolRequest, db: Session = Depends(get_db)):
    """
    Modifica el rol de un usuario (solo SUPER_ADMIN).
    """
    try:
        return auth_service.cambiar_rol_usuario(db, usuario_id, body.clave_rol)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/usuarios/{usuario_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_roles(["SUPER_ADMIN"]))])
def borrar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """
    Elimina físicamente un usuario del sistema (solo SUPER_ADMIN).
    """
    try:
        auth_service.eliminar_usuario(db, usuario_id)
        return {"message": "Usuario eliminado exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/usuarios/{usuario_id}/reset-password", response_model=UsuarioResponse, dependencies=[Depends(require_roles(["SUPER_ADMIN"]))])
def restablecer_usuario_password(usuario_id: int, body: RestablecerPasswordRequest, db: Session = Depends(get_db)):
    """
    Restablece la contraseña de un usuario (solo SUPER_ADMIN).
    """
    try:
        return auth_service.restablecer_password(db, usuario_id, body.nueva_password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/usuarios/me/change-password", response_model=UsuarioResponse)
def cambiar_mi_password(body: CambiarPasswordPropiaRequest, current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Permite a cualquier usuario autenticado cambiar su propia contraseña.
    """
    try:
        return auth_service.cambiar_password_propia(db, current_user.id, body.password_actual, body.nueva_password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))