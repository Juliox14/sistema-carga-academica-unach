from pydantic import BaseModel, ConfigDict
from typing import Optional

class OtraActividadBase(BaseModel):
    nombre: str
    hsm: int

class OtraActividadCreate(OtraActividadBase):
    pass

class OtraActividadUpdate(OtraActividadBase):
    nombre: Optional[str] = None
    hsm: Optional[int] = None

class OtraActividadResponse(OtraActividadBase):
    id: int
    model_config = ConfigDict(from_attributes=True)