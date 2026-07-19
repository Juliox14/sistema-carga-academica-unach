from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.infrastructure.database.orm_models import UnidadAcademica, DocenteUnidad, Docente


def crear_unidad(db: Session, datos: dict) -> UnidadAcademica:
    """Crea una nueva unidad academica."""
    clave = datos.get("clave", "").upper().strip()
    existente = db.query(UnidadAcademica).filter(UnidadAcademica.clave == clave).first()
    if existente:
        raise ValueError(f"Ya existe una unidad academica con la clave '{clave}'.")

    unidad = UnidadAcademica(
        nombre=datos["nombre"],
        clave=clave,
        campus=datos.get("campus", 1),
        ciudad=datos.get("ciudad"),
        direccion=datos.get("direccion"),
    )
    db.add(unidad)
    db.commit()
    db.refresh(unidad)
    return unidad


def obtener_unidades(db: Session) -> list:
    """Retorna todas las unidades academicas."""
    return db.query(UnidadAcademica).order_by(UnidadAcademica.nombre).all()


def obtener_unidad_por_id(db: Session, unidad_id: int) -> UnidadAcademica:
    """Retorna una unidad academica por ID."""
    unidad = db.query(UnidadAcademica).filter(UnidadAcademica.id == unidad_id).first()
    if not unidad:
        raise HTTPException(status_code=404, detail="Unidad academica no encontrada.")
    return unidad


def actualizar_unidad(db: Session, unidad_id: int, datos: dict) -> UnidadAcademica:
    """Actualiza los datos de una unidad academica."""
    unidad = db.query(UnidadAcademica).filter(UnidadAcademica.id == unidad_id).first()
    if not unidad:
        raise HTTPException(status_code=404, detail="Unidad academica no encontrada.")

    if "clave" in datos and datos["clave"]:
        nueva_clave = datos["clave"].upper().strip()
        conflicto = db.query(UnidadAcademica).filter(
            UnidadAcademica.clave == nueva_clave,
            UnidadAcademica.id != unidad_id
        ).first()
        if conflicto:
            raise ValueError(f"Ya existe otra unidad academica con la clave '{nueva_clave}'.")
        datos["clave"] = nueva_clave

    for campo, valor in datos.items():
        setattr(unidad, campo, valor)

    db.commit()
    db.refresh(unidad)
    return unidad


def eliminar_unidad(db: Session, unidad_id: int) -> bool:
    """Elimina una unidad academica."""
    from src.infrastructure.database.orm_models import Usuario
    unidad = db.query(UnidadAcademica).filter(UnidadAcademica.id == unidad_id).first()
    if not unidad:
        raise HTTPException(status_code=404, detail="Unidad academica no encontrada.")

    tiene_usuarios = db.query(Usuario).filter(Usuario.unidad_academica_id == unidad_id).count()
    if tiene_usuarios > 0:
        raise ValueError("No se puede eliminar: la unidad tiene usuarios asignados.")

    db.delete(unidad)
    db.commit()
    return True


def obtener_docentes_de_unidad(db: Session, unidad_id: int) -> list:
    """Retorna todos los docentes vinculados a una unidad academica."""
    obtener_unidad_por_id(db, unidad_id)
    return (
        db.query(DocenteUnidad)
        .filter(DocenteUnidad.unidad_academica_id == unidad_id)
        .all()
    )


def vincular_docente_a_unidad(db: Session, unidad_id: int, docente_id: int, es_principal: bool, horas_obligatorias: float = 0) -> DocenteUnidad:
    """Vincula un docente a una unidad academica."""
    obtener_unidad_por_id(db, unidad_id)
    docente = db.query(Docente).filter(Docente.id == docente_id).first()
    if not docente:
        raise HTTPException(status_code=404, detail="Docente no encontrado.")

    existente = db.query(DocenteUnidad).filter(
        DocenteUnidad.docente_id == docente_id,
        DocenteUnidad.unidad_academica_id == unidad_id
    ).first()
    if existente:
        raise ValueError("El docente ya esta vinculado a esta unidad academica.")

    if es_principal:
        db.query(DocenteUnidad).filter(
            DocenteUnidad.docente_id == docente_id,
            DocenteUnidad.es_unidad_principal == True
        ).update({"es_unidad_principal": False})
    else:
        # Si no es principal, ignoramos las horas obligatorias
        horas_obligatorias = 0

    vinculo = DocenteUnidad(
        docente_id=docente_id,
        unidad_academica_id=unidad_id,
        es_unidad_principal=es_principal,
        horas_obligatorias=horas_obligatorias
    )
    db.add(vinculo)
    db.commit()
    db.refresh(vinculo)
    return vinculo


def desvincular_docente_de_unidad(db: Session, unidad_id: int, docente_id: int) -> bool:
    """Desvincula un docente de una unidad academica."""
    vinculo = db.query(DocenteUnidad).filter(
        DocenteUnidad.docente_id == docente_id,
        DocenteUnidad.unidad_academica_id == unidad_id
    ).first()
    if not vinculo:
        raise HTTPException(status_code=404, detail="El docente no esta vinculado a esta unidad.")

    db.delete(vinculo)
    db.commit()
    return True


def actualizar_vinculo_docente(db: Session, unidad_id: int, docente_id: int, es_principal: bool, horas_obligatorias: float = 0) -> DocenteUnidad:
    """Actualiza si una unidad es la principal del docente."""
    vinculo = db.query(DocenteUnidad).filter(
        DocenteUnidad.docente_id == docente_id,
        DocenteUnidad.unidad_academica_id == unidad_id
    ).first()
    if not vinculo:
        raise HTTPException(status_code=404, detail="El docente no esta vinculado a esta unidad.")

    if es_principal:
        db.query(DocenteUnidad).filter(
            DocenteUnidad.docente_id == docente_id,
            DocenteUnidad.unidad_academica_id != unidad_id
        ).update({"es_unidad_principal": False})
    else:
        # Si ya no es principal, quitamos las horas obligatorias
        horas_obligatorias = 0

    vinculo.es_unidad_principal = es_principal
    vinculo.horas_obligatorias = horas_obligatorias
    db.commit()
    db.refresh(vinculo)
    return vinculo
