from pydantic import BaseModel
from typing import List, Optional

class MateriaAsignadaDTO(BaseModel):
    asignacion_id: int
    materia_id: int
    asignatura: str
    periodo: int
    grupo: str
    hsm: int
    motivo_descarga: Optional[str] = None
    es_temporal: bool = False
    programa_educativo: Optional[str] = None

class OtraActividadAsignadaDTO(BaseModel):
    asignacion_actividad_id: int
    actividad: str
    horas: float
    observaciones: Optional[str] = None

class TableroDocenteResponse(BaseModel):
    docente_id: int
    nombre_completo: str
    hsm_base: float
    horas_frente_grupo: float
    horas_descargadas: float
    horas_otras_actividades: float
    suma_total: float
    carga_academica: List[MateriaAsignadaDTO]
    descargas: List[MateriaAsignadaDTO]
    otras_actividades: List[OtraActividadAsignadaDTO]


class MateriaDisponibleDTO(BaseModel):
    materia_id: int
    grupo_abierto_id: int
    asignatura: str
    periodo: int
    grupo: str
    hsm: int
    es_cobertura: Optional[bool] = None
    titular_original: Optional[str] = None


class VincularMateriaRequest(BaseModel):
    docente_id: int
    materia_id: int
    grupo_abierto_id: int

class AsignarDescargaRequest(BaseModel):
    asignacion_id: int
    motivo_descarga: str

class AsignarActividadRequest(BaseModel):
    docente_id: int
    actividad_id: int
    horas_asignadas: float
    observaciones: Optional[str] = None

class DocenteCargaDetalle(BaseModel):
    id: int
    nombre_completo: str
    horas_asignadas: float
    alerta: bool

class CoberturaTipoResumen(BaseModel):
    tipo: str
    siglas: str
    horas_asignadas: float
    horas_requeridas: float
    porcentaje: Optional[float] = None
    docentes: List[DocenteCargaDetalle]

class DocenteIncompletoResumen(BaseModel):
    id: int
    nombre_completo: str
    tipo: str
    siglas: str
    horas_asignadas: float
    horas_requeridas: float
    horas_pendientes: float

class ResumenCargaResponse(BaseModel):
    cobertura: List[CoberturaTipoResumen]
    docentes_incompletos: List[DocenteIncompletoResumen]

class VacanteDTO(BaseModel):
    asignacion_id: int
    materia_id: int
    asignatura: str
    periodo: int
    grupo: str
    hsm: int
    turno: str
    plan_estudios: str
    programa_educativo: str