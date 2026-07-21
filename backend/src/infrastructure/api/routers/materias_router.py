from io import BytesIO
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.application.ports.output.logger_port import LoggerPort
from src.application.use_cases import materias_service
from src.infrastructure.api.schemas.materias_schema import MateriaCreate, MateriaResponse, MateriaUpdate
from src.infrastructure.api.routers.logging_utils import get_logger, get_trace_id
from ...database.database import get_db

router = APIRouter(prefix="/api/materias", tags=["Materias"])


@router.post("/", response_model=MateriaResponse)
def crear_materia(materia: MateriaCreate, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando crear materia", context={"nombre": materia.nombre_asignatura}, trace_id=trace_id)
    try:
        nueva_materia = materias_service.crear_nueva_materia(db, materia)
        logger.info("Materia creada", context={"materia_id": nueva_materia.id}, trace_id=trace_id)
        return nueva_materia
    except ValueError as e:
        logger.warning("Error al crear materia", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[MateriaResponse])
def listar_materias(request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Listando materias", trace_id=trace_id)
    return materias_service.obtener_todas_las_materias(db)


@router.post("/import")
async def importar_materias(file: UploadFile, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando importar materias", context={"filename": file.filename}, trace_id=trace_id)
    try:
        plan_importado = await file.read()
        byte_object = BytesIO(plan_importado)
        objects = await materias_service.importar_materias(db, byte_object)
        logger.info("Importación de materias completada", trace_id=trace_id)
        return objects
    except ValueError as e:
        logger.error("Error al importar materias", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def exportar_materias(request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Solicitando exportación de materias", trace_id=trace_id)
    try:
        materias = materias_service.obtener_todas_las_materias(db)
        buffer = await materias_service.exportar_materias(materias)
        logger.info("Exportación de materias completada", trace_id=trace_id)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=materias.xlsx"},
        )
    except Exception as e:
        logger.error("Error al exportar materias", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{materia_id}", response_model=MateriaResponse)
def obtener_materia(materia_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Consultando materia", context={"materia_id": materia_id}, trace_id=trace_id)
    return materias_service.obtener_materia_por_id(db, materia_id)


@router.put("/{materia_id}", response_model=MateriaResponse)
def actualizar_materia(materia_id: int, materia: MateriaUpdate, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando actualizar materia", context={"materia_id": materia_id}, trace_id=trace_id)
    try:
        materia_actualizada = materias_service.actualizar_materia(db, materia_id, materia)
        logger.info("Materia actualizada", context={"materia_id": materia_id}, trace_id=trace_id)
        return materia_actualizada
    except ValueError as e:
        logger.warning("Error al actualizar materia", context={"materia_id": materia_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{materia_id}")
def eliminar_materia(materia_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando eliminar materia", context={"materia_id": materia_id}, trace_id=trace_id)
    try:
        materias_service.eliminar_materia(db, materia_id)
        logger.info("Materia eliminada", context={"materia_id": materia_id}, trace_id=trace_id)
        return {"detail": "Materia eliminada exitosamente"}
    except ValueError as e:
        logger.warning("Error al eliminar materia", context={"materia_id": materia_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=404, detail=str(e))
