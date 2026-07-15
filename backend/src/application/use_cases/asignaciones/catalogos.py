from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from src.infrastructure.database.orm_models import Docente, PlanEstudios, OtraActividad, CategoriaDocente, EstatusDocente

def buscar_docentes(db: Session, categoria_id: int | None = None, query: str | None = None):
    """Devuelve la lista de docentes activos, filtrable por categoría y nombre."""
    filtros = [EstatusDocente.permite_carga == True]
    
    if categoria_id:
        filtros.append(Docente.categoria_id == categoria_id)
        
    if query:
        search_term = f"%{query}%"
        filtros.append(or_(
            Docente.nombre.ilike(search_term),
            Docente.apellidos.ilike(search_term)
        ))
        
    docentes = db.query(Docente).join(EstatusDocente).filter(and_(*filtros)).order_by(EstatusDocente.es_prioritario.desc(), Docente.apellidos, Docente.nombre).all()
    
    return [
        {
            "id": d.id,
            "nombre_completo": f"{d.apellidos} {d.nombre}",
            "categoria": d.categoria.nombre if d.categoria else "Sin categoría",
            "siglas_categoria": d.categoria.siglas if d.categoria else "",
            "es_prioritario": d.estatus.es_prioritario if d.estatus else False
        }
        for d in docentes
    ]

def obtener_catalogos_base(db: Session):
    """Devuelve los catálogos necesarios para los selectores del frontend."""
    planes = db.query(PlanEstudios).filter(PlanEstudios.vigente == True).all()
    actividades = db.query(OtraActividad).all()
    categorias = db.query(CategoriaDocente).all()
    
    return {
        "planes_estudio": [{"id": p.id, "nombre": p.nombre} for p in planes],
        "actividades": [{"id": a.id, "nombre": a.nombre, "hsm": a.hsm} for a in actividades],
        "categorias_docentes": [{"id": c.id, "nombre": c.nombre, "siglas": c.siglas} for c in categorias]
    }
