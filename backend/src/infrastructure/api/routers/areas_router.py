from io import BytesIO
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.application.ports.output.logger_port import LoggerPort
from src.application.use_cases import areas_service
from src.infrastructure.api.routers.logging_utils import get_logger, get_trace_id
from src.infrastructure.api.schemas.areas_schema import (
    AreaConocimientoCreate,
    AreaConocimientoResponse,
    AreaConocimientoUpdate,
)
from src.infrastructure.database.database import get_db

router = APIRouter(prefix="/api/areas-conocimiento", tags=["Áreas de Conocimiento"])


@router.post("/", response_model=AreaConocimientoResponse)
def crear(
    area: AreaConocimientoCreate,
    request: Request,
    db: Session = Depends(get_db),
    logger: LoggerPort = Depends(get_logger),
):
    trace_id = get_trace_id(request)
    logger.info("Intentando crear área de conocimiento", context={"nombre": area.nombre}, trace_id=trace_id)
    try:
        nueva_area = areas_service.crear_area(db, area)
        logger.info("Área de conocimiento creada exitosamente", context={"area_id": nueva_area.id}, trace_id=trace_id)
        return nueva_area
    except ValueError as e:
        logger.warning("Error al crear área de conocimiento", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[AreaConocimientoResponse])
def listar(request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Listando áreas de conocimiento", trace_id=trace_id)
    return areas_service.obtener_areas(db)


@router.post("/import")
async def importar_areas(file: UploadFile, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando importar áreas de conocimiento", context={"filename": file.filename}, trace_id=trace_id)
    try:
        plan_importado = await file.read()
        byte_object = BytesIO(plan_importado)
        objects = await areas_service.importar_areas(db, byte_object)
        logger.info("Importación de áreas completada", trace_id=trace_id)
        return objects
    except ValueError as e:
        logger.error("Error al importar áreas de conocimiento", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def exportar_areas(request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Solicitando exportación de áreas de conocimiento", trace_id=trace_id)
    try:
        areas = areas_service.obtener_areas(db)
        buffer = await areas_service.exportar_areas(areas)
        logger.info("Exportación de áreas completada", trace_id=trace_id)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=areas_conocimiento.xlsx"},
        )
    except Exception as e:
        logger.error("Error al exportar áreas de conocimiento", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{area_id}", response_model=AreaConocimientoResponse)
def obtener(area_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Consultando área de conocimiento", context={"area_id": area_id}, trace_id=trace_id)
    return areas_service.obtener_area_por_id(db, area_id)


@router.put("/{area_id}", response_model=AreaConocimientoResponse)
def actualizar(area_id: int, area: AreaConocimientoUpdate, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando actualizar área de conocimiento", context={"area_id": area_id}, trace_id=trace_id)
    try:
        area_actualizada = areas_service.actualizar_area(db, area_id, area)
        logger.info("Área de conocimiento actualizada", context={"area_id": area_id}, trace_id=trace_id)
        return area_actualizada
    except ValueError as e:
        logger.warning("Error al actualizar área de conocimiento", context={"area_id": area_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{area_id}")
def eliminar(area_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando eliminar área de conocimiento", context={"area_id": area_id}, trace_id=trace_id)
    try:
        areas_service.eliminar_area(db, area_id)
        logger.info("Área de conocimiento eliminada", context={"area_id": area_id}, trace_id=trace_id)
        return {"message": "Área de conocimiento eliminada exitosamente"}
    except ValueError as e:
        logger.warning("Error al eliminar área de conocimiento", context={"area_id": area_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))
