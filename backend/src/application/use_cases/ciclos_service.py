from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.infrastructure.database.orm_models import CicloEscolar, CicloEscolarUnidad, UnidadAcademica
from src.infrastructure.api.schemas.ciclos_schema import CicloEscolarCreate, CicloEscolarUpdate

def crear_ciclo(db: Session, ciclo_data: CicloEscolarCreate):
    nuevo_ciclo = CicloEscolar(**ciclo_data.model_dump())

    db.add(nuevo_ciclo)
    db.commit()
    db.refresh(nuevo_ciclo)

    # Crear entrada en ciclos_escolares_unidades para cada unidad existente (inactivo por defecto)
    unidades = db.query(UnidadAcademica).all()
    for u in unidades:
        registro = CicloEscolarUnidad(
            ciclo_escolar_id=nuevo_ciclo.id,
            unidad_academica_id=u.id,
            activo=False,
            carga_finalizada=False
        )
        db.add(registro)
    db.commit()
    db.refresh(nuevo_ciclo)
    return nuevo_ciclo

def obtener_ciclos(db: Session, unidad_id: int | None = None):
    from src.infrastructure.database.orm_models import UnidadAcademica
    ciclos = db.query(CicloEscolar).all()
    if unidad_id:
        for c in ciclos:
            estado = db.query(CicloEscolarUnidad).filter(
                CicloEscolarUnidad.ciclo_escolar_id == c.id,
                CicloEscolarUnidad.unidad_academica_id == unidad_id
            ).first()
            if estado:
                c.activo = estado.activo
                c.carga_finalizada = estado.carga_finalizada
            else:
                c.activo = False
                c.carga_finalizada = False
    else:
        for c in ciclos:
            estados_db = db.query(CicloEscolarUnidad, UnidadAcademica).join(
                UnidadAcademica, UnidadAcademica.id == CicloEscolarUnidad.unidad_academica_id
            ).filter(CicloEscolarUnidad.ciclo_escolar_id == c.id).all()
            
            c.estados_unidades = [
                {
                    "unidad_academica_id": eu.CicloEscolarUnidad.unidad_academica_id,
                    "unidad_academica_nombre": eu.UnidadAcademica.nombre,
                    "activo": eu.CicloEscolarUnidad.activo,
                    "carga_finalizada": eu.CicloEscolarUnidad.carga_finalizada
                }
                for eu in estados_db
            ]
    return ciclos

def obtener_ciclo_por_id(db: Session, ciclo_id: int):
    return db.query(CicloEscolar).filter(CicloEscolar.id == ciclo_id).first()

