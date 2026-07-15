from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.infrastructure.database.orm_models import CicloEscolar
from src.infrastructure.api.schemas.ciclos_schema import CicloEscolarCreate, CicloEscolarUpdate

def crear_ciclo(db: Session, ciclo_data: CicloEscolarCreate):
    db.query(CicloEscolar).filter_by(activo=True).update({"activo": False})
    
    nuevo_ciclo = CicloEscolar(**ciclo_data.model_dump())
    
    db.add(nuevo_ciclo)
    db.commit()
    db.refresh(nuevo_ciclo)
    return nuevo_ciclo

def obtener_ciclos(db: Session):
    return db.query(CicloEscolar).all()

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
    ciclo = db.query(CicloEscolar).filter(CicloEscolar.id == ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo escolar no encontrado")
    
    db.delete(ciclo)
    db.commit()
    return True

def obtener_ciclo_activo(db: Session):
    ciclo = db.query(CicloEscolar).filter_by(activo=True).first()
    
    if not ciclo:
        raise HTTPException(status_code=400, detail="No hay un ciclo escolar activo.")
    return ciclo

def finalizar_carga_ciclo_activo(db: Session):
    from src.infrastructure.database.orm_models import Materia, GrupoAbierto, AsignacionCarga, EstatusMateria, EstadoAsignacion
    from sqlalchemy import and_

    ciclo = obtener_ciclo_activo(db)
    
    # 1. Subconsulta de materias ya asignadas en el ciclo activo (tienen titular)
    asignadas_subq = db.query(AsignacionCarga.materia_id, AsignacionCarga.grupo_asignado_id).filter(
        AsignacionCarga.ciclo_escolar_id == ciclo.id,
        AsignacionCarga.docente_titular_id.isnot(None)
    ).subquery()

    # 2. Obtener materias y grupos abiertos activos del ciclo que no tienen asignación
    unassigned_pairs = db.query(Materia, GrupoAbierto).join(
        GrupoAbierto,
        and_(
            Materia.numero_periodo == GrupoAbierto.numero_periodo,
            Materia.plan_estudios_id == GrupoAbierto.plan_estudios_id,
            GrupoAbierto.ciclo_escolar_id == ciclo.id
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

    # 3. Crear registros de vacantes para cada par no asignado
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

    ciclo.carga_finalizada = True #type: ignore
    db.commit()
    db.refresh(ciclo)
    return ciclo

def desfinalizar_carga_ciclo_activo(db: Session):
    from src.infrastructure.database.orm_models import AsignacionCarga, EstadoAsignacion
    ciclo = obtener_ciclo_activo(db)
    
    db.query(AsignacionCarga).filter(
        AsignacionCarga.ciclo_escolar_id == ciclo.id,
        AsignacionCarga.estado_asignacion == EstadoAsignacion.VACANTE
    ).delete(synchronize_session=False)

    ciclo.carga_finalizada = False #type: ignore
    db.commit()
    db.refresh(ciclo)
    return ciclo