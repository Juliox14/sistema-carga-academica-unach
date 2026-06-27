from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import AsignacionCarga

def obtener_mapa_historial_docente(db: Session, docente_id: int) -> dict:
    """
    Devuelve un diccionario con el conteo de cuántas veces 
    ha impartido el docente cada materia.
    Ejemplo de retorno: { 102: 5, 105: 1, 201: 3 }
    """
    conteos = db.query(
        AsignacionCarga.materia_id,
        func.count(AsignacionCarga.id).label("veces")
    ).filter(
        or_(
            AsignacionCarga.docente_titular_id == docente_id,
            AsignacionCarga.docente_temporal_id == docente_id
        )
    ).group_by(AsignacionCarga.materia_id).all()
    
    return {row.materia_id: row.veces for row in conteos}

def obtener_maximos_historicos_batch(db: Session) -> dict:
    """
    Devuelve un diccionario con el récord histórico de veces que 
    CUALQUIER docente ha dado una materia.
    Retorna: { materia_id: max_veces_impartida }
    """
    # 1. Subconsulta: Agrupa por materia y docente, y cuenta las repeticiones
    # Usamos coalesce para tomar el ID del titular, y si es None, el del temporal
    docente_id_calc = func.coalesce(AsignacionCarga.docente_titular_id, AsignacionCarga.docente_temporal_id)
    
    subquery = db.query(
        AsignacionCarga.materia_id,
        docente_id_calc.label('docente_id'),
        func.count(AsignacionCarga.id).label('veces')
    ).filter(
        docente_id_calc.isnot(None)
    ).group_by(
        AsignacionCarga.materia_id,
        docente_id_calc
    ).subquery()

    # 2. Consulta Principal: Toma el valor máximo de 'veces' por cada materia
    query = db.query(
        subquery.c.materia_id,
        func.max(subquery.c.veces).label('max_veces')
    ).group_by(subquery.c.materia_id).all()

    # Retorna un HashMap O(1) para búsqueda instantánea en Python
    return {row.materia_id: row.max_veces for row in query}