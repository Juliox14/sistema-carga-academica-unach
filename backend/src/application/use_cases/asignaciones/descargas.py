from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.infrastructure.database.orm_models import AsignacionCarga, EstadoAsignacion
from src.infrastructure.api.schemas.asignaciones_schema import AsignarDescargaRequest
from src.infrastructure.config.settings_service import ConfiguracionService
from .validaciones import _verificar_limite_hsm, _validar_tipo_asignacion_categoria

def _obtener_unidad_id(asignacion: AsignacionCarga) -> int | None:
    if asignacion.materia and asignacion.materia.plan_estudio and asignacion.materia.plan_estudio.programa_educativo:
        return asignacion.materia.plan_estudio.programa_educativo.unidad_academica_id
    if asignacion.grupo_asignado and asignacion.grupo_asignado.plan_estudio and asignacion.grupo_asignado.plan_estudio.programa_educativo:
        return asignacion.grupo_asignado.plan_estudio.programa_educativo.unidad_academica_id
    return None

def asignar_descarga(db: Session, datos: AsignarDescargaRequest, unidad_id: int | None = None):
    asignacion = db.query(AsignacionCarga).filter(AsignacionCarga.id == datos.asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada.")
        
    unidad_actual_id = unidad_id or _obtener_unidad_id(asignacion)
    motivo_obligatorio = ConfiguracionService.obtener("DESCARGA_MOTIVO_OBLIGATORIO", unidad_actual_id, True)
    
    if motivo_obligatorio and not (datos.motivo_descarga and datos.motivo_descarga.strip()):
        raise HTTPException(status_code=400, detail="El motivo de la descarga es obligatorio.")

    asignacion.motivo_descarga = datos.motivo_descarga
    
    asignacion.docente_temporal_id = None
    asignacion.estado_asignacion = EstadoAsignacion.DESCARGADA
    db.commit()
    return {"mensaje": "Descarga asignada exitosamente."}

def remover_descarga(db: Session, asignacion_id: int):
    asignacion = db.query(AsignacionCarga).filter(AsignacionCarga.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada.")
    
    # Al quitar la descarga, el titular recupera sus horas. Validamos que no rebase su límite y que permita titularidades.
    _validar_tipo_asignacion_categoria(db, asignacion.docente_titular_id, requiere_titular=True) # type: ignore
    _verificar_limite_hsm(db, asignacion.docente_titular_id, asignacion.materia.hsm) # type: ignore
    
    asignacion.motivo_descarga = None
    asignacion.docente_temporal_id = None # El suplente se queda sin la clase
    asignacion.estado_asignacion = EstadoAsignacion.ASIGNADA
    db.commit()
    return {"mensaje": "Descarga removida exitosamente. El titular ha recuperado su carga."}
