from pydantic import BaseModel, ConfigDict
from typing import Optional


class CicloEscolarBase(BaseModel):
    nombre: str
    mes_inicio: int
    mes_final: int
    anio: int
    activo: bool = False
    carga_finalizada: bool = False

class CicloEscolarCreate(CicloEscolarBase):
    pass

class CicloEscolarUpdate(BaseModel):
    nombre: Optional[str] = None
    mes_inicio: Optional[int] = None
    mes_final: Optional[int] = None
    anio: Optional[int] = None
    activo: Optional[bool] = None

class CicloEscolarResponse(CicloEscolarBase):
    id: int
    model_config = ConfigDict(from_attributes=True) 