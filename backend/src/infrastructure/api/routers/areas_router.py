from io import BytesIO
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.application.use_cases import areas_service
from src.infrastructure.api.schemas.areas_schema import (
    AreaConocimientoCreate,
    AreaConocimientoResponse,
    AreaConocimientoUpdate,
)
from src.infrastructure.database.database import get_db

router = APIRouter(prefix="/api/areas-conocimiento", tags=["Áreas de Conocimiento"])


@router.post("/", response_model=AreaConocimientoResponse)
def crear(area: AreaConocimientoCreate, db: Session = Depends(get_db)):
    return areas_service.crear_area(db, area)


@router.get("/", response_model=List[AreaConocimientoResponse])
def listar(db: Session = Depends(get_db)):
    return areas_service.obtener_areas(db)


@router.post("/import")
async def importar_areas(file: UploadFile, db: Session = Depends(get_db)):
    try:
        plan_importado = await file.read()
        byte_object = BytesIO(plan_importado)
        objects = await areas_service.importar_areas(db, byte_object)
        return objects
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def exportar_areas(db: Session = Depends(get_db)):
    try:
        areas = areas_service.obtener_areas(db)
        buffer = await areas_service.exportar_areas(areas)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=areas_conocimiento.xlsx"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{area_id}", response_model=AreaConocimientoResponse)
def obtener(area_id: int, db: Session = Depends(get_db)):
    return areas_service.obtener_area_por_id(db, area_id)


@router.put("/{area_id}", response_model=AreaConocimientoResponse)
def actualizar(area_id: int, area: AreaConocimientoUpdate, db: Session = Depends(get_db)):
    return areas_service.actualizar_area(db, area_id, area)


@router.delete("/{area_id}")
def eliminar(area_id: int, db: Session = Depends(get_db)):
    areas_service.eliminar_area(db, area_id)
    return {"message": "Área de conocimiento eliminada exitosamente"}
