from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class CicloEstadoUnidadSchema(BaseModel):
    unidad_academica_id: int
    unidad_academica_nombre: str
    activo: bool
    carga_finalizada: bool

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
    estados_unidades: Optional[List[CicloEstadoUnidadSchema]] = None
    model_config = ConfigDict(from_attributes=True)