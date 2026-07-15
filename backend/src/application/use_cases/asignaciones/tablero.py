from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import or_
from src.infrastructure.database.orm_models import Docente, AsignacionCarga, AsignacionOtraActividad
from src.application.use_cases.ciclos_service import obtener_ciclo_activo


def obtener_tablero_docente(db: Session, docente_id: int):
    ciclo = obtener_ciclo_activo(db)
    
    docente = db.query(Docente).filter(Docente.id == docente_id).first()
    if not docente:
        raise HTTPException(status_code=404, detail="Docente no encontrado")

    hsm_base = docente.hsm_personalizadas if docente.hsm_personalizadas else (docente.categoria.hsm_base if docente.categoria else 0.0)
    if docente.estatus and docente.estatus.max_horas is not None:
        hsm_base = min(hsm_base, docente.estatus.max_horas)
    
    asignaciones_carga = db.query(AsignacionCarga).filter(
        or_(
            AsignacionCarga.docente_titular_id == docente_id,
            AsignacionCarga.docente_temporal_id == docente_id
        ),
        AsignacionCarga.ciclo_escolar_id == ciclo.id
    ).all()
    
    carga_academica = []
    descargas = []
    horas_frente_grupo = 0
    horas_descargadas = 0
    
    for a in asignaciones_carga:
        profesor_cubre = None
        if a.docente_temporal_id and a.docente_temporal:
            profesor_cubre = f"{a.docente_temporal.apellidos} {a.docente_temporal.nombre}"

        dto = {
            "asignacion_id": a.id,
            "materia_id": a.materia_id,
            "asignatura": a.materia.nombre_asignatura,
            "periodo": a.materia.numero_periodo,
            "grupo": a.grupo_asignado.grupo if a.grupo_asignado else "-",
            "hsm": a.materia.hsm,
            "motivo_descarga": a.motivo_descarga,
            "profesor_cubre": profesor_cubre,
            "es_temporal": a.docente_temporal_id == docente_id,
            "programa_educativo": a.materia.plan_estudio.programa_educativo.clave if (a.materia and a.materia.plan_estudio and a.materia.plan_estudio.programa_educativo) else "N/A"
        }
        
        # Lógica de clasificación (Titular vs Temporal vs Descargado)
        if a.docente_titular_id == docente_id:
            if a.motivo_descarga:
                descargas.append(dto)
                horas_descargadas += a.materia.hsm
            else:
                carga_academica.append(dto)
                horas_frente_grupo += a.materia.hsm
        elif a.docente_temporal_id == docente_id:
            carga_academica.append(dto)
            horas_frente_grupo += a.materia.hsm
        
    actividades_bd = db.query(AsignacionOtraActividad).filter(
        AsignacionOtraActividad.docente_id == docente_id,
        AsignacionOtraActividad.ciclo_escolar_id == ciclo.id
    ).all()
    
    otras_actividades = []
    horas_otras_actividades = 0
    
    for act in actividades_bd:
        otras_actividades.append({
            "asignacion_actividad_id": act.id,
            "actividad": act.actividad.nombre,
            "horas": act.horas_asignadas,
            "observaciones": act.observaciones
        })
        horas_otras_actividades += act.horas_asignadas
    
    return {
        "docente_id": docente.id,
        "nombre_completo": f"{docente.apellidos} {docente.nombre}",
        "categoria": docente.categoria.siglas if docente.categoria else "N/A",
        "hsm_base": hsm_base,
        "horas_frente_grupo": horas_frente_grupo,
        "horas_descargadas": horas_descargadas,
        "horas_otras_actividades": horas_otras_actividades,
        "suma_total": horas_frente_grupo + horas_descargadas + horas_otras_actividades,
        "carga_academica": carga_academica,
        "descargas": descargas,
        "otras_actividades": otras_actividades
    }

