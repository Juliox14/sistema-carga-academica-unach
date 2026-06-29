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

class OtraActividadAsignadaDTO(BaseModel):
    asignacion_actividad_id: int
    actividad: str
    horas: int
    observaciones: Optional[str] = None

class TableroDocenteResponse(BaseModel):
    docente_id: int
    nombre_completo: str
    hsm_base: int
    horas_frente_grupo: int
    horas_descargadas: int
    horas_otras_actividades: int
    suma_total: int
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
    horas_asignadas: int
    observaciones: Optional[str] = None

class DocenteCargaDetalle(BaseModel):
    id: int
    nombre_completo: str
    horas_asignadas: int
    alerta: bool

class CoberturaTipoResumen(BaseModel):
    tipo: str
    siglas: str
    horas_asignadas: int
    horas_requeridas: int
    porcentaje: Optional[float] = None
    docentes: List[DocenteCargaDetalle]

class DocenteIncompletoResumen(BaseModel):
    id: int
    nombre_completo: str
    tipo: str
    siglas: str
    horas_asignadas: int
    horas_requeridas: int
    horas_pendientes: int

class ResumenCargaResponse(BaseModel):
    cobertura: List[CoberturaTipoResumen]
    docentes_incompletos: List[DocenteIncompletoResumen]