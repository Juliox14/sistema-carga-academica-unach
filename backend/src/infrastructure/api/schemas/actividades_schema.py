from pydantic import BaseModel, ConfigDict
from typing import Optional

class OtraActividadBase(BaseModel):
    nombre: str
    hsm: float

class OtraActividadCreate(OtraActividadBase):
    pass

class OtraActividadUpdate(OtraActividadBase):
    nombre: Optional[str] = None
    hsm: Optional[float] = None

class OtraActividadResponse(OtraActividadBase):
    id: int
    model_config = ConfigDict(from_attributes=True)