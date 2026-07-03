from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.apertura_schema import SugerenciaAperturaResponse, EjecutarAperturaRequest, GrupoAbiertoResponse
from src.application.use_cases import apertura_service

router = APIRouter(prefix="/api/aperturas", tags=["Apertura de Ciclos"])

@router.get("/sugerencias/{plan_id}", response_model=SugerenciaAperturaResponse)
def obtener_sugerencias(plan_id: int, db: Session = Depends(get_db)):
    return apertura_service.obtener_sugerencias_apertura(db, plan_id)

@router.post("/ejecutar")
def ejecutar_apertura(datos: EjecutarAperturaRequest, db: Session = Depends(get_db)):
    exito = apertura_service.ejecutar_apertura_ciclo(db, datos)
    if not exito:
        raise HTTPException(
            status_code=400, 
            detail="No se pudo realizar la apertura. Asegúrese de tener un ciclo escolar activo."
        )
    return {"mensaje": "Apertura de ciclo generada exitosamente en la base de datos."}

@router.get("/abiertos", response_model=List[GrupoAbiertoResponse])
def listar_grupos(db: Session = Depends(get_db)):
    return apertura_service.listar_grupos_abiertos(db)