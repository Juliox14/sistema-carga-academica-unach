from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.docentes_schema import DocenteCreate, DocenteResponse, DocenteUpdate
from src.application.use_cases import docentes_service

router = APIRouter(prefix="/api/docentes", tags=["Gestión de Docentes"])

@router.post("/", response_model=DocenteResponse)
def crear_docente(docente: DocenteCreate, db: Session = Depends(get_db)):
    return docentes_service.crear_docente(db, docente)

@router.get("/", response_model=List[DocenteResponse])
def listar_docentes(db: Session = Depends(get_db)):
    return docentes_service.obtener_docentes(db)

@router.get("/{docente_id}", response_model=DocenteResponse)
def obtener_docente(docente_id: int, db: Session = Depends(get_db)):
    return docentes_service.obtener_docente_por_id(db, docente_id)

@router.put("/{docente_id}", response_model=DocenteResponse)
def actualizar_docente(docente_id: int, docente: DocenteUpdate, db: Session = Depends(get_db)):
    return docentes_service.actualizar_docente(db, docente_id, docente)

@router.delete("/{docente_id}")
def eliminar_docente(docente_id: int, db: Session = Depends(get_db)):
    docentes_service.eliminar_docente(db, docente_id)
    return {"detail": "Docente eliminado exitosamente"}