def actualizar_ciclo(db: Session, ciclo_id: int, ciclo_data: CicloEscolarUpdate):
    ciclo = db.query(CicloEscolar).filter(CicloEscolar.id == ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo escolar no encontrado")
    
    ciclo_data_dict = ciclo_data.model_dump(exclude_unset=True)
    
    for key, value in ciclo_data_dict.items():
        setattr(ciclo, key, value)
    
    db.commit()
    db.refresh(ciclo)
    
    return ciclo

def eliminar_ciclo(db: Session, ciclo_id: int):
    from src.infrastructure.database.orm_models import GrupoAbierto, AsignacionCarga
    ciclo = db.query(CicloEscolar).filter(CicloEscolar.id == ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo escolar no encontrado")
        
    activos = db.query(CicloEscolarUnidad).filter(
        CicloEscolarUnidad.ciclo_escolar_id == ciclo_id,
        CicloEscolarUnidad.activo == True
    ).count()
    if activos > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar un ciclo que está activo en alguna unidad académica.")
        
    grupos = db.query(GrupoAbierto).filter(GrupoAbierto.ciclo_escolar_id == ciclo_id).count()
    asignaciones = db.query(AsignacionCarga).filter(AsignacionCarga.ciclo_escolar_id == ciclo_id).count()
    if grupos > 0 or asignaciones > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar el ciclo porque ya tiene registros históricos vinculados (grupos o asignaciones).")
    
    db.delete(ciclo)
    db.commit()
    return True

def obtener_ciclo_activo(db: Session, unidad_id: int | None = None):
    """Obtiene el ciclo activo. Si se provee unidad_id, busca el activo en esa unidad.
    Si no, busca el primer ciclo con activo=True en la tabla de ciclos (compatibilidad legacy)."""
    if unidad_id:
        estado = db.query(CicloEscolarUnidad).filter(
            CicloEscolarUnidad.unidad_academica_id == unidad_id,
            CicloEscolarUnidad.activo == True
        ).first()
        if not estado:
            raise HTTPException(status_code=400, detail="No hay un ciclo escolar activo para esta unidad academica.")
        ciclo = db.query(CicloEscolar).filter(CicloEscolar.id == estado.ciclo_escolar_id).first()
        if not ciclo:
            raise HTTPException(status_code=400, detail="Ciclo activo no encontrado.")
        # Inyectar el estado de la unidad en el ciclo para que sea transparente para los consumidores
        ciclo.activo = estado.activo
        ciclo.carga_finalizada = estado.carga_finalizada #type: ignore
        return ciclo
    # Fallback: buscar por el campo global (para SUPER_ADMIN sin contexto de unidad)
    ciclo = db.query(CicloEscolar).join(
        CicloEscolarUnidad, CicloEscolarUnidad.ciclo_escolar_id == CicloEscolar.id
    ).filter(CicloEscolarUnidad.activo == True).first()
    if not ciclo:
        raise HTTPException(status_code=400, detail="No hay un ciclo escolar activo.")
    return ciclo


def activar_ciclo_para_unidad(db: Session, ciclo_id: int, unidad_id: int) -> CicloEscolarUnidad:
    """Activa un ciclo para una unidad especifica, desactivando el anterior."""
    # Validar que no haya un ciclo actualmente activo (debe cerrarse primero)
    ciclo_activo_actual = db.query(CicloEscolarUnidad).filter(
        CicloEscolarUnidad.unidad_academica_id == unidad_id,
        CicloEscolarUnidad.activo == True
    ).first()
    
    if ciclo_activo_actual:
        raise ValueError("No se puede abrir un ciclo nuevo sin haber cerrado el actual.")

    # Activar el ciclo solicitado para esa unidad
    estado = db.query(CicloEscolarUnidad).filter(
        CicloEscolarUnidad.ciclo_escolar_id == ciclo_id,
        CicloEscolarUnidad.unidad_academica_id == unidad_id
    ).first()
    if not estado:
        # Crear el registro si no existe
        estado = CicloEscolarUnidad(
            ciclo_escolar_id=ciclo_id,
            unidad_academica_id=unidad_id,
            activo=True,
            carga_finalizada=False
        )
        db.add(estado)
    else:
        estado.activo = True
        estado.carga_finalizada = False

    db.commit()
    db.refresh(estado)
    return estado

def finalizar_carga_ciclo_activo(db: Session, unidad_id: int | None = None):
    from src.infrastructure.database.orm_models import Materia, GrupoAbierto, AsignacionCarga, EstatusMateria, EstadoAsignacion, PlanEstudios, ProgramaEducativo
    from sqlalchemy import and_, or_

    ciclo = obtener_ciclo_activo(db, unidad_id=unidad_id)

    # Filtrar grupos del ciclo activo, restringiendo por unidad si corresponde
    grupos_query = db.query(GrupoAbierto).filter(GrupoAbierto.ciclo_escolar_id == ciclo.id)
    if unidad_id:
        grupos_query = grupos_query.join(
            PlanEstudios, PlanEstudios.id == GrupoAbierto.plan_estudios_id
        ).join(
            ProgramaEducativo, ProgramaEducativo.id == PlanEstudios.programa_educativo_id
        ).filter(ProgramaEducativo.unidad_academica_id == unidad_id)

    # Subconsulta de materias ya asignadas en el ciclo activo (tienen titular)
    asignadas_subq = db.query(AsignacionCarga.materia_id, AsignacionCarga.grupo_asignado_id).filter(
        AsignacionCarga.ciclo_escolar_id == ciclo.id,
        AsignacionCarga.docente_titular_id.isnot(None)
    ).subquery()

    # Obtener materias y grupos abiertos activos del ciclo que no tienen asignacion
    unassigned_pairs = db.query(Materia, GrupoAbierto).join(
        GrupoAbierto,
        and_(
            Materia.numero_periodo == GrupoAbierto.numero_periodo,
            Materia.plan_estudios_id == GrupoAbierto.plan_estudios_id,
            GrupoAbierto.ciclo_escolar_id == ciclo.id
        )
    ).filter(
        or_(
            and_(Materia.es_especial == True, GrupoAbierto.es_especial == True),
            and_(Materia.es_especial == False, GrupoAbierto.es_especial == False)
        )
    ).outerjoin(
        asignadas_subq,
        and_(
            Materia.id == asignadas_subq.c.materia_id,
            GrupoAbierto.id == asignadas_subq.c.grupo_asignado_id
        )
    ).filter(
        Materia.estatus == EstatusMateria.ACTIVA,
        asignadas_subq.c.materia_id.is_(None)
    ).all()

    for materia, grupo in unassigned_pairs:
        existing = db.query(AsignacionCarga).filter(
            AsignacionCarga.materia_id == materia.id,
            AsignacionCarga.grupo_asignado_id == grupo.id,
            AsignacionCarga.ciclo_escolar_id == ciclo.id
        ).first()

        if not existing:
            vacante = AsignacionCarga(
                materia_id=materia.id,
                grupo_asignado_id=grupo.id,
                docente_titular_id=None,
                docente_temporal_id=None,
                ciclo_escolar_id=ciclo.id,
                estado_asignacion=EstadoAsignacion.VACANTE
            )
            db.add(vacante)
        else:
            if existing.estado_asignacion == EstadoAsignacion.PENDIENTE:
                existing.estado_asignacion = EstadoAsignacion.VACANTE

    # Actualizar estado en ciclos_escolares_unidades
    if unidad_id:
        estado = db.query(CicloEscolarUnidad).filter(
            CicloEscolarUnidad.ciclo_escolar_id == ciclo.id,
            CicloEscolarUnidad.unidad_academica_id == unidad_id
        ).first()
        if estado:
            estado.carga_finalizada = True
    else:
        ciclo.carga_finalizada = True

    db.commit()
    db.refresh(ciclo)
    if unidad_id and estado:
        ciclo.carga_finalizada = estado.carga_finalizada
        ciclo.activo = estado.activo
    return ciclo

def desfinalizar_carga_ciclo_activo(db: Session, unidad_id: int | None = None):
    from src.infrastructure.database.orm_models import AsignacionCarga, EstadoAsignacion
    ciclo = obtener_ciclo_activo(db, unidad_id=unidad_id)

    db.query(AsignacionCarga).filter(
        AsignacionCarga.ciclo_escolar_id == ciclo.id,
        AsignacionCarga.estado_asignacion == EstadoAsignacion.VACANTE
    ).delete(synchronize_session=False)

    if unidad_id:
        estado = db.query(CicloEscolarUnidad).filter(
            CicloEscolarUnidad.ciclo_escolar_id == ciclo.id,
            CicloEscolarUnidad.unidad_academica_id == unidad_id
        ).first()
        if estado:
            estado.carga_finalizada = False
    else:
        ciclo.carga_finalizada = False

    db.commit()
    db.refresh(ciclo)
    if unidad_id and estado:
        ciclo.carga_finalizada = estado.carga_finalizada
        ciclo.activo = estado.activo
    return ciclo
def cerrar_ciclo_para_unidad(db: Session, ciclo_id: int, unidad_id: int) -> dict:
    from src.infrastructure.database.orm_models import GrupoAbierto, AsignacionCarga, HorarioClase, Materia, PlanEstudios, ProgramaEducativo
    
    # Obtener el estado del ciclo para la unidad
    estado = db.query(CicloEscolarUnidad).filter(
        CicloEscolarUnidad.ciclo_escolar_id == ciclo_id,
        CicloEscolarUnidad.unidad_academica_id == unidad_id
    ).first()
    
    if not estado or not estado.activo:
        raise ValueError('El ciclo escolar no está activo para esta unidad')
        
    if not estado.carga_finalizada:
        raise ValueError('No se puede cerrar el ciclo porque aún no se ha finalizado la carga académica. Finaliza la carga primero.')

    # Buscar grupos abiertos del ciclo que pertenecen a esta unidad
    grupos = db.query(GrupoAbierto).join(PlanEstudios).join(ProgramaEducativo).filter(
        GrupoAbierto.ciclo_escolar_id == ciclo_id,
        ProgramaEducativo.unidad_academica_id == unidad_id
    ).all()
    
    grupo_ids = [g.id for g in grupos]
    if not grupo_ids:
        # Se puede cerrar si no hay grupos, pero retornamos exito vacio
        pass
    
    errores = []

    # Obtener todas las asignaciones de estos grupos
    asignaciones = db.query(AsignacionCarga).filter(
        AsignacionCarga.grupo_asignado_id.in_(grupo_ids),
        AsignacionCarga.ciclo_escolar_id == ciclo_id
    ).all()
    
    if not asignaciones and grupo_ids:
        errores.append('Hay grupos abiertos sin materias asignadas')

    # Validacion 1: Todas las asignaciones deben tener docente
    for asig in asignaciones:
        if not asig.docente_titular_id:
            errores.append(f'Falta asignar docente a la materia {asig.materia.nombre_asignatura} del grupo {asig.grupo_asignado.nombre}')
            continue
        
        # Validacion 2: Horarios
        horas_programadas = 0
        for horario in asig.horarios:
            horas_programadas += (horario.hora_fin - horario.hora_inicio)
            
        if horas_programadas != asig.materia.hsm:
            errores.append(f'Faltan/Sobran horas de horario en la materia {asig.materia.nombre_asignatura} del grupo {asig.grupo_asignado.nombre} (Programadas: {horas_programadas}, HSM: {asig.materia.hsm})')
            
    if errores:
        return {'success': False, 'errores': errores}
        
    estado.activo = False
    estado.carga_finalizada = True
    db.commit()
    db.refresh(estado)
    return {'success': True, 'errores': []}
