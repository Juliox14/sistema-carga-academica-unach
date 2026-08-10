from sqlalchemy.orm import Session
from sqlalchemy import and_
from src.infrastructure.database.orm_models import (
    CicloEscolar, AsignacionCarga, HorarioClase, PreferenciaDocente, 
    Docente, DiaSemana, TipoPreferencia, GrupoAbierto, CicloEscolarUnidad
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
        # Encontrar todos los ciclos activos a nivel global para cruzar horarios inter-unidades
        ciclos_activos = db.query(CicloEscolarUnidad.ciclo_escolar_id).filter(CicloEscolarUnidad.activo == True).distinct().all()
        ciclos_activos_ids = [c[0] for c in ciclos_activos]
        ciclos_globales = db.query(CicloEscolar.id).filter(CicloEscolar.activo == True).all()
        ciclos_activos_ids.extend([c[0] for c in ciclos_globales])
        ciclos_activos_ids = list(set(ciclos_activos_ids))
        if not ciclos_activos_ids:
            ciclos_activos_ids = [ciclo.id]

        for h in horas_a_programar:
            docente_ocupado = db.query(HorarioClase)\
                .join(AsignacionCarga)\
                .filter(
                    AsignacionCarga.ciclo_escolar_id.in_(ciclos_activos_ids),
                    HorarioClase.dia_semana == dia_enum,
                    HorarioClase.hora_inicio == h,
                    (AsignacionCarga.docente_titular_id == docente_id) | (AsignacionCarga.docente_temporal_id == docente_id)
                ).first()

            if docente_ocupado:
                docente_obj = db.query(Docente).filter(Docente.id == docente_id).first()
                docente_nombre = f"{docente_obj.nombre} {docente_obj.apellidos}" if docente_obj else "Docente"
                
                # Obtener la unidad del grupo conflictivo
                from src.infrastructure.database.orm_models import PlanEstudios, ProgramaEducativo
                grupo_conflictivo = docente_ocupado.asignacion_carga.grupo_asignado
                unidad_conflictiva = db.query(ProgramaEducativo).join(PlanEstudios).filter(
                    PlanEstudios.id == grupo_conflictivo.plan_estudios_id
                ).first()
                
                unidad_nombre = unidad_conflictiva.unidad_academica.clave if (unidad_conflictiva and unidad_conflictiva.unidad_academica) else "Otra Unidad"

                raise ValueError(
                    f"El docente {docente_nombre} ya tiene una clase programada el {req.dia_semana} "
                    f"de {h}:00 a {h + 1}:00 en el grupo '{grupo_conflictivo.grupo}' de la unidad '{unidad_nombre}'."
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
    slots_docente = {}
    if docente_id:
        horarios_docente = db.query(HorarioClase)\
            .join(AsignacionCarga)\
            .filter(
                AsignacionCarga.ciclo_escolar_id == ciclo.id,
                (AsignacionCarga.docente_titular_id == docente_id) | (AsignacionCarga.docente_temporal_id == docente_id)
            ).all()
        # Mapear cada horario ocupado por el docente a la unidad a la que pertenece ese grupo
        from src.infrastructure.database.orm_models import PlanEstudios, ProgramaEducativo
        for h in horarios_docente:
            g = h.asignacion_carga.grupo_asignado
            u = db.query(ProgramaEducativo).join(PlanEstudios).filter(PlanEstudios.id == g.plan_estudios_id).first()
            u_clave = u.unidad_academica.clave if (u and u.unidad_academica) else "otra unidad"
            slots_docente[(h.dia_semana.name, h.hora_inicio)] = u_clave

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
              u_clave = slots_docente[(dia, hora)]
              sugerencias.append({
                  "dia_semana": dia,
                  "hora_inicio": hora,
                  "hora_fin": hora + 1,
                  "afinidad": "CONFLICTO",
                  "razon": f"El docente ya imparte clases a esta hora ({u_clave})."
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

def obtener_resumen_programacion(db: Session, unidad_id: int | None = None):
    from src.infrastructure.database.orm_models import PlanEstudios, ProgramaEducativo
    ciclo = obtener_ciclo_activo(db, unidad_id)
    if not ciclo:
        raise ValueError("No hay un ciclo activo.")

    grupos_query = db.query(GrupoAbierto).join(PlanEstudios).join(ProgramaEducativo)
    grupos_query = grupos_query.filter(GrupoAbierto.ciclo_escolar_id == ciclo.id)
    if unidad_id:
        grupos_query = grupos_query.filter(ProgramaEducativo.unidad_academica_id == unidad_id)
    
    grupos_abiertos = grupos_query.all()
    
    resumen_grupos = []
    
    total_grupos = len(grupos_abiertos)
    grupos_completos = 0
    grupos_incompletos = 0
    grupos_vacios = 0
    total_hsm_global = 0
    total_programadas_global = 0

    for g in grupos_abiertos:
        asignaciones = db.query(AsignacionCarga).filter(
            AsignacionCarga.grupo_asignado_id == g.id,
            AsignacionCarga.ciclo_escolar_id == ciclo.id
        ).all()
        
        hsm_totales = sum(a.materia.hsm for a in asignaciones if a.materia)
        
        horas_programadas = 0
        for a in asignaciones:
            for horario in a.horarios:
                horas_programadas += (horario.hora_fin - horario.hora_inicio)
                
        horas_pendientes = hsm_totales - horas_programadas
        if horas_pendientes < 0:
            horas_pendientes = 0
            
        estado = "VACIO"
        if horas_programadas == 0:
            estado = "VACIO"
            grupos_vacios += 1
        elif horas_programadas >= hsm_totales:
            estado = "COMPLETO"
            grupos_completos += 1
        else:
            estado = "INCOMPLETO"
            grupos_incompletos += 1
            
        total_hsm_global += hsm_totales
        total_programadas_global += horas_programadas
            
        resumen_grupos.append({
            "grupo_id": g.id,
            "grupo_nombre": f"{g.numero_periodo} {g.grupo}",
            "plan_id": g.plan_estudios_id,
            "plan_nombre": g.plan_estudio.nombre if g.plan_estudio else "Desconocido",
            "turno": g.turno.name if hasattr(g.turno, 'name') else str(g.turno),
            "hsm_totales": hsm_totales,
            "horas_programadas": horas_programadas,
            "horas_pendientes": horas_pendientes,
            "estado": estado
        })
        
    return {
        "total_grupos": total_grupos,
        "grupos_completos": grupos_completos,
        "grupos_incompletos": grupos_incompletos,
        "grupos_vacios": grupos_vacios,
        "total_hsm": total_hsm_global,
        "total_programadas": total_programadas_global,
        "grupos": resumen_grupos
    }

def obtener_mi_horario(db: Session, docente_id: int, unidad_id: int | None = None):
    from sqlalchemy import or_
    from src.infrastructure.database.orm_models import AsignacionCarga
    ciclo = obtener_ciclo_activo(db, unidad_id)
    if not ciclo:
        raise ValueError("No hay un ciclo activo.")
        
    asignaciones = db.query(AsignacionCarga).filter(
        or_(AsignacionCarga.docente_titular_id == docente_id, AsignacionCarga.docente_temporal_id == docente_id),
        AsignacionCarga.ciclo_escolar_id == ciclo.id
    ).all()
    
    materias_res = []
    total_hsm_global = 0.0
    
    for a in asignaciones:
        if not a.materia or not a.grupo_asignado:
            continue
            
        hsm = a.materia.hsm
        total_hsm_global += hsm
        
        # Agrupar horarios por día
        dias_dict = {"L": [], "M": [], "X": [], "J": [], "V": [], "S": [], "D": []}
        for h in a.horarios:
            mapa_dias = {
                "LUNES": "L",
                "MARTES": "M",
                "MIERCOLES": "X",
                "JUEVES": "J",
                "VIERNES": "V",
                "SABADO": "S",
                "DOMINGO": "D"
            }
            letra_dia = mapa_dias.get(h.dia_semana.name, "")
            if letra_dia:
                str_horario = f"{h.hora_inicio}:00-{h.hora_fin}:00"
                dias_dict[letra_dia].append(str_horario)
                
        # Unir strings por día
        horario_dias = {
            "L": "\n".join(dias_dict["L"]),
            "M": "\n".join(dias_dict["M"]),
            "X": "\n".join(dias_dict["X"]),
            "J": "\n".join(dias_dict["J"]),
            "V": "\n".join(dias_dict["V"]),
            "S": "\n".join(dias_dict["S"]),
            "D": "\n".join(dias_dict["D"])
        }
        
        materias_res.append({
            "programa_educativo": a.materia.plan_estudio.programa_educativo.clave if a.materia.plan_estudio and a.materia.plan_estudio.programa_educativo else "N/A",
            "unidad_competencia": a.materia.nombre_asignatura,
            "periodo": str(a.materia.numero_periodo) if a.materia.numero_periodo else "-",
            "grupo": str(a.grupo_asignado.grupo) if a.grupo_asignado else "-",
            "horario_dias": horario_dias,
            "hsm": float(hsm)
        })
        
    from src.infrastructure.database.orm_models import AsignacionOtraActividad
    actividades_asignadas = db.query(AsignacionOtraActividad).filter(
        AsignacionOtraActividad.docente_id == docente_id,
        AsignacionOtraActividad.ciclo_escolar_id == ciclo.id
    ).all()
    
    actividades_res = []
    total_horas_actividades = 0.0
    for act in actividades_asignadas:
        if not act.actividad: continue
        actividades_res.append({
            "actividad": act.actividad.nombre,
            "observaciones": act.observaciones or "",
            "horas": float(act.horas_asignadas)
        })
        total_horas_actividades += act.horas_asignadas
        
    return {
        "materias": materias_res,
        "otras_actividades": actividades_res,
        "total_hsm": total_hsm_global,
        "total_horas_actividades": total_horas_actividades
    }
