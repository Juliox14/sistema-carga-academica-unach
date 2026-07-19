from pydantic import BaseModel
from typing import List, Optional

class PreferenciaDocenteItem(BaseModel):
    dia_semana: str
    tipo_preferencia: str
    horas_bloqueadas: Optional[str] = None

class PreferenciaSaveRequest(BaseModel):
    preferencias: List[PreferenciaDocenteItem]

class PreferenciaDocenteResponse(BaseModel):
    id: int
    dia_semana: str
    tipo_preferencia: str
    horas_bloqueadas: Optional[str] = None

    class Config:
        from_attributes = True

class ProgramarHorarioRequest(BaseModel):
    asignacion_carga_id: int
    dia_semana: str
    hora_inicio: int
    duracion: int = 1

class HorarioClaseResponse(BaseModel):
    id: int
    asignacion_carga_id: int
    materia_nombre: str
    docente_nombre: str
    dia_semana: str
    hora_inicio: int
    hora_fin: int

    class Config:
        from_attributes = True

class SugerenciaSlot(BaseModel):
    dia_semana: str
    hora_inicio: int
    hora_fin: int
    afinidad: str  # ALTA, MEDIA, BAJA, CONFLICTO
    razon: str

class SugerenciasHorarioResponse(BaseModel):
    sugerencias: List[SugerenciaSlot]

class ResumenHorariosGrupoResponse(BaseModel):
    grupo_id: int
    grupo_nombre: str
    plan_id: int
    plan_nombre: str
    turno: str
    hsm_totales: int
    horas_programadas: int
    horas_pendientes: int
    estado: str # "COMPLETO", "INCOMPLETO", "VACIO"

class ResumenHorariosGlobalResponse(BaseModel):
    total_grupos: int
    grupos_completos: int
    grupos_incompletos: int
    grupos_vacios: int
    total_hsm: int
    total_programadas: int
    grupos: List[ResumenHorariosGrupoResponse]
