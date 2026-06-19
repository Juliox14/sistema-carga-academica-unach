from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.areas_schema import AreaConocimientoCreate, AreaConocimientoResponse, AreaConocimientoUpdate
from src.application.use_cases import areas_service

router = APIRouter(prefix="/api/areas-conocimiento", tags=["Áreas de Conocimiento"])

@router.post("/", response_model=AreaConocimientoResponse)
def crear(area: AreaConocimientoCreate, db: Session = Depends(get_db)):
    return areas_service.crear_area(db, area)

@router.get("/", response_model=List[AreaConocimientoResponse])
def listar(db: Session = Depends(get_db)):
    return areas_service.obtener_areas(db)

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
