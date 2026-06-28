from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from src.infrastructure.database.orm_models import ConfiguracionSistema

from src.infrastructure.database.database import get_db 
from src.infrastructure.config.settings_service import ConfiguracionService

router = APIRouter(prefix="/api/configuraciones", tags=["Configuraciones"])

class ConfiguracionUpdateRequest(BaseModel):
    clave: str
    valor: str
    
    
@router.get("/")
def obtener_configuraciones(db: Session = Depends(get_db)):
    configuraciones = db.query(ConfiguracionSistema).all()
    return [{"clave": c.clave, "valor": c.valor} for c in configuraciones]

@router.put("/", response_model=dict)
def actualizar_configuraciones(
    configuraciones: List[ConfiguracionUpdateRequest], 
    db: Session = Depends(get_db)
):
    """
    Actualiza múltiples configuraciones del sistema en lote.
    """
    for config in configuraciones:
        ConfiguracionService.actualizar(db, config.clave, config.valor)
        
    return {"message": "Configuraciones actualizadas exitosamente"}