from pydantic import BaseModel, ConfigDict
from typing import Optional

class ProgramaEducativoBase(BaseModel):
    nombre: str
    clave: str
    activo: bool = True
    
class ProgramaEducativoCreate(ProgramaEducativoBase):
    pass

class ProgramaEducativoUpdate(ProgramaEducativoBase):
    nombre: Optional[str] = None
    clave: Optional[str] = None
    activo: Optional[bool] = None

class ProgramaEducativoResponse(ProgramaEducativoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
    