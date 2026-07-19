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
    RestablecerPasswordRequest,
    UsuarioCreadoResponse,
    DocentePADUpdateRequest
)
from src.application.utils.pdf_cifrado import generar_pdf_credenciales_protegido
from src.infrastructure.api.schemas.docentes_schema import DocenteResponse
from src.infrastructure.database.orm_models import Docente
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


@router.post("/registro", response_model=UsuarioCreadoResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles(["SUPER_ADMIN"]))])
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
        usuario, password_usada = auth_service.registrar_usuario(db, registro)
        
        # Simulación de correo con PDF cifrado si es un docente vinculado
        pdf_simulado = False
        if registro.clave_rol.upper() == "DOCENTE" and registro.docente_id:
            docente = db.query(Docente).filter(Docente.id == registro.docente_id).first()
            if docente:
                # Generación del PDF protegido (cifrado con plaza)
                pdf_bytes = generar_pdf_credenciales_protegido(
                    registro.email_institucional, password_usada, docente.plaza  #type: ignore
                )
                pdf_simulado = True
                print("======================================================================")
                print("SIMULACIÓN DE ENVÍO DE CORREO INSTITUCIONAL PROTEGIDO - SIPAD")
                print(f"Para: {registro.email_institucional}")
                print("Asunto: Bienvenido a SIPAD - Credenciales de Acceso")
                print("Mensaje: Se adjunta tu oficio de credenciales cifrado.")
                print(f"Contraseña temporal de primer ingreso: {password_usada}")
                print(f"Contraseña de apertura del PDF: Plaza del docente ({docente.plaza})")
                print(f"Tamaño del adjunto PDF cifrado: {len(pdf_bytes)} bytes")
                print("======================================================================")

        logger.info(
            f"Usuario registrado exitosamente: {usuario.email_institucional}",
            context={"usuario_id": usuario.id},
            trace_id=trace_id,
        )
        return {
            "usuario": usuario,
            "password_temporal": password_usada,
            "pdf_adjunto_cifrado_simulado": pdf_simulado
        }
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


@router.get("/usuarios/docentes-sin-usuario", response_model=List[DocenteResponse], dependencies=[Depends(require_roles(["SUPER_ADMIN"]))])
def listar_docentes_sin_usuario(db: Session = Depends(get_db)):
    """Retorna la lista de docentes activos que no tienen cuenta de usuario vinculada."""
    return auth_service.obtener_docentes_sin_usuario(db)


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
            data={
                "sub": usuario.email_institucional,
                "rol": usuario.rol_clave,
                "nombre": usuario.nombre,
                "unidad_id": usuario.unidad_academica_id,
                "unidad_nombre": usuario.unidad_academica_nombre,
                "unidad_clave": usuario.unidad_academica_clave,
            }
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
            rol=usuario.rol_clave,
            nombre=usuario.nombre,
            unidad_academica_id=usuario.unidad_academica_id,
            unidad_academica_nombre=usuario.unidad_academica_nombre,
            unidad_academica_clave=usuario.unidad_academica_clave,
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
        if current_user.docente:
            current_user.nombre = f"{current_user.docente.nombre} {current_user.docente.apellidos}"
        current_user.unidad_academica_id = current_user.unidad_academica.id if current_user.unidad_academica else None
        current_user.unidad_academica_nombre = current_user.unidad_academica.nombre if current_user.unidad_academica else None
        current_user.unidad_academica_clave = current_user.unidad_academica.clave if current_user.unidad_academica else None
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


@router.put("/me/docente", response_model=DocenteResponse)
def actualizar_mi_perfil_docente(
    datos_pad: DocentePADUpdateRequest,
    request: Request,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
    logger: LoggerPort = Depends(get_logger),
):
    """
    Actualiza la información PAD y de contacto del docente vinculado al usuario actual.
    Solo permitido si el usuario tiene un perfil de docente vinculado (rol DOCENTE).
    """
    trace_id = getattr(request.state, "trace_id", None)
    try:
        logger.info(
            f"Intentando actualizar PAD del docente para usuario: {current_user.email_institucional}",
            context={"usuario_id": current_user.id},
            trace_id=trace_id,
        )
        # Convertir a dict omitiendo None
        datos_dict = datos_pad.model_dump(exclude_unset=True)
        docente_actualizado = auth_service.actualizar_pad_docente_actual(db, current_user.id, datos_dict) #type: ignore
        
        logger.info(
            f"PAD de docente actualizado exitosamente",
            context={"usuario_id": current_user.id, "docente_id": docente_actualizado.id},
            trace_id=trace_id,
        )
        return docente_actualizado
    except ValueError as e:
        logger.warning(
            f"Error al actualizar PAD del docente: {str(e)}",
            context={"usuario_id": current_user.id, "error": str(e)},
            trace_id=trace_id,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Error inesperado al actualizar PAD de docente: {str(e)}",
            context={"usuario_id": current_user.id, "error": str(e)},
            trace_id=trace_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
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
        return auth_service.cambiar_password_propia(db, current_user.id, body.password_actual, body.nueva_password) #type: ignore
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))