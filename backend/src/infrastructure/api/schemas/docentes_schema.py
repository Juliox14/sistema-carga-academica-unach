from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date
from src.infrastructure.database.orm_models import Turno
from src.infrastructure.api.schemas.estatus_schema import EstatusDocenteResponse
from src.infrastructure.api.schemas.unidades_schema import UnidadAcademicaResponse

class DocenteUnidadResponse(BaseModel):
    unidad_academica: UnidadAcademicaResponse
    es_unidad_principal: bool
    horas_obligatorias: Optional[float] = None
    ciclo_escolar_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class AreaConocimientoResponse(BaseModel):
    id: int
    nombre: str
    model_config = ConfigDict(from_attributes=True)

class DocenteBase(BaseModel):
    nombre: str
    apellidos: Optional[str] = None
    plaza: Optional[str] = None
    categoria_id: int
    hsm_personalizadas: Optional[float] = None
    estatus_id: int
    correo_institucional: Optional[str] = None
    telefono: Optional[str] = None
    usuario_id: Optional[int] = None
    turno: Turno = Turno.MIXTO
    es_comodin: bool = False
    # Campos PAD
    rfc: Optional[str] = None
    curp: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    perfil_academico: Optional[str] = None
    ultimo_grado_estudio: Optional[str] = None

class DocenteCreate(DocenteBase):
    areas_conocimiento_ids: List[int] = []
    horas_obligatorias: Optional[float] = None
    es_unidad_principal: bool = True
    unidad_academica_id: Optional[int] = None
    
class DocenteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    plaza: Optional[str] = None
    categoria_id: Optional[int] = None
    hsm_personalizadas: Optional[float] = None
    estatus_id: Optional[int] = None
    correo_institucional: Optional[str] = None
    telefono: Optional[str] = None
    usuario_id: Optional[int] = None
    turno: Optional[Turno] = None
    es_comodin: Optional[bool] = None
    # Campos PAD
    rfc: Optional[str] = None
    curp: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    perfil_academico: Optional[str] = None
    ultimo_grado_estudio: Optional[str] = None
    
    areas_conocimiento_ids: Optional[List[int]] = None
    horas_obligatorias: Optional[float] = None
    es_unidad_principal: Optional[bool] = None

class DocenteResponse(DocenteBase):
    id: int
    areas_conocimiento: List[AreaConocimientoResponse] = []
    estatus: Optional[EstatusDocenteResponse] = None
    unidades: List[DocenteUnidadResponse] = []
    
    model_config = ConfigDict(from_attributes=True)