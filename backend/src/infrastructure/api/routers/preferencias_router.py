from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.horarios_schema import PreferenciaSaveRequest, PreferenciaDocenteResponse
from src.application.use_cases import horarios_service
from src.application.use_cases.ciclos_service import obtener_ciclo_activo
from src.infrastructure.security import get_current_user
from src.infrastructure.database.orm_models import Usuario, Docente

router = APIRouter(prefix="/api/preferencias", tags=["Preferencias de Docentes"])

@router.get("/mi-preferencia", response_model=List[PreferenciaDocenteResponse])
def obtener_mis_preferencias(current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Encontrar registro docente del usuario actual
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="La cuenta de usuario no está asociada a un docente."
        )

    # 2. Obtener ciclo activo
    ciclo = obtener_ciclo_activo(db)
    if not ciclo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No hay un ciclo escolar activo."
        )

    return horarios_service.obtener_preferencias_docente(db, docente.id, ciclo.id) #type: ignore

@router.post("/mi-preferencia", response_model=List[PreferenciaDocenteResponse])
def guardar_mis_preferencias(req: PreferenciaSaveRequest, current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="La cuenta de usuario no está asociada a un docente."
        )

    ciclo = obtener_ciclo_activo(db)
    if not ciclo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No hay un ciclo escolar activo."
        )

    try:
        return horarios_service.guardar_preferencias_docente(db, docente.id, ciclo.id, req.preferencias) #type: ignore
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
