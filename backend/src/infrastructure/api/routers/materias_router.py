from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException

from ...database.database import get_db
from ..schemas.materias_schema import MateriaCreate, MateriaResponse, MateriaUpdate
from src.application.use_cases import materias_service

router = APIRouter(prefix="/api/materias", tags=["Materias"])

@router.post("/", response_model=MateriaResponse)
def crear_materia(materia: MateriaCreate, db: Session = Depends(get_db)):
    try:
        nueva_materia = materias_service.crear_nueva_materia(db, materia)
        return nueva_materia
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[MateriaResponse])
def listar_materias(db: Session = Depends(get_db)):
    materias = materias_service.obtener_todas_las_materias(db)
    return materias

@router.get("/{materia_id}", response_model=MateriaResponse)
def obtener_materia(materia_id: int, db: Session = Depends(get_db)):
    try:
        materia = materias_service.obtener_materia_por_id(db, materia_id)
        return materia
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.put("/{materia_id}", response_model=MateriaResponse)
def actualizar_materia(materia_id: int, materia: MateriaUpdate, db: Session = Depends(get_db)):
    try:
        materia_actualizada = materias_service.actualizar_materia(db, materia_id, materia)
        return materia_actualizada
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.delete("/{materia_id}")
def eliminar_materia(materia_id: int, db: Session = Depends(get_db)):
    try:
        materias_service.eliminar_materia(db, materia_id)
        return {"detail": "Materia eliminada exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
