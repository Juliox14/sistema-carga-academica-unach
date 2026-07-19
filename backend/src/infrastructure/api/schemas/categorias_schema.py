from pydantic import BaseModel, ConfigDict
from typing import Optional

class CategoriaDocenteBase(BaseModel):
    nombre: str
    siglas: str
    hsm_base: int
    nivel_prioridad: int
    permite_titular: bool = True
    permite_suplente: bool = False

class CategoriaDocenteCreate(CategoriaDocenteBase):
    pass

class CategoriaDocenteUpdate(CategoriaDocenteBase):
    nombre: Optional[str] = None
    siglas: Optional[str] = None
    hsm_base: Optional[int] = None
    nivel_prioridad: Optional[int] = None
    permite_titular: Optional[bool] = None
    permite_suplente: Optional[bool] = None

class CategoriaDocenteResponse(CategoriaDocenteBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CategoriaBulkRulesUpdate(BaseModel):
    id: int
    permite_titular: bool
    permite_suplente: bool