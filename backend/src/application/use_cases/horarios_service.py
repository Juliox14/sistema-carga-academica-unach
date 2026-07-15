from sqlalchemy.orm import Session
from sqlalchemy import and_
from src.infrastructure.database.orm_models import (
    CicloEscolar, AsignacionCarga, HorarioClase, PreferenciaDocente, 
    Docente, DiaSemana, TipoPreferencia, GrupoAbierto
)
from src.infrastructure.api.schemas.horarios_schema import ProgramarHorarioRequest, PreferenciaDocenteItem
from typing import List
from src.application.use_cases.ciclos_service import obtener_ciclo_activo

def obtener_horarios_grupo(db: Session, grupo_id: int):
    # Encontrar todos los horarios correspondientes a asignaciones del grupo
    return db.query(HorarioClase)\
        .join(AsignacionCarga)\
        .filter(AsignacionCarga.grupo_asignado_id == grupo_id)\
        .all()

def programar_horario(db: Session, req: ProgramarHorarioRequest):
    ciclo = obtener_ciclo_activo(db)

    if not ciclo.carga_finalizada:
        raise ValueError("Debe finalizar la carga académica antes de poder programar horarios.")

    asignacion = db.query(AsignacionCarga).filter(AsignacionCarga.id == req.asignacion_carga_id).first()
    if not asignacion:
        raise ValueError("No se encontró la asignación de carga académica especificada.")

    dia_enum = DiaSemana[req.dia_semana.upper()]

    horas_a_programar = [req.hora_inicio]
    if req.duracion == 2:
        horas_a_programar.append(req.hora_inicio + 1)


    grupo_turno = asignacion.grupo_asignado.turno if asignacion.grupo_asignado else "MIXTO"
    if hasattr(grupo_turno, 'name'):
        grupo_turno_str = str(getattr(grupo_turno, 'name')).upper()
    else:
        grupo_turno_str = str(grupo_turno).upper()

    for h in horas_a_programar:
        if grupo_turno_str == "MATUTINO" and not (7 <= h < 14):
            raise ValueError(f"El grupo es del turno Matutino (7:00 AM a 2:00 PM). La hora {h}:00 está fuera de este horario.")
        if grupo_turno_str == "VESPERTINO" and not (15 <= h < 22):
            raise ValueError(f"El grupo es del turno Vespertino (3:00 PM a 10:00 PM). La hora {h}:00 está fuera de este horario.")


    horas_programadas = db.query(HorarioClase).filter(
        HorarioClase.asignacion_carga_id == req.asignacion_carga_id
    ).count()

    hsm_materia = asignacion.materia.hsm if asignacion.materia else 0
    if horas_programadas + len(horas_a_programar) > hsm_materia:
        raise ValueError(
            f"No se pueden programar {len(horas_a_programar)} horas para esta materia. "
            f"Límite alcanzado (Programadas: {horas_programadas}, HSM: {hsm_materia})."
        )

    for h in horas_a_programar:
        grupo_ocupado = db.query(HorarioClase)\
            .join(AsignacionCarga)\
            .filter(
                AsignacionCarga.grupo_asignado_id == asignacion.grupo_asignado_id,
                AsignacionCarga.ciclo_escolar_id == ciclo.id,
                HorarioClase.dia_semana == dia_enum,
                HorarioClase.hora_inicio == h
            ).first()

        if grupo_ocupado:
            raise ValueError(
                f"El grupo ya tiene una clase programada el {req.dia_semana} "
                f"de {h}:00 a {h + 1}:00 con la materia '{grupo_ocupado.asignacion_carga.materia.nombre_asignatura}'."
            )

    docente_id = asignacion.docente_titular_id or asignacion.docente_temporal_id
    if docente_id:
        for h in horas_a_programar:
            docente_ocupado = db.query(HorarioClase)\
                .join(AsignacionCarga)\
                .filter(
                    AsignacionCarga.ciclo_escolar_id == ciclo.id,
                    HorarioClase.dia_semana == dia_enum,
                    HorarioClase.hora_inicio == h,
                    (AsignacionCarga.docente_titular_id == docente_id) | (AsignacionCarga.docente_temporal_id == docente_id)
                ).first()

            if docente_ocupado:
                docente_obj = db.query(Docente).filter(Docente.id == docente_id).first()
                docente_nombre = f"{docente_obj.nombre} {docente_obj.apellidos}" if docente_obj else "Docente"
                raise ValueError(
                    f"El docente {docente_nombre} ya tiene una clase programada el {req.dia_semana} "
                    f"de {h}:00 a {h + 1}:00 en el grupo '{docente_ocupado.asignacion_carga.grupo_asignado.grupo}'."
                )

    ultimo_horario = None
    for h in horas_a_programar:
        nuevo_horario = HorarioClase(
            asignacion_carga_id=req.asignacion_carga_id,
            dia_semana=dia_enum,
            hora_inicio=h,
            hora_fin=h + 1
        )
        db.add(nuevo_horario)
        ultimo_horario = nuevo_horario
        
    db.commit()
    db.refresh(ultimo_horario)
    return ultimo_horario

