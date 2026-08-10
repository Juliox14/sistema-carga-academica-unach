from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from src.application.ports.output.logger_port import LoggerPort
from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.apertura_schema import SugerenciaAperturaResponse, EjecutarAperturaRequest, GrupoAbiertoResponse
from src.application.use_cases import apertura_service
from src.infrastructure.security import get_current_user, require_roles
from src.infrastructure.database.orm_models import Usuario
from src.infrastructure.api.routers.logging_utils import get_logger, get_trace_id

router = APIRouter(prefix="/api/aperturas", tags=["Apertura de Ciclos"])

@router.get("/sugerencias/{plan_id}", response_model=SugerenciaAperturaResponse)
def obtener_sugerencias(plan_id: int, request: Request, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Solicitando sugerencias de apertura", context={"plan_id": plan_id, "unidad_id": current_user.unidad_academica_id}, trace_id=trace_id)
    return apertura_service.obtener_sugerencias_apertura(db, plan_id, current_user.unidad_academica_id)

@router.post("/ejecutar", dependencies=[Depends(require_roles(["SECRETARIA_ACADEMICA"]))])
def ejecutar_apertura(datos: EjecutarAperturaRequest, request: Request, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando ejecutar apertura de ciclo", context={"unidad_id": current_user.unidad_academica_id}, trace_id=trace_id)
    exito = apertura_service.ejecutar_apertura_ciclo(db, datos, current_user.unidad_academica_id)
    if not exito:
        logger.warning("No se pudo ejecutar la apertura de ciclo", context={"unidad_id": current_user.unidad_academica_id}, trace_id=trace_id)
        raise HTTPException(
            status_code=400, 
            detail="No se pudo realizar la apertura. Asegúrese de tener un ciclo escolar activo."
        )
    logger.info("Apertura de ciclo ejecutada exitosamente", context={"unidad_id": current_user.unidad_academica_id}, trace_id=trace_id)
    return {"mensaje": "Apertura de ciclo generada exitosamente en la base de datos."}

@router.get("/abiertos", response_model=List[GrupoAbiertoResponse])
def listar_grupos(request: Request, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Listando grupos abiertos", context={"unidad_id": current_user.unidad_academica_id}, trace_id=trace_id)
    return apertura_service.listar_grupos_abiertos(db, current_user.unidad_academica_id)

@router.delete("/grupos-abiertos/{grupo_id}", dependencies=[Depends(require_roles(["SECRETARIA_ACADEMICA"]))])
def eliminar_grupo_abierto(grupo_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    """Elimina un grupo abierto y todas sus asignaciones y horarios asociados en cascada."""
    trace_id = get_trace_id(request)
    logger.info("Intentando eliminar grupo abierto", context={"grupo_id": grupo_id}, trace_id=trace_id)
    try:
        apertura_service.eliminar_grupo_abierto(db, grupo_id)
        logger.info("Grupo abierto eliminado", context={"grupo_id": grupo_id}, trace_id=trace_id)
        return {"mensaje": "Grupo abierto eliminado exitosamente."}
    except ValueError as e:
        logger.warning("Error al eliminar grupo abierto", context={"grupo_id": grupo_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error inesperado al eliminar grupo abierto", context={"grupo_id": grupo_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")