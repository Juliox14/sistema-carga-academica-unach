from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.horarios_schema import (
    ProgramarHorarioRequest, HorarioClaseResponse, SugerenciasHorarioResponse
)
from src.application.use_cases import horarios_service
from src.infrastructure.security import get_current_user
from src.infrastructure.database.orm_models import Usuario, CicloEscolar, AsignacionCarga, HorarioClase

router = APIRouter(prefix="/api/horarios", tags=["Horarios de Clases"])

@router.get("/asignaciones-grupo/{grupo_id}")
def obtener_asignaciones_grupo(grupo_id: int, db: Session = Depends(get_db)):
    try:
        # Retorna las materias asignadas al grupo en el ciclo escolar activo
        ciclo = horarios_service.obtener_ciclo_activo(db)
        if not ciclo:
            raise HTTPException(status_code=400, detail="No hay un ciclo activo.")
            
        asignaciones = db.query(AsignacionCarga).filter(
            AsignacionCarga.grupo_asignado_id == grupo_id,
            AsignacionCarga.ciclo_escolar_id == ciclo.id
        ).all()
        
        res = []
        for a in asignaciones:
            horas_programadas = db.query(HorarioClase).filter(
                HorarioClase.asignacion_carga_id == a.id
            ).count()
            
            res.append({
                "id": a.id,
                "materia_id": a.materia_id,
                "materia_nombre": a.materia.nombre_asignatura if a.materia else "Materia Desconocida",
                "materia_hsm": a.materia.hsm if a.materia else 0,
                "horas_programadas": horas_programadas,
                "docente_nombre": (
                    f"{a.docente_titular.nombre} {a.docente_titular.apellidos}" 
                    if a.docente_titular else 
                    f"{a.docente_temporal.nombre} {a.docente_temporal.apellidos}"
                    if a.docente_temporal else "Sin docente asignado"
                )
            })
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/grupo/{grupo_id}", response_model=List[HorarioClaseResponse])
def obtener_horarios(grupo_id: int, db: Session = Depends(get_db)):
    try:
        horarios = horarios_service.obtener_horarios_grupo(db, grupo_id)
        # Transformar para el response model
        res = []
        for h in horarios:
            res.append({
                "id": h.id,
                "asignacion_carga_id": h.asignacion_carga_id,
                "materia_nombre": h.asignacion_carga.materia.nombre_asignatura if h.asignacion_carga.materia else "",
                "docente_nombre": (
                    f"{h.asignacion_carga.docente_titular.nombre} {h.asignacion_carga.docente_titular.apellidos}" 
                    if h.asignacion_carga.docente_titular else 
                    f"{h.asignacion_carga.docente_temporal.nombre} {h.asignacion_carga.docente_temporal.apellidos}"
                    if h.asignacion_carga.docente_temporal else "Sin docente asignado"
                ),
                "dia_semana": h.dia_semana.name,
                "hora_inicio": h.hora_inicio,
                "hora_fin": h.hora_fin
            })
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/programar", response_model=HorarioClaseResponse)
def programar_bloque(req: ProgramarHorarioRequest, db: Session = Depends(get_db)):
    try:        
        h = horarios_service.programar_horario(db, req)
        if not h:
            raise ValueError("No se pudo crear el horario.")
        return {
            "id": h.id,
            "asignacion_carga_id": h.asignacion_carga_id,
            "materia_nombre": h.asignacion_carga.materia.nombre_asignatura if h.asignacion_carga.materia else "",
            "docente_nombre": (
                f"{h.asignacion_carga.docente_titular.nombre} {h.asignacion_carga.docente_titular.apellidos}" 
                if h.asignacion_carga.docente_titular else 
                f"{h.asignacion_carga.docente_temporal.nombre} {h.asignacion_carga.docente_temporal.apellidos}"
                if h.asignacion_carga.docente_temporal else "Sin docente asignado"
            ),
            "dia_semana": h.dia_semana.name,
            "hora_inicio": h.hora_inicio,
            "hora_fin": h.hora_fin
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def desprogramar_bloque(id: int, db: Session = Depends(get_db)):
    try:
        horarios_service.desprogramar_horario(db, id)
        return {"mensaje": "Bloque horario desprogramado exitosamente."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sugerencias/{asignacion_id}", response_model=SugerenciasHorarioResponse)
def obtener_sugerencias(asignacion_id: int, db: Session = Depends(get_db)):
    try:
        return horarios_service.obtener_sugerencias(db, asignacion_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=550, detail=str(e))
