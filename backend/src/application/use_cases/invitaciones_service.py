from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from src.infrastructure.database.orm_models import (
    InvitacionDocenteUnidad, EstadoInvitacion, DocenteUnidad, Docente, UnidadAcademica, CicloEscolar
)
from src.infrastructure.api.schemas.invitaciones_schema import InvitacionCreate, InvitacionRespuesta

def _formatear_invitacion(inv: InvitacionDocenteUnidad) -> dict:
    docente_nombre = f"{inv.docente.apellidos or ''} {inv.docente.nombre}".strip().upper() if inv.docente else "N/A"
    return {
        "id": inv.id,
        "docente_id": inv.docente_id,
        "docente_nombre": docente_nombre,
        "unidad_origen_id": inv.unidad_origen_id,
        "unidad_origen_nombre": inv.unidad_origen.nombre if inv.unidad_origen else "N/A",
        "unidad_destino_id": inv.unidad_destino_id,
        "unidad_destino_nombre": inv.unidad_destino.nombre if inv.unidad_destino else "N/A",
        "ciclo_escolar_id": inv.ciclo_escolar_id,
        "ciclo_escolar_nombre": inv.ciclo_escolar.nombre if inv.ciclo_escolar else "N/A",
        "horas_propuestas": inv.horas_propuestas,
        "estado": inv.estado.value if hasattr(inv.estado, 'value') else str(inv.estado),
        "mensaje": inv.mensaje,
        "respuesta": inv.respuesta,
        "created_at": inv.created_at
    }

def crear_invitacion(db: Session, datos: InvitacionCreate, unidad_origen_id: int) -> dict:
    if datos.unidad_destino_id == unidad_origen_id:
        raise HTTPException(status_code=400, detail="La unidad de destino no puede ser la misma que la unidad principal.")

    # Verificar que el docente pertenezca a la unidad de origen como principal
    vinculo_principal = db.query(DocenteUnidad).filter(
        DocenteUnidad.docente_id == datos.docente_id,
        DocenteUnidad.unidad_academica_id == unidad_origen_id,
        DocenteUnidad.es_unidad_principal == True
    ).first()

    if not vinculo_principal:
        raise HTTPException(status_code=400, detail="Solo la Secretaría Académica de la unidad principal del docente puede enviar invitaciones.")

    # Verificar si ya existe una invitación pendiente para este docente, unidad destino y ciclo
    inv_existente = db.query(InvitacionDocenteUnidad).filter(
        InvitacionDocenteUnidad.docente_id == datos.docente_id,
        InvitacionDocenteUnidad.unidad_destino_id == datos.unidad_destino_id,
        InvitacionDocenteUnidad.ciclo_escolar_id == datos.ciclo_escolar_id,
        InvitacionDocenteUnidad.estado == EstadoInvitacion.PENDIENTE
    ).first()

    if inv_existente:
        raise HTTPException(status_code=400, detail="Ya existe una invitación pendiente para este docente en la unidad destino para el ciclo seleccionado.")

    nueva_inv = InvitacionDocenteUnidad(
        docente_id=datos.docente_id,
        unidad_origen_id=unidad_origen_id,
        unidad_destino_id=datos.unidad_destino_id,
        ciclo_escolar_id=datos.ciclo_escolar_id,
        horas_propuestas=datos.horas_propuestas,
        estado=EstadoInvitacion.PENDIENTE,
        mensaje=datos.mensaje,
        created_at=datetime.now()
    )

    db.add(nueva_inv)
    db.commit()
    db.refresh(nueva_inv)
    return _formatear_invitacion(nueva_inv)

def obtener_recibidas(db: Session, unidad_id: int):
    invs = db.query(InvitacionDocenteUnidad).filter(
        InvitacionDocenteUnidad.unidad_destino_id == unidad_id
    ).order_by(InvitacionDocenteUnidad.id.desc()).all()
    return [_formatear_invitacion(inv) for inv in invs]

def obtener_enviadas(db: Session, unidad_id: int):
    invs = db.query(InvitacionDocenteUnidad).filter(
        InvitacionDocenteUnidad.unidad_origen_id == unidad_id
    ).order_by(InvitacionDocenteUnidad.id.desc()).all()
    return [_formatear_invitacion(inv) for inv in invs]

def obtener_pendientes_count(db: Session, unidad_id: int) -> int:
    return db.query(InvitacionDocenteUnidad).filter(
        InvitacionDocenteUnidad.unidad_destino_id == unidad_id,
        InvitacionDocenteUnidad.estado == EstadoInvitacion.PENDIENTE
    ).count()

def aceptar_invitacion(db: Session, invitacion_id: int, unidad_destino_id: int) -> dict:
    inv = db.query(InvitacionDocenteUnidad).filter(
        InvitacionDocenteUnidad.id == invitacion_id,
        InvitacionDocenteUnidad.unidad_destino_id == unidad_destino_id
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail="Invitación no encontrada o no pertenece a tu unidad.")

    if inv.estado != EstadoInvitacion.PENDIENTE:
        raise HTTPException(status_code=400, detail="Esta invitación ya fue procesada anteriormente.")

    inv.estado = EstadoInvitacion.ACEPTADA

    # Crear o actualizar vínculo de DocenteUnidad secundaria para ese ciclo
    vinculo = db.query(DocenteUnidad).filter(
        DocenteUnidad.docente_id == inv.docente_id,
        DocenteUnidad.unidad_academica_id == unidad_destino_id,
        DocenteUnidad.ciclo_escolar_id == inv.ciclo_escolar_id
    ).first()

    if vinculo:
        vinculo.horas_obligatorias = inv.horas_propuestas
        vinculo.es_unidad_principal = False
    else:
        nuevo_vinculo = DocenteUnidad(
            docente_id=inv.docente_id,
            unidad_academica_id=unidad_destino_id,
            es_unidad_principal=False,
            horas_obligatorias=inv.horas_propuestas,
            ciclo_escolar_id=inv.ciclo_escolar_id
        )
        db.add(nuevo_vinculo)

    db.commit()
    db.refresh(inv)
    return _formatear_invitacion(inv)

def rechazar_invitacion(db: Session, invitacion_id: int, unidad_destino_id: int, respuesta_data: InvitacionRespuesta) -> dict:
    inv = db.query(InvitacionDocenteUnidad).filter(
        InvitacionDocenteUnidad.id == invitacion_id,
        InvitacionDocenteUnidad.unidad_destino_id == unidad_destino_id
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail="Invitación no encontrada o no pertenece a tu unidad.")

    if inv.estado != EstadoInvitacion.PENDIENTE:
        raise HTTPException(status_code=400, detail="Esta invitación ya fue procesada anteriormente.")

    inv.estado = EstadoInvitacion.RECHAZADA
    inv.respuesta = respuesta_data.respuesta

    db.commit()
    db.refresh(inv)
    return _formatear_invitacion(inv)
