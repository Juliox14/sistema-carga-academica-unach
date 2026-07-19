from pydantic import BaseModel, ConfigDict
from typing import Optional

class UnidadAcademicaResponse(BaseModel):
    id: int
    nombre: str
    clave: str
    campus: int
    ciudad: Optional[str] = None
    direccion: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
