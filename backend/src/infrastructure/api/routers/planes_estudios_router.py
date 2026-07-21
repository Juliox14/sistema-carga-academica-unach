from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session
from typing import List
from fastapi.responses import StreamingResponse
from io import BytesIO

from src.application.ports.output.logger_port import LoggerPort
from ...database.database import get_db
from ..schemas.planes_estudios_schema import PlanEstudiosCreate, PlanEstudiosResponse, PlanEstudiosUpdate
from src.application.use_cases import planes_estudios_service
from src.infrastructure.api.routers.logging_utils import get_logger, get_trace_id

router = APIRouter(prefix="/api/planes-estudios", tags=["Planes de Estudios"])
@router.post("/", response_model=PlanEstudiosResponse)
def crear_plan_estudios(plan: PlanEstudiosCreate, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando crear plan de estudios", context={"nombre": plan.nombre}, trace_id=trace_id)
    try:
        nuevo_plan = planes_estudios_service.crear_nuevo_plan_estudios(db, plan)
        logger.info("Plan de estudios creado", context={"plan_id": nuevo_plan.id}, trace_id=trace_id)
        return nuevo_plan
    except ValueError as e:
        logger.warning("Error al crear plan de estudios", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[PlanEstudiosResponse])
def listar_planes_estudios(request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Listando planes de estudios", trace_id=trace_id)
    return planes_estudios_service.obtener_todos_los_planes_estudios(db)

@router.post("/import")
async def importar_plan_estudios(file: UploadFile, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando importar planes de estudios", context={"filename": file.filename}, trace_id=trace_id)
    try:
        plan_importado = await file.read()
        byte_object = BytesIO(plan_importado)
        objects = await planes_estudios_service.importar_plan_estudios(db, byte_object)
        logger.info("Importación de planes de estudios completada", trace_id=trace_id)
        return objects
    except ValueError as e:
        logger.error("Error al importar planes de estudios", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/export")
async def exportar_plan_estudios(request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Solicitando exportación de planes de estudios", trace_id=trace_id)
    try:
        buffer = await planes_estudios_service.exportar_plan_estudios(db)
        logger.info("Exportación de planes de estudios completada", trace_id=trace_id)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=planes_estudio.xlsx"},
        )
    except Exception as e:
        logger.error("Error al exportar planes de estudios", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{plan_id}", response_model=PlanEstudiosResponse)
def obtener_plan_estudios(plan_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Consultando plan de estudios", context={"plan_id": plan_id}, trace_id=trace_id)
    return planes_estudios_service.obtener_plan_estudios_por_id(db, plan_id)
    
@router.put("/{plan_id}", response_model=PlanEstudiosResponse)
def actualizar_plan_estudios(plan_id: int, plan: PlanEstudiosUpdate, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando actualizar plan de estudios", context={"plan_id": plan_id}, trace_id=trace_id)
    try:
        plan_actualizado = planes_estudios_service.actualizar_plan_estudios(db, plan_id, plan)
        logger.info("Plan de estudios actualizado", context={"plan_id": plan_id}, trace_id=trace_id)
        return plan_actualizado
    except ValueError as e:
        logger.warning("Error al actualizar plan de estudios", context={"plan_id": plan_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=404, detail=str(e))
    
from sqlalchemy.exc import IntegrityError

@router.delete("/{plan_id}")
def eliminar_plan_estudios(plan_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando eliminar plan de estudios", context={"plan_id": plan_id}, trace_id=trace_id)
    try:
        planes_estudios_service.eliminar_plan_estudios(db, plan_id)
        logger.info("Plan de estudios eliminado", context={"plan_id": plan_id}, trace_id=trace_id)
        return {"detail": "Plan de estudios eliminado exitosamente"}
    except ValueError as e:
        logger.warning("Error al eliminar plan de estudios", context={"plan_id": plan_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=404, detail=str(e))
    except IntegrityError:
        db.rollback()
        logger.warning("No se pudo eliminar plan de estudios por integridad", context={"plan_id": plan_id}, trace_id=trace_id)
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el plan de estudios porque está asignado a materias, docentes o grupos activos."
        )

    
