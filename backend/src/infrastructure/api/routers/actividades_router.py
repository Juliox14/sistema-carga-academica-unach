from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.actividades_schema import OtraActividadCreate, OtraActividadResponse, OtraActividadUpdate
from src.application.use_cases import actividades_service

router = APIRouter(prefix="/api/otras-actividades", tags=["Otras Actividades"])

@router.post("/", response_model=OtraActividadResponse)
def crear(actividad: OtraActividadCreate, db: Session = Depends(get_db)):
    return actividades_service.crear_actividad(db, actividad)

@router.get("/", response_model=List[OtraActividadResponse])
def listar(db: Session = Depends(get_db)):
    return actividades_service.obtener_actividades(db)

@router.get("/{actividad_id}", response_model=OtraActividadResponse)
def obtener(actividad_id: int, db: Session = Depends(get_db)):
    return actividades_service.obtener_actividad(db, actividad_id)

@router.put("/{actividad_id}", response_model=OtraActividadResponse)
def actualizar(actividad_id: int, actividad: OtraActividadUpdate, db: Session = Depends
(get_db)):
    return actividades_service.actualizar_actividad(db, actividad_id, actividad)

@router.delete("/{actividad_id}")
def eliminar(actividad_id: int, db: Session = Depends(get_db)):
    actividades_service.eliminar_actividad(db, actividad_id)
    return {"message": "Otra actividad eliminada exitosamente"}    