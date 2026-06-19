from pydantic import BaseModel
from typing import Dict

class SugerenciaAperturaResponse(BaseModel):
    sugerencias: Dict[int, int]

class EjecutarAperturaRequest(BaseModel):
    plan_estudios_id: int
    configuracion_grupos: Dict[int, int]