from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from src.infrastructure.database.orm_models import EstatusDocente, Turno

class AreaConocimientoResponse(BaseModel):
    id: int
    nombre: str
    model_config = ConfigDict(from_attributes=True)

class DocenteBase(BaseModel):
    nombre: str
    apellidos: str
    plaza: str
    categoria_id: int
    hsm_personalizadas: Optional[int] = None
    estatus: EstatusDocente = EstatusDocente.ACTIVO
    usuario_id: Optional[int] = None
    turno: Turno = Turno.MIXTO

class DocenteCreate(DocenteBase):
    areas_conocimiento_ids: List[int] = []
    
class DocenteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    plaza: Optional[str] = None
    categoria_id: Optional[int] = None
    hsm_personalizadas: Optional[int] = None
    estatus: Optional[EstatusDocente] = None
    usuario_id: Optional[int] = None
    turno: Optional[Turno] = None
    
    areas_conocimiento_ids: Optional[List[int]] = None

class DocenteResponse(DocenteBase):
    id: int
    areas_conocimiento: List[AreaConocimientoResponse] = []
    
    model_config = ConfigDict(from_attributes=True)