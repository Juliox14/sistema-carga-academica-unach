from io import BytesIO
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.application.ports.output.logger_port import LoggerPort
from src.application.use_cases import programas_service
from src.infrastructure.api.schemas.programas_schema import (
    ProgramaEducativoCreate,
    ProgramaEducativoResponse,
    ProgramaEducativoUpdate,
)
from src.infrastructure.security import get_current_user
from src.infrastructure.database.orm_models import Usuario
from src.infrastructure.database.database import get_db
from src.infrastructure.api.routers.logging_utils import get_logger, get_trace_id

router = APIRouter(prefix="/api/programas", tags=["Programas Educativos"])


def _unidad_filtro(current_user: Usuario) -> int | None:
    """Devuelve el unidad_id para filtrar segun el rol del usuario."""
    if current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        return None
    return current_user.unidad_academica_id


@router.post("/", response_model=ProgramaEducativoResponse)
def crear_programa(programa: ProgramaEducativoCreate, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando crear programa educativo", context={"nombre": programa.nombre}, trace_id=trace_id)
    try:
        nuevo_programa = programas_service.crear_nuevo_programa(db, programa)
        logger.info("Programa educativo creado", context={"programa_id": nuevo_programa.id}, trace_id=trace_id)
        return nuevo_programa
    except ValueError as e:
        logger.warning("Error al crear programa educativo", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[ProgramaEducativoResponse])
def listar_programas(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    logger: LoggerPort = Depends(get_logger),
):
    trace_id = get_trace_id(request)
    unidad_id = _unidad_filtro(current_user)
    logger.info("Listando programas educativos", context={"unidad_id": unidad_id}, trace_id=trace_id)
    programas = programas_service.obtener_todos_los_programas(db, unidad_id=unidad_id)
    return programas


@router.post("/import")
async def importar_programas(file: UploadFile, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando importar programas educativos", context={"filename": file.filename}, trace_id=trace_id)
    try:
        plan_importado = await file.read()
        byte_object = BytesIO(plan_importado)
        objects = await programas_service.importar_programas(db, byte_object)
        logger.info("Importación de programas educativos completada", trace_id=trace_id)
        return objects
    except ValueError as e:
        logger.error("Error al importar programas educativos", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def exportar_programas(request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Solicitando exportación de programas educativos", trace_id=trace_id)
    try:
        programas = programas_service.obtener_todos_los_programas(db)
        buffer = await programas_service.exportar_programas(programas)
        logger.info("Exportación de programas educativos completada", trace_id=trace_id)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=programas_educativos.xlsx"},
        )
    except Exception as e:
        logger.error("Error al exportar programas educativos", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{programa_id}", response_model=ProgramaEducativoResponse)
def obtener_programa(programa_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Consultando programa educativo", context={"programa_id": programa_id}, trace_id=trace_id)
    return programas_service.obtener_programa_por_id(db, programa_id)


@router.put("/{programa_id}", response_model=ProgramaEducativoResponse)
def actualizar_programa(programa_id: int, programa: ProgramaEducativoUpdate, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando actualizar programa educativo", context={"programa_id": programa_id}, trace_id=trace_id)
    try:
        programa_actualizado = programas_service.actualizar_programa(db, programa_id, programa)
        logger.info("Programa educativo actualizado", context={"programa_id": programa_id}, trace_id=trace_id)
        return programa_actualizado
    except ValueError as e:
        logger.warning("Error al actualizar programa educativo", context={"programa_id": programa_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=404, detail=str(e))


from sqlalchemy.exc import IntegrityError

@router.delete("/{programa_id}")
def eliminar_programa(programa_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando eliminar programa educativo", context={"programa_id": programa_id}, trace_id=trace_id)
    try:
        programas_service.eliminar_programa(db, programa_id)
        logger.info("Programa educativo eliminado", context={"programa_id": programa_id}, trace_id=trace_id)
        return {"detail": "Programa educativo eliminado exitosamente"}
    except ValueError as e:
        logger.warning("Error al eliminar programa educativo", context={"programa_id": programa_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=404, detail=str(e))
    except IntegrityError:
        db.rollback()
        logger.warning("No se pudo eliminar programa educativo por integridad", context={"programa_id": programa_id}, trace_id=trace_id)
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el programa educativo porque tiene planes de estudio vigentes asociados."
        )
