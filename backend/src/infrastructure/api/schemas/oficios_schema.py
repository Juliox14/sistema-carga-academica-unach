from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class PlantillaOficioCreate(BaseModel):
    nombre: str
    tipo_contrato: str  # PTC, PMT, PAS, PAT, PAE
    contenido_html: Optional[str] = ""
    requiere_firma: bool
    lugar_emision: Optional[str] = ""
    asunto: Optional[str] = ""
    destinatarios: Optional[str] = ""
    cuerpo_html: Optional[str] = ""
    despedida: Optional[str] = ""
    remitente_nombre: Optional[str] = ""
    remitente_cargo: Optional[str] = ""
    con_copia_para: Optional[str] = ""

class PlantillaOficioResponse(BaseModel):
    id: int
    nombre: str
    tipo_contrato: str
    contenido_html: str
    requiere_firma: bool
    es_activa: bool
    lugar_emision: Optional[str] = ""
    asunto: Optional[str] = ""
    destinatarios: Optional[str] = ""
    cuerpo_html: Optional[str] = ""
    despedida: Optional[str] = ""
    remitente_nombre: Optional[str] = ""
    remitente_cargo: Optional[str] = ""
    con_copia_para: Optional[str] = ""

    model_config = ConfigDict(from_attributes=True)

class OficioDocenteResponse(BaseModel):
    id: int
    docente_id: int
    docente_nombre: str
    ciclo_id: int
    ciclo_nombre: str
    plantilla_id: int
    plantilla_nombre: str
    estado: str
    numero_oficio: str
    fecha_emision: datetime
    fecha_lectura: Optional[datetime] = None
    fecha_firma: Optional[datetime] = None
    ip_firma: Optional[str] = None
    hash_firma: Optional[str] = None
    contenido_html: Optional[str] = None  # Contenido interpolado
    requiere_firma: bool
    tipo_contrato: Optional[str] = None
    observaciones_rechazo: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class FirmarOficioRequest(BaseModel):
    password: str

class RechazarOficioRequest(BaseModel):
    observaciones: str

class EmitirOficiosRequest(BaseModel):
    categorias: Optional[List[str]] = None
    folio_prefijo: Optional[str] = None
    folio_inicial: Optional[int] = None
    folio_sufijo: Optional[str] = None

