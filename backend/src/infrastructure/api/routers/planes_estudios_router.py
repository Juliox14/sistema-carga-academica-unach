from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from io import BytesIO

from ...database.database import get_db
from ..schemas.planes_estudios_schema import PlanEstudiosCreate, PlanEstudiosResponse, PlanEstudiosUpdate
from src.application.use_cases import planes_estudios_service

router = APIRouter(prefix="/api/planes-estudios", tags=["Planes de Estudios"])
@router.post("/", response_model=PlanEstudiosResponse)
def crear_plan_estudios(plan: PlanEstudiosCreate, db: Session = Depends(get_db)):
    try:
        nuevo_plan = planes_estudios_service.crear_nuevo_plan_estudios(db, plan)
        return nuevo_plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[PlanEstudiosResponse])
def listar_planes_estudios(db: Session = Depends(get_db)):
    planes = planes_estudios_service.obtener_todos_los_planes_estudios(db)
    return planes

@router.post("/import")
async def importar_plan_estudios(file: UploadFile , db: Session = Depends(get_db)):
    try:
        plan_importado = await file.read()
        byte_object = BytesIO(plan_importado)
        objects = await planes_estudios_service.importar_plan_estudios(db, byte_object)
        return objects
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/export")
async def exportar_plan_estudios(db: Session = Depends(get_db)):
    try:
        buffer = await planes_estudios_service.exportar_plan_estudios(db)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=planes_estudio.xlsx"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{plan_id}", response_model=PlanEstudiosResponse)
def obtener_plan_estudios(plan_id: int, db: Session = Depends(get_db)):
    try:
        plan = planes_estudios_service.obtener_plan_estudios_por_id(db, plan_id)
        return plan
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.put("/{plan_id}", response_model=PlanEstudiosResponse)
def actualizar_plan_estudios(plan_id: int, plan: PlanEstudiosUpdate, db: Session = Depends(get_db)):
    try:
        plan_actualizado = planes_estudios_service.actualizar_plan_estudios(db, plan_id, plan)
        return plan_actualizado
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
from sqlalchemy.exc import IntegrityError

@router.delete("/{plan_id}")
def eliminar_plan_estudios(plan_id: int, db: Session = Depends(get_db)):
    try:
        planes_estudios_service.eliminar_plan_estudios(db, plan_id)
        return {"detail": "Plan de estudios eliminado exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el plan de estudios porque está asignado a materias, docentes o grupos activos."
        )

    
