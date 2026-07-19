from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.infrastructure.database.orm_models import AsignacionOtraActividad
from src.infrastructure.api.schemas.asignaciones_schema import AsignarActividadRequest
from src.application.use_cases.ciclos_service import obtener_ciclo_activo
from .validaciones import _verificar_limite_hsm  # Importamos la validación

def asignar_otra_actividad(db: Session, datos: AsignarActividadRequest, unidad_academica_id: int | None = None):
    ciclo = obtener_ciclo_activo(db)
    
    # Validar límite estricto de horas antes de proceder
    _verificar_limite_hsm(db, datos.docente_id, datos.horas_asignadas, unidad_academica_id)
    
    nueva_actividad = AsignacionOtraActividad(
        docente_id=datos.docente_id,
        actividad_id=datos.actividad_id,
        horas_asignadas=datos.horas_asignadas,
        observaciones=datos.observaciones,
        ciclo_escolar_id=ciclo.id,
        unidad_academica_id=unidad_academica_id
    )
    
    db.add(nueva_actividad)
    db.commit()
    return {"mensaje": "Otra actividad asignada exitosamente."}

def eliminar_asignacion_otra_actividad(db: Session, asignacion_actividad_id: int):
    asignacion = db.query(AsignacionOtraActividad).filter(AsignacionOtraActividad.id == asignacion_actividad_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación de otra actividad no encontrada.")
    
    db.delete(asignacion)
    db.commit()
    return {"mensaje": "Asignación de otra actividad eliminada exitosamente."}