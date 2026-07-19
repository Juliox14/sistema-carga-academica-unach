from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional

from src.infrastructure.database.orm_models import Docente, Materia, GrupoAbierto, AsignacionCarga, EstatusMateria, EstadoAsignacion, Turno
from src.application.use_cases.ciclos_service import obtener_ciclo_activo

def obtener_materias_disponibles(db: Session, plan_id: int, docente_id: Optional[int] = None):
    """
    Regla de negocio: 
    - Docentes regulares ven materias no asignadas según su turno.
    - Docentes 'EVENTUAL' ven ÚNICAMENTE descargas pendientes según su turno.
    - Docentes con turno 'MIXTO' o nulo (vista sin seleccionar) ven ambos turnos.
    """
    ciclo = obtener_ciclo_activo(db)
    
    permite_titular = True
    permite_suplente = False
    turno = None
    
    if docente_id:
        docente = db.query(Docente).get(docente_id)
        if docente:
            turno = docente.turno
            if docente.categoria:
                permite_titular = getattr(docente.categoria, 'permite_titular', True)
                permite_suplente = getattr(docente.categoria, 'permite_suplente', False)
    
    disponibles = []

    if permite_suplente:
        # ==========================================
        # BÚSQUEDA DE SUPLENCIAS (descargas disponibles)
        # ==========================================
        query = db.query(AsignacionCarga).join(Materia).join(
            GrupoAbierto, AsignacionCarga.grupo_asignado_id == GrupoAbierto.id
        ).filter(
            AsignacionCarga.ciclo_escolar_id == ciclo.id,
            AsignacionCarga.estado_asignacion == EstadoAsignacion.DESCARGADA,
            AsignacionCarga.docente_temporal_id.is_(None),
            Materia.plan_estudios_id == plan_id
        )

        # Filtro de turno: Aplicar solo si tiene turno y NO es Mixto
        if turno and turno != Turno.MIXTO:
            query = query.filter(GrupoAbierto.turno == turno)

        asignaciones_descargadas = query.all()

        for a in asignaciones_descargadas:
            disponibles.append({
                "materia_id": a.materia_id,
                "grupo_abierto_id": a.grupo_asignado_id,
                "asignatura": a.materia.nombre_asignatura,
                "periodo": a.materia.numero_periodo,
                "grupo": a.grupo_asignado.grupo if a.grupo_asignado else "-",
                "hsm": a.materia.hsm,
                "es_cobertura": True,
                "titular_original": f"{a.docente_titular.apellidos} {a.docente_titular.nombre}" if a.docente_titular else "Desconocido"
            })
            
    if permite_titular:
        # ==========================================
        # BÚSQUEDA DE CARGA LIBRE (clases regulares)
        # ==========================================
        # 1. Subconsulta súper rápida para saber qué materias YA están asignadas
        asignadas_subq = db.query(AsignacionCarga.materia_id, AsignacionCarga.grupo_asignado_id).filter(
            AsignacionCarga.ciclo_escolar_id == ciclo.id,
            AsignacionCarga.docente_titular_id.isnot(None)
        ).subquery()

        query = db.query(Materia, GrupoAbierto).join(
            GrupoAbierto,
            and_(
                Materia.numero_periodo == GrupoAbierto.numero_periodo,
                GrupoAbierto.ciclo_escolar_id == ciclo.id,
                GrupoAbierto.plan_estudios_id == plan_id
            )
        ).filter(
            or_(
                and_(Materia.es_especial == True, GrupoAbierto.es_especial == True),
                and_(Materia.es_especial == False, GrupoAbierto.es_especial == False)
            )
        ).outerjoin(
            # Excluimos las que aparezcan en la subconsulta
            asignadas_subq,
            and_(
                Materia.id == asignadas_subq.c.materia_id,
                GrupoAbierto.id == asignadas_subq.c.grupo_asignado_id
            )
        ).filter(
            Materia.plan_estudios_id == plan_id,
            Materia.estatus == EstatusMateria.ACTIVA,
            asignadas_subq.c.materia_id.is_(None) # Equivalente a "NOT IN" (solo trae las libres)
        )

        # 3. Aplicamos el filtro de Turno
        if turno and turno != Turno.MIXTO:
            query = query.filter(GrupoAbierto.turno == turno)

        # 4. Ejecutamos 1 sola vez
        resultados = query.all()

        for materia, grupo in resultados:
            disponibles.append({
                "materia_id": materia.id,
                "grupo_abierto_id": grupo.id,
                "asignatura": materia.nombre_asignatura,
                "periodo": materia.numero_periodo,
                "grupo": grupo.grupo,
                "area_conocimiento_id": materia.area_conocimiento_id,
                "turno": grupo.turno.value if hasattr(grupo, 'turno') else None,
                "hsm": materia.hsm,
                "es_cobertura": False
            })

    return disponibles