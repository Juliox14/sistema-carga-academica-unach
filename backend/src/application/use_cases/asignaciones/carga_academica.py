from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.infrastructure.database.orm_models import Materia, AsignacionCarga, EstadoAsignacion
from src.infrastructure.api.schemas.asignaciones_schema import VincularMateriaRequest
from src.application.use_cases.ciclos_service import obtener_ciclo_activo
from .validaciones import _verificar_limite_hsm


def vincular_materia_a_docente(db: Session, datos: VincularMateriaRequest):
    ciclo = obtener_ciclo_activo(db)
    materia = db.query(Materia).get(datos.materia_id)
    
    # Validar límite estricto de horas antes de proceder
    if materia:
        _verificar_limite_hsm(db, datos.docente_id, materia.hsm)
    
    asignacion = db.query(AsignacionCarga).filter(
        AsignacionCarga.materia_id == datos.materia_id,
        AsignacionCarga.grupo_asignado_id == datos.grupo_abierto_id,
        AsignacionCarga.ciclo_escolar_id == ciclo.id
    ).first()
    
    if asignacion:
        # Escenario de Cobertura: Ya existe el titular y está descargado
        if asignacion.docente_titular_id is not None:
            if asignacion.motivo_descarga and asignacion.docente_temporal_id is None:
                asignacion.docente_temporal_id = datos.docente_id
            else:
                raise HTTPException(status_code=400, detail="La materia ya tiene un docente titular y no requiere suplente.")
    else:
        # Escenario Normal: Se crea la asignación por primera vez
        nueva_asignacion = AsignacionCarga(
            materia_id=datos.materia_id,
            grupo_asignado_id=datos.grupo_abierto_id,
            docente_titular_id=datos.docente_id,
            ciclo_escolar_id=ciclo.id,
            estado_asignacion=EstadoAsignacion.ASIGNADA
        )
        db.add(nueva_asignacion)
    
    db.commit()
    return {"mensaje": "Materia vinculada al docente exitosamente."}
    
def desvincular_materia(db: Session, asignacion_id: int):
    asignacion = db.query(AsignacionCarga).filter(AsignacionCarga.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada.")
    
    # Si tiene temporal, solo quitamos al temporal (el titular sigue descargado)
    if asignacion.docente_temporal_id:
        asignacion.docente_temporal_id = None
    else:
        # Si no hay temporal, eliminamos la asignación completa
        db.delete(asignacion)
        
    db.commit()
    return {"mensaje": "Materia desvinculada con éxito."}