from pydantic import BaseModel, ConfigDict
from typing import Optional
from src.infrastructure.database.orm_models import TipoPeriodo
from src.infrastructure.api.schemas.programas_schema import ProgramaEducativoResponse

class PlanEstudiosBase(BaseModel):
    nombre: str
    programa_educativo_id: int
    vigente: bool = True
    tipo_periodo: TipoPeriodo = TipoPeriodo.SEMESTRAL
    
class PlanEstudiosCreate(PlanEstudiosBase):
    pass

class PlanEstudiosUpdate(PlanEstudiosBase):
    nombre: Optional[str] = None
    programa_educativo_id: Optional[int] = None
    vigente: Optional[bool] = None
    tipo_periodo: Optional[TipoPeriodo] = None

class PlanEstudiosResponse(PlanEstudiosBase):
    id: int
    programa_educativo: Optional[ProgramaEducativoResponse] = None

    model_config = ConfigDict(from_attributes=True)