def desprogramar_horario(db: Session, horario_id: int):
    horario = db.query(HorarioClase).filter(HorarioClase.id == horario_id).first()
    if not horario:
        raise ValueError("No se encontró el bloque horario especificado.")
    db.delete(horario)
    db.commit()
    return True

def obtener_sugerencias(db: Session, asignacion_id: int):
    asignacion = db.query(AsignacionCarga).filter(AsignacionCarga.id == asignacion_id).first()
    if not asignacion:
        raise ValueError("No se encontró la asignación de carga.")

    ciclo = obtener_ciclo_activo(db)
    if not ciclo:
        raise ValueError("No hay un ciclo activo.")

    docente_id = asignacion.docente_titular_id or asignacion.docente_temporal_id
    grupo = asignacion.grupo_asignado

    # Obtener preferencias del docente
    preferencias = {}
    horas_evitar_por_dia = {}
    if docente_id:
        prefs = db.query(PreferenciaDocente).filter(
            PreferenciaDocente.docente_id == docente_id,
            PreferenciaDocente.ciclo_escolar_id == ciclo.id
        ).all()
        preferencias = {p.dia_semana.name: p.tipo_preferencia.name for p in prefs}
        for p in prefs:
            if p.horas_bloqueadas:
                try:
                    horas_evitar_por_dia[p.dia_semana.name] = [int(x) for x in p.horas_bloqueadas.split(",") if x.strip()]
                except Exception:
                    horas_evitar_por_dia[p.dia_semana.name] = []

    # Obtener materias ya agendadas del grupo para la regla de contigüidad
    horarios_grupo = db.query(HorarioClase)\
        .join(AsignacionCarga)\
        .filter(
            AsignacionCarga.grupo_asignado_id == asignacion.grupo_asignado_id,
            AsignacionCarga.ciclo_escolar_id == ciclo.id
        ).all()
    
    slots_grupo = {(h.dia_semana.name, h.hora_inicio) for h in horarios_grupo}

    # Obtener horarios del docente para conflictos
    slots_docente = set()
    if docente_id:
        horarios_docente = db.query(HorarioClase)\
            .join(AsignacionCarga)\
            .filter(
                AsignacionCarga.ciclo_escolar_id == ciclo.id,
                (AsignacionCarga.docente_titular_id == docente_id) | (AsignacionCarga.docente_temporal_id == docente_id)
            ).all()
        slots_docente = {(h.dia_semana.name, h.hora_inicio) for h in horarios_docente}

    sugerencias = []
    dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"]

    # Calcular afinidades para cada bloque (7:00 a 22:00)
    for dia in dias:
      pref_dia = preferencias.get(dia, "NEUTRAL")
      
      for hora in range(7, 22):
          grupo_turno = str(getattr(grupo.turno, 'name')).upper() if grupo and hasattr(grupo.turno, 'name') else str(grupo.turno).upper() if grupo else "MIXTO"
          
          if grupo_turno == "MATUTINO" and not (7 <= hora < 14):
              sugerencias.append({
                  "dia_semana": dia,
                  "hora_inicio": hora,
                  "hora_fin": hora + 1,
                  "afinidad": "CONFLICTO",
                  "razon": "Fuera del turno Matutino de este grupo (7:00 AM a 2:00 PM)."
              })
              continue
              
          if grupo_turno == "VESPERTINO" and not (15 <= hora < 22):
              sugerencias.append({
                  "dia_semana": dia,
                  "hora_inicio": hora,
                  "hora_fin": hora + 1,
                  "afinidad": "CONFLICTO",
                  "razon": "Fuera del turno Vespertino de este grupo (3:00 PM a 10:00 PM)."
              })
              continue

          if (dia, hora) in slots_grupo:
              sugerencias.append({
                  "dia_semana": dia,
                  "hora_inicio": hora,
                  "hora_fin": hora + 1,
                  "afinidad": "CONFLICTO",
                  "razon": "Espacio ocupado por otra materia de este grupo."
              })
              continue

          if (dia, hora) in slots_docente:
              sugerencias.append({
                  "dia_semana": dia,
                  "hora_inicio": hora,
                  "hora_fin": hora + 1,
                  "afinidad": "CONFLICTO",
                  "razon": "El docente ya imparte clases a esta hora en otro grupo."
              })
              continue

          # 2. Calcular puntaje (Restricciones blandas)
          score = 0
          razones = []

          # Coincidencia de turno (por defecto todo dentro de los límites duros ya es afín al turno)
          score += 10
          razones.append(f"Dentro del turno {grupo_turno.capitalize()} del grupo.")

          # Preferencias
          if pref_dia == "PREFERIR":
              score += 15
              razones.append("Día preferido configurado por el docente.")
          elif pref_dia == "EVITAR":
              score -= 15
              razones.append("Día a evitar configurado por el docente.")

          # Horas específicas a evitar
          if dia in horas_evitar_por_dia and hora in horas_evitar_por_dia[dia]:
              score -= 20
              razones.append("Hora específica a evitar configurada por el docente.")

          # Contigüidad (Hora hueca)
          tiene_vecino = (dia, hora - 1) in slots_grupo or (dia, hora + 1) in slots_grupo
          if tiene_vecino:
              score += 5
              razones.append("Evita horas muertas/huecas para los alumnos.")

          # Clasificar afinidad
          if score >= 20:
              afinidad = "ALTA"
          elif score >= 0:
              afinidad = "MEDIA"
          else:
              afinidad = "BAJA"

          razon_final = " | ".join(razones) if razones else "Espacio disponible."
          sugerencias.append({
              "dia_semana": dia,
              "hora_inicio": hora,
              "hora_fin": hora + 1,
              "afinidad": afinidad,
              "razon": razon_final
          })

    return {"sugerencias": sugerencias}

