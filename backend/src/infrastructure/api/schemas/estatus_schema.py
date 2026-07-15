from pydantic import BaseModel
from typing import Optional

class EstatusDocenteBase(BaseModel):
    nombre: str
    permite_carga: bool = True
    max_horas: Optional[float] = None
    es_prioritario: bool = False

class EstatusDocenteCreate(EstatusDocenteBase):
    pass

class EstatusDocenteUpdate(BaseModel):
    nombre: Optional[str] = None
    permite_carga: Optional[bool] = None
    max_horas: Optional[float] = None
    es_prioritario: Optional[bool] = None

class EstatusDocenteResponse(EstatusDocenteBase):
    id: int

    class Config:
        from_attributes = True
