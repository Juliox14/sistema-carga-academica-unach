from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class InvitacionCreate(BaseModel):
    docente_id: int
    unidad_destino_id: int
    ciclo_escolar_id: int
    horas_propuestas: float
    mensaje: Optional[str] = None

class InvitacionRespuesta(BaseModel):
    respuesta: Optional[str] = None

class InvitacionResponse(BaseModel):
    id: int
    docente_id: int
    docente_nombre: str
    unidad_origen_id: int
    unidad_origen_nombre: str
    unidad_destino_id: int
    unidad_destino_nombre: str
    ciclo_escolar_id: int
    ciclo_escolar_nombre: str
    horas_propuestas: float
    estado: str
    mensaje: Optional[str] = None
    respuesta: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
