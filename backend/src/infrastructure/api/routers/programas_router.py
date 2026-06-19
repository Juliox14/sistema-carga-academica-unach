from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException

from ...database.database import get_db
from ..schemas.programas_schema import ProgramaEducativoCreate, ProgramaEducativoResponse, ProgramaEducativoUpdate
from src.application.use_cases import programas_service

router = APIRouter(prefix="/api/programas", tags=["Programas Educativos"])

@router.post("/", response_model=ProgramaEducativoResponse)
def crear_programa(programa: ProgramaEducativoCreate, db: Session = Depends(get_db)):
    try:
        nuevo_programa = programas_service.crear_nuevo_programa(db, programa)
        return nuevo_programa
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[ProgramaEducativoResponse])
def listar_programas(db: Session = Depends(get_db)):
    programas = programas_service.obtener_todos_los_programas(db)
    return programas

@router.get("/{programa_id}", response_model=ProgramaEducativoResponse)
def obtener_programa(programa_id: int, db: Session = Depends(get_db)):
    try:
        programa = programas_service.obtener_programa_por_id(db, programa_id)
        return programa
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    
@router.put("/{programa_id}", response_model=ProgramaEducativoResponse)
def actualizar_programa(programa_id: int, programa: ProgramaEducativoUpdate, db: Session = Depends(get_db)):
    try:
        programa_actualizado = programas_service.actualizar_programa(db, programa_id, programa)
        return programa_actualizado
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))



@router.delete("/{programa_id}")
def eliminar_programa(programa_id: int, db: Session = Depends(get_db)):
    try:
        programas_service.eliminar_programa(db, programa_id)
        return {"detail": "Programa educativo eliminado exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))