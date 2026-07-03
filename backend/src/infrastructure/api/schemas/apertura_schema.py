from pydantic import BaseModel
from typing import List

class GrupoSugerido(BaseModel):
    grupo: str
    turno: str

class PeriodoSugerido(BaseModel):
    numero_periodo: int
    sugerencias: List[GrupoSugerido]

class SugerenciaAperturaResponse(BaseModel):
    periodos: List[PeriodoSugerido]

class GrupoAperturaInput(BaseModel):
    numero_periodo: int
    grupo: str
    turno: str

class EjecutarAperturaRequest(BaseModel):
    plan_estudios_id: int
    grupos: List[GrupoAperturaInput]

class GrupoAbiertoResponse(BaseModel):
    id: int
    ciclo_escolar_id: int
    ciclo_escolar_nombre: str
    plan_estudios_id: int
    plan_estudios_nombre: str
    numero_periodo: int
    grupo: str
    turno: str

    class Config:
        from_attributes = True