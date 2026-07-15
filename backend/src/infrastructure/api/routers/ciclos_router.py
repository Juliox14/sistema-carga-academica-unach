from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.ciclos_schema import CicloEscolarCreate, CicloEscolarResponse, CicloEscolarUpdate
from src.application.use_cases import ciclos_service

router = APIRouter(prefix="/api/ciclos", tags=["Ciclos Escolares"])

@router.post("/", response_model=CicloEscolarResponse)
def crear(ciclo: CicloEscolarCreate, db: Session = Depends(get_db)):
    return ciclos_service.crear_ciclo(db, ciclo)

@router.get("/", response_model=List[CicloEscolarResponse])
def listar(db: Session = Depends(get_db)):
    return ciclos_service.obtener_ciclos(db)

@router.get("/{ciclo_id}", response_model=CicloEscolarResponse)
def obtener(ciclo_id: int, db: Session = Depends(get_db)):
    return ciclos_service.obtener_ciclo_por_id(db, ciclo_id)

@router.put("/{ciclo_id}", response_model=CicloEscolarResponse)
def actualizar(ciclo_id: int, ciclo: CicloEscolarUpdate, db: Session = Depends(get_db)):
    return ciclos_service.actualizar_ciclo(db, ciclo_id, ciclo)

@router.delete("/{ciclo_id}")
def eliminar(ciclo_id: int, db: Session = Depends(get_db)):
    ciclos_service.eliminar_ciclo(db, ciclo_id)
    return {"message": "Ciclo escolar eliminado exitosamente"}

@router.post("/finalizar-carga", response_model=CicloEscolarResponse)
def finalizar_carga(db: Session = Depends(get_db)):
    try:
        return ciclos_service.finalizar_carga_ciclo_activo(db)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/desfinalizar-carga", response_model=CicloEscolarResponse)
def desfinalizar_carga(db: Session = Depends(get_db)):
    try:
        return ciclos_service.desfinalizar_carga_ciclo_activo(db)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))