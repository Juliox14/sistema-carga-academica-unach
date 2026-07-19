from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from src.infrastructure.database.orm_models import ConfiguracionSistema

from src.infrastructure.database.database import get_db 
from src.infrastructure.config.settings_service import ConfiguracionService
from src.infrastructure.security import get_current_user
from src.infrastructure.database.orm_models import Usuario

router = APIRouter(prefix="/api/configuraciones", tags=["Configuraciones"])

class ConfiguracionUpdateRequest(BaseModel):
    clave: str
    valor: str
    
    
@router.get("/")
def obtener_configuraciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    unidad_id = current_user.unidad_academica_id
    if not unidad_id and current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        # Por simplicidad el super admin verá las configs de una unidad base, ej ID 1
        unidad_id = 1
        
    configuraciones = db.query(ConfiguracionSistema).filter(
        ConfiguracionSistema.unidad_academica_id == unidad_id
    ).all()
    return [{"clave": c.clave, "valor": c.valor} for c in configuraciones]

@router.put("/", response_model=dict)
def actualizar_configuraciones(
    configuraciones: List[ConfiguracionUpdateRequest], 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Actualiza múltiples configuraciones del sistema en lote para la unidad del usuario actual.
    """
    unidad_id = current_user.unidad_academica_id
    if not unidad_id and current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        unidad_id = 1
        
    for config in configuraciones:
        ConfiguracionService.actualizar(db, config.clave, unidad_id, config.valor)
        
    return {"message": "Configuraciones actualizadas exitosamente"}