from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.database import get_db
from src.infrastructure.database.orm_models import EstatusDocente, Docente
from src.infrastructure.api.schemas.estatus_schema import EstatusDocenteCreate, EstatusDocenteResponse, EstatusDocenteUpdate

router = APIRouter(prefix="/api/estatus-docentes", tags=["Estatus Docentes"])

@router.post("/", response_model=EstatusDocenteResponse)
def crear(estatus: EstatusDocenteCreate, db: Session = Depends(get_db)):
    existing = db.query(EstatusDocente).filter(EstatusDocente.nombre == estatus.nombre).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un estatus con este nombre.")
    
    db_estatus = EstatusDocente(**estatus.model_dump())
    db.add(db_estatus)
    db.commit()
    db.refresh(db_estatus)
    return db_estatus

@router.get("/", response_model=List[EstatusDocenteResponse])
def listar(db: Session = Depends(get_db)):
    return db.query(EstatusDocente).all()

@router.get("/{estatus_id}", response_model=EstatusDocenteResponse)
def obtener(estatus_id: int, db: Session = Depends(get_db)):
    db_estatus = db.query(EstatusDocente).filter(EstatusDocente.id == estatus_id).first()
    if not db_estatus:
        raise HTTPException(status_code=404, detail="Estatus no encontrado.")
    return db_estatus

@router.put("/{estatus_id}", response_model=EstatusDocenteResponse)
def actualizar(estatus_id: int, estatus: EstatusDocenteUpdate, db: Session = Depends(get_db)):
    db_estatus = db.query(EstatusDocente).filter(EstatusDocente.id == estatus_id).first()
    if not db_estatus:
        raise HTTPException(status_code=404, detail="Estatus no encontrado.")
    
    update_data = estatus.model_dump(exclude_unset=True)
    if "nombre" in update_data and update_data["nombre"] != db_estatus.nombre:
        existing = db.query(EstatusDocente).filter(EstatusDocente.nombre == update_data["nombre"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe otro estatus con este nombre.")
            
    for key, value in update_data.items():
        setattr(db_estatus, key, value)
        
    db.commit()
    db.refresh(db_estatus)
    return db_estatus

@router.delete("/{estatus_id}")
def eliminar(estatus_id: int, db: Session = Depends(get_db)):
    db_estatus = db.query(EstatusDocente).filter(EstatusDocente.id == estatus_id).first()
    if not db_estatus:
        raise HTTPException(status_code=404, detail="Estatus no encontrado.")
        
    teacher_using = db.query(Docente).filter(Docente.estatus_id == estatus_id).first()
    if teacher_using:
        raise HTTPException(status_code=400, detail="No se puede eliminar el estatus porque está asignado a uno o más docentes.")
        
    db.delete(db_estatus)
    db.commit()
    return {"message": "Estatus eliminado exitosamente"}
