from pydantic import BaseModel, ConfigDict
from typing import Optional

class MateriaBase(BaseModel):
    nombre_asignatura: str
    plan_estudios_id: int
    numero_periodo: int
    hsm: int
    area_conocimiento_id: int
    estatus: str = "ACTIVA"

class MateriaCreate(MateriaBase):
    pass

class MateriaUpdate(MateriaBase):
    nombre_asignatura: Optional[str] = None
    plan_estudios_id: Optional[int] = None
    numero_periodo: Optional[int] = None
    hsm: Optional[int] = None
    area_conocimiento_id: Optional[int] = None
    estatus: Optional[str] = None

class MateriaResponse(MateriaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)