from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.infrastructure.database.database import get_db
from src.infrastructure.security import require_roles, get_current_user
from src.infrastructure.database.orm_models import Usuario
from src.infrastructure.api.schemas.invitaciones_schema import (
    InvitacionCreate, InvitacionResponse, InvitacionRespuesta
)
from src.application.use_cases import invitaciones_service

router = APIRouter(prefix="/api/invitaciones-docente", tags=["Invitaciones Docentes entre Unidades"])

ROLES_SECRETARIA = ["SECRETARIA_ACADEMICA", "SUPER_ADMIN"]

@router.post("/", response_model=InvitacionResponse, dependencies=[Depends(require_roles(ROLES_SECRETARIA))])
def crear_invitacion(
    datos: InvitacionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not current_user.unidad_academica_id and current_user.rol and current_user.rol.clave != "SUPER_ADMIN":
        raise HTTPException(status_code=400, detail="El usuario no tiene asignada una unidad académica.")
    
    unidad_origen_id = current_user.unidad_academica_id
    if not unidad_origen_id and current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        # SUPER_ADMIN enviando invitación debe asegurar unidad_origen_id o usar la del docente principal
        from src.infrastructure.database.orm_models import DocenteUnidad
        principal = db.query(DocenteUnidad).filter(
            DocenteUnidad.docente_id == datos.docente_id,
            DocenteUnidad.es_unidad_principal == True
        ).first()
        if not principal:
            raise HTTPException(status_code=400, detail="El docente no tiene una unidad principal asignada.")
        unidad_origen_id = principal.unidad_academica_id

    return invitaciones_service.crear_invitacion(db, datos, unidad_origen_id=unidad_origen_id)

@router.get("/recibidas", response_model=List[InvitacionResponse], dependencies=[Depends(require_roles(ROLES_SECRETARIA))])
def listar_recibidas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not current_user.unidad_academica_id:
        return []
    return invitaciones_service.obtener_recibidas(db, current_user.unidad_academica_id)

@router.get("/enviadas", response_model=List[InvitacionResponse], dependencies=[Depends(require_roles(ROLES_SECRETARIA))])
def listar_enviadas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not current_user.unidad_academica_id:
        return []
    return invitaciones_service.obtener_enviadas(db, current_user.unidad_academica_id)

@router.get("/pendientes-count")
def contar_pendientes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not current_user.unidad_academica_id:
        return {"count": 0}
    count = invitaciones_service.obtener_pendientes_count(db, current_user.unidad_academica_id)
    return {"count": count}

@router.put("/{invitacion_id}/aceptar", response_model=InvitacionResponse, dependencies=[Depends(require_roles(ROLES_SECRETARIA))])
def aceptar_invitacion(
    invitacion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not current_user.unidad_academica_id:
        raise HTTPException(status_code=400, detail="El usuario no tiene asignada una unidad académica.")
    return invitaciones_service.aceptar_invitacion(db, invitacion_id, current_user.unidad_academica_id)

@router.put("/{invitacion_id}/rechazar", response_model=InvitacionResponse, dependencies=[Depends(require_roles(ROLES_SECRETARIA))])
def rechazar_invitacion(
    invitacion_id: int,
    respuesta: InvitacionRespuesta,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not current_user.unidad_academica_id:
        raise HTTPException(status_code=400, detail="El usuario no tiene asignada una unidad académica.")
    return invitaciones_service.rechazar_invitacion(db, invitacion_id, current_user.unidad_academica_id, respuesta)
