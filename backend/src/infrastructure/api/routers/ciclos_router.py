from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from src.application.ports.output.logger_port import LoggerPort
from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.ciclos_schema import CicloEscolarCreate, CicloEscolarResponse, CicloEscolarUpdate
from src.application.use_cases import ciclos_service
from src.infrastructure.security import require_roles, get_current_user
from src.infrastructure.database.orm_models import Usuario
from pydantic import BaseModel
from typing import Optional
from src.infrastructure.api.routers.logging_utils import get_logger, get_trace_id

CATALOG_ROLES = ["SUPER_ADMIN", "SECRETARIA_ACADEMICA", "CAPTURISTA"]

router = APIRouter(prefix="/api/ciclos", tags=["Ciclos Escolares"])


class ActivarCicloRequest(BaseModel):
    unidad_academica_id: Optional[int] = None  # Solo SUPER_ADMIN puede especificar otra unidad

@router.post("/", response_model=CicloEscolarResponse, dependencies=[Depends(require_roles(CATALOG_ROLES))])
def crear(ciclo: CicloEscolarCreate, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando crear ciclo escolar", context={"nombre": ciclo.nombre}, trace_id=trace_id)
    try:
        nuevo_ciclo = ciclos_service.crear_ciclo(db, ciclo)
        logger.info("Ciclo escolar creado", context={"ciclo_id": nuevo_ciclo.id}, trace_id=trace_id)
        return nuevo_ciclo
    except Exception as e:
        logger.error("Error al crear ciclo escolar", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[CicloEscolarResponse], dependencies=[Depends(get_current_user)])
def listar(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    logger: LoggerPort = Depends(get_logger),
):
    trace_id = get_trace_id(request)
    unidad_id = current_user.unidad_academica_id if (current_user.rol and current_user.rol.clave != "SUPER_ADMIN") else None
    logger.info("Listando ciclos escolares", context={"unidad_id": unidad_id}, trace_id=trace_id)
    return ciclos_service.obtener_ciclos(db, unidad_id=unidad_id)

@router.get("/{ciclo_id}", response_model=CicloEscolarResponse, dependencies=[Depends(get_current_user)])
def obtener(ciclo_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Consultando ciclo escolar", context={"ciclo_id": ciclo_id}, trace_id=trace_id)
    return ciclos_service.obtener_ciclo_por_id(db, ciclo_id)

@router.put("/{ciclo_id}", response_model=CicloEscolarResponse, dependencies=[Depends(require_roles(CATALOG_ROLES))])
def actualizar(ciclo_id: int, ciclo: CicloEscolarUpdate, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando actualizar ciclo escolar", context={"ciclo_id": ciclo_id}, trace_id=trace_id)
    try:
        ciclo_actualizado = ciclos_service.actualizar_ciclo(db, ciclo_id, ciclo)
        logger.info("Ciclo escolar actualizado", context={"ciclo_id": ciclo_id}, trace_id=trace_id)
        return ciclo_actualizado
    except Exception as e:
        logger.warning("Error al actualizar ciclo escolar", context={"ciclo_id": ciclo_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{ciclo_id}", dependencies=[Depends(require_roles(CATALOG_ROLES))])
def eliminar(ciclo_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando eliminar ciclo escolar", context={"ciclo_id": ciclo_id}, trace_id=trace_id)
    try:
        ciclos_service.eliminar_ciclo(db, ciclo_id)
        logger.info("Ciclo escolar eliminado", context={"ciclo_id": ciclo_id}, trace_id=trace_id)
        return {"message": "Ciclo escolar eliminado exitosamente"}
    except Exception as e:
        logger.warning("Error al eliminar ciclo escolar", context={"ciclo_id": ciclo_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/finalizar-carga", response_model=CicloEscolarResponse, dependencies=[Depends(require_roles(CATALOG_ROLES))])
def finalizar_carga(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    logger: LoggerPort = Depends(get_logger),
):
    trace_id = get_trace_id(request)
    unidad_id = current_user.unidad_academica_id if (current_user.rol and current_user.rol.clave != "SUPER_ADMIN") else None
    logger.info("Intentando finalizar carga del ciclo activo", context={"unidad_id": unidad_id}, trace_id=trace_id)
    try:
        ciclo = ciclos_service.finalizar_carga_ciclo_activo(db, unidad_id=unidad_id)
        logger.info("Carga de ciclo finalizada", context={"unidad_id": unidad_id, "ciclo_id": ciclo.id}, trace_id=trace_id)
        return ciclo
    except Exception as e:
        logger.error("Error al finalizar carga del ciclo", context={"unidad_id": unidad_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/desfinalizar-carga", response_model=CicloEscolarResponse, dependencies=[Depends(require_roles(CATALOG_ROLES))])
def desfinalizar_carga(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    logger: LoggerPort = Depends(get_logger),
):
    trace_id = get_trace_id(request)
    unidad_id = current_user.unidad_academica_id if (current_user.rol and current_user.rol.clave != "SUPER_ADMIN") else None
    logger.info("Intentando desfinalizar carga del ciclo activo", context={"unidad_id": unidad_id}, trace_id=trace_id)
    try:
        ciclo = ciclos_service.desfinalizar_carga_ciclo_activo(db, unidad_id=unidad_id)
        logger.info("Carga de ciclo desfinalizada", context={"unidad_id": unidad_id, "ciclo_id": ciclo.id}, trace_id=trace_id)
        return ciclo
    except Exception as e:
        logger.error("Error al desfinalizar carga del ciclo", context={"unidad_id": unidad_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{ciclo_id}/activar", dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def activar_ciclo_para_unidad(
    ciclo_id: int,
    body: ActivarCicloRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    logger: LoggerPort = Depends(get_logger),
):
    """Activa un ciclo escolar para una unidad academica. Si el usuario no es SUPER_ADMIN, solo puede activar para su propia unidad."""
    trace_id = get_trace_id(request)
    if current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        unidad_id = body.unidad_academica_id
    else:
        unidad_id = current_user.unidad_academica_id
    logger.info("Intentando activar ciclo para unidad", context={"ciclo_id": ciclo_id, "unidad_id": unidad_id}, trace_id=trace_id)
    if not unidad_id:
        logger.warning("No se pudo activar ciclo por falta de unidad académica", context={"ciclo_id": ciclo_id}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail="Se requiere una unidad academica para activar el ciclo.")
    try:
        resultado = ciclos_service.activar_ciclo_para_unidad(db, ciclo_id=ciclo_id, unidad_id=unidad_id)
        logger.info("Ciclo activado para unidad", context={"ciclo_id": ciclo_id, "unidad_id": unidad_id}, trace_id=trace_id)
        return resultado
    except Exception as e:
        logger.error("Error al activar ciclo", context={"ciclo_id": ciclo_id, "unidad_id": unidad_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{ciclo_id}/cerrar", dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def cerrar_ciclo_para_unidad_endpoint(
    ciclo_id: int,
    body: ActivarCicloRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    logger: LoggerPort = Depends(get_logger),
):
    """Cierra un ciclo escolar activamente, validando asignaciones y horarios."""
    trace_id = get_trace_id(request)
    if current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        unidad_id = body.unidad_academica_id
    else:
        unidad_id = current_user.unidad_academica_id
    logger.info("Intentando cerrar ciclo para unidad", context={"ciclo_id": ciclo_id, "unidad_id": unidad_id}, trace_id=trace_id)
    if not unidad_id:
        logger.warning("No se pudo cerrar ciclo por falta de unidad académica", context={"ciclo_id": ciclo_id}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail="Se requiere una unidad academica para cerrar el ciclo.")
    try:
        res = ciclos_service.cerrar_ciclo_para_unidad(db, ciclo_id=ciclo_id, unidad_id=unidad_id)
        if not res['success']:
            logger.warning("El cierre del ciclo reportó errores", context={"ciclo_id": ciclo_id, "errores": res['errores']}, trace_id=trace_id)
            raise HTTPException(status_code=400, detail=res['errores'])
        logger.info("Ciclo cerrado exitosamente", context={"ciclo_id": ciclo_id, "unidad_id": unidad_id}, trace_id=trace_id)
        return {"message": "Ciclo cerrado exitosamente"}
    except ValueError as e:
        logger.warning("Error de validación al cerrar ciclo", context={"ciclo_id": ciclo_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error inesperado al cerrar ciclo", context={"ciclo_id": ciclo_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))