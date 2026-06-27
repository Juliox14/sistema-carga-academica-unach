from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.infrastructure.database.orm_models import AsignacionCarga, EstadoAsignacion
from src.infrastructure.api.schemas.asignaciones_schema import AsignarDescargaRequest
from .validaciones import _verificar_limite_hsm

def asignar_descarga(db: Session, datos: AsignarDescargaRequest):
    asignacion = db.query(AsignacionCarga).filter(AsignacionCarga.id == datos.asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada.")
    
    asignacion.motivo_descarga = datos.motivo_descarga
    # Al descargar, si había un temporal previo, se asume que sigue cubriendo o se limpia?
    # Por defecto, se limpia para que el Eventual la pueda tomar
    asignacion.docente_temporal_id = None
    asignacion.estado_asignacion = EstadoAsignacion.DESCARGADA
    db.commit()
    return {"mensaje": "Descarga asignada exitosamente."}

def remover_descarga(db: Session, asignacion_id: int):
    asignacion = db.query(AsignacionCarga).filter(AsignacionCarga.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada.")
    
    # Al quitar la descarga, el titular recupera sus horas. Validamos que no rebase su límite.
    
    _verificar_limite_hsm(db, asignacion.docente_titular_id, asignacion.materia.hsm) # type: ignore
    
    asignacion.motivo_descarga = None
    asignacion.docente_temporal_id = None # El suplente se queda sin la clase
    asignacion.estado_asignacion = EstadoAsignacion.ASIGNADA
    db.commit()
    return {"mensaje": "Descarga removida exitosamente. El titular ha recuperado su carga."}
