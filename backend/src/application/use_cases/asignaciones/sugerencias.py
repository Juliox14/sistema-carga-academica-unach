import heapq
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from .disponibilidad import obtener_materias_disponibles
from src.infrastructure.database.orm_models import Docente, AreaConocimiento, CategoriaDocente, AsignacionCarga, Materia
from src.infrastructure.config.settings_service import ConfiguracionService
from .historial import obtener_mapa_historial_docente, obtener_maximos_historicos_batch
from ..ciclos_service import obtener_ciclo_activo

def obtener_puntos_prioridad(categoria, peso: float = 15) -> float:
    if categoria:
        return peso / categoria.nivel_prioridad
    return 0.0

def obtener_puntos_balance_carga(hsm_base: float, horas_disponibles: float) -> float:
    if hsm_base == 0: return 0
    porcentaje_libre = horas_disponibles / hsm_base
    return max(0, porcentaje_libre * 10)
    
    

def obtener_materias_sugeridas(session: Session, docente_id: int, plan_id: int, n_sugerencias: int = 5) -> List[dict]:
    materias_disponibles = obtener_materias_disponibles(session, plan_id, docente_id)
    docente = session.query(Docente).filter(Docente.id == docente_id).first()
    historial_counts = obtener_mapa_historial_docente(session, docente_id)
    maximos_historicos = obtener_maximos_historicos_batch(session)
    areas_query = session.query(AreaConocimiento.id).filter(AreaConocimiento.docentes.any(id=docente_id)).all()
    areas_docente_ids = {area[0] for area in areas_query}
    pesos: dict = ConfiguracionService.obtener("PESOS_SUGERENCIAS", {"historial": 35, "area": 25, "turno": 15, "prioridad": 15, "carga": 10}) #type: ignore
    
    categoria = session.query(CategoriaDocente).filter(CategoriaDocente.id == docente.categoria_id).first() if docente else None
    
    if not docente:
        return []
    
    hsm_base = docente.hsm_personalizadas if docente.hsm_personalizadas is not None else (categoria.hsm_base if categoria else 0)

    # Sumamos las horas que YA tiene asignadas en el ciclo activo
    ciclo = obtener_ciclo_activo(session)
    horas_ocupadas = session.query(func.sum(Materia.hsm)).join(
        AsignacionCarga, AsignacionCarga.materia_id == Materia.id
    ).filter(
        AsignacionCarga.ciclo_escolar_id == ciclo.id,
        AsignacionCarga.docente_titular_id == docente_id,
        AsignacionCarga.estado_asignacion == "Asignada" # O tu enum correspondiente
    ).scalar() or 0

    # Calculamos las horas disponibles
    horas_disponibles = max(0, hsm_base - horas_ocupadas)
    
    puntos_prioridad = obtener_puntos_prioridad(categoria)
    puntos_carga = obtener_puntos_balance_carga(hsm_base, horas_disponibles)
    score_fijo = float(puntos_prioridad) + float(puntos_carga)

    sugerencias_heap = []
    
    d_turno = docente.turno.value if docente and docente.turno else "Mixto"
    
    for materia in materias_disponibles:
        m_turno = materia.get("turno", "Mixto")
        m_id = materia["materia_id"]

        # Descarte de materias según compatibilidad de turno
        if (d_turno != "Mixto" and m_turno != "Mixto" and d_turno != m_turno):
            continue
        
        score_total = score_fijo
        desglose = {
            "historial": 0, "area": 0, "turno": 0, 
            "prioridad": round(puntos_prioridad, 1), 
            "carga": round(puntos_carga, 1)
        }


        # Historial de Materias (Máx 35 pts)
        veces_impartida = historial_counts.get(m_id, 0)
        if veces_impartida > 0:
            record_materia = max(1, maximos_historicos.get(m_id, 1))
            
            pts_historial = (veces_impartida / record_materia) * pesos.get("historial", 35)
            
            pts_historial = min(35.0, pts_historial)
            
            score_total += pts_historial
            desglose["historial"] = round(pts_historial, 1)

        
        # Área de Conocimiento (Máx 25 pts)
        if materia.get('area_conocimiento_id') in areas_docente_ids:
            score_total += pesos.get("area", 25)
            desglose["area"] = pesos.get("area", 25)

        # Compatibilidad de Turno (Máx 15 pts)
        if d_turno == m_turno:
            score_total += pesos.get("turno", 15)
            desglose["turno"] = pesos.get("turno", 15)
        elif d_turno == "Mixto" or m_turno == "Mixto":
            score_total += pesos.get("turno", 15) / 1.5
            desglose["turno"] = round(pesos.get("turno", 15) / 1.5, 1)

        # Añadimos al Heap (Multiplicamos score_total por -1 para simular un Max-Heap)
        materia_puntuada = (
            -score_total,
            -veces_impartida, # Desempate 1
            materia['hsm'],   # Desempate 2
            m_id,
            {
                **materia,
                "score_total": round(score_total, 1),
                "desglose": desglose,
                "veces_impartida": veces_impartida
            }
        )
        sugerencias_heap.append(materia_puntuada)

    # Convertimos en Heap y extraemos las mejores 'n_sugerencias'
    heapq.heapify(sugerencias_heap)
    mejores_resultados = []
    for _ in range(min(n_sugerencias, len(sugerencias_heap))):
        item = heapq.heappop(sugerencias_heap)
        mejores_resultados.append(item[4])

    return mejores_resultados