def obtener_preferencias_docente(db: Session, docente_id: int, ciclo_id: int):
    prefs = db.query(PreferenciaDocente).filter(
        PreferenciaDocente.docente_id == docente_id,
        PreferenciaDocente.ciclo_escolar_id == ciclo_id
    ).all()

    # Si no tiene guardadas, retornamos una lista vacía y el frontend asumirá NEUTRAL por defecto
    return prefs

def guardar_preferencias_docente(db: Session, docente_id: int, ciclo_id: int, items: List[PreferenciaDocenteItem]):
    # 1. Eliminar anteriores para este ciclo
    db.query(PreferenciaDocente).filter(
        PreferenciaDocente.docente_id == docente_id,
        PreferenciaDocente.ciclo_escolar_id == ciclo_id
    ).delete(synchronize_session=False)

    # 2. Insertar nuevas
    for item in items:
        pref = PreferenciaDocente(
            docente_id=docente_id,
            ciclo_escolar_id=ciclo_id,
            dia_semana=DiaSemana[item.dia_semana.upper()],
            tipo_preferencia=TipoPreferencia[item.tipo_preferencia.upper()],
            horas_bloqueadas=item.horas_bloqueadas
        )
        db.add(pref)

    db.commit()
    return obtener_preferencias_docente(db, docente_id, ciclo_id)
