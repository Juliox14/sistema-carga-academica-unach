from pydantic import BaseModel, ConfigDict
from typing import Optional

class AreaConocimientoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class AreaConocimientoCreate(AreaConocimientoBase):
    pass

class AreaConocimientoUpdate(AreaConocimientoBase):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

class AreaConocimientoResponse(AreaConocimientoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)