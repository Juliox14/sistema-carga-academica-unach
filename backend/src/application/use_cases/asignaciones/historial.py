from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import AsignacionCarga
from src.application.use_cases.ciclos_service import obtener_ciclo_activo


from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import AsignacionCarga, CicloEscolar

def obtener_mapa_historial_docente(db: Session, docente_id: int) -> dict:
    """
    Devuelve un diccionario con el historial del docente.
    Ejemplo de retorno: 
    { 
        102: {"total": 5, "consecutivos": 2}, 
        105: {"total": 1, "consecutivos": 0} 
    }
    """
    ciclo_activo_id = obtener_ciclo_activo(db).id
    # 1. Obtenemos TODOS los ciclos de la UNACH ordenados del más nuevo al más viejo
    # Esto es vital para saber el orden cronológico real sin depender de IDs secuenciales
    ciclos_ordenados = db.query(CicloEscolar.id).order_by(
        CicloEscolar.anio.desc(), 
        CicloEscolar.mes_inicio.desc()
    ).all()
    lista_ciclos_ids = [c.id for c in ciclos_ordenados]

    # 2. Obtenemos el historial bruto del docente
    historial = db.query(
        AsignacionCarga.materia_id,
        AsignacionCarga.ciclo_escolar_id
    ).filter(
        or_(
            AsignacionCarga.docente_titular_id == docente_id,
            AsignacionCarga.docente_temporal_id == docente_id
        )
    ).all()

    # 3. Agrupamos en un Hash Map en tiempo O(N)
    mapa = {}
    for materia_id, ciclo_id in historial:
        if materia_id not in mapa:
            mapa[materia_id] = {'total': 0, 'ciclos_impartidos': set()}
        
        mapa[materia_id]['total'] += 1
        mapa[materia_id]['ciclos_impartidos'].add(ciclo_id)

    # 4. Buscamos dónde estamos parados cronológicamente
    try:
        idx_activo = lista_ciclos_ids.index(ciclo_activo_id)
    except ValueError:
        idx_activo = 0 # Fallback por seguridad

    # 5. Calculamos la racha consecutiva hacia atrás
    for m_id, data in mapa.items():
        racha = 0
        # Revisamos los ciclos anteriores al activo (idx_activo + 1, idx_activo + 2...)
        for i in range(idx_activo + 1, len(lista_ciclos_ids)):
            ciclo_pasado = lista_ciclos_ids[i]
            if ciclo_pasado in data['ciclos_impartidos']:
                racha += 1
            else:
                break # En cuanto hay un semestre donde no la dio, la racha se rompe
        
        data['consecutivos'] = racha
        del data['ciclos_impartidos'] # Limpiamos el set para no mandar basura en la respuesta

    return mapa

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