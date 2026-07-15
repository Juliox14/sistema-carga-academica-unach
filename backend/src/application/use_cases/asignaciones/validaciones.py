from sqlalchemy.orm import Session
from fastapi import HTTPException
from .tablero import obtener_tablero_docente
from src.infrastructure.config.settings_service import ConfiguracionService
from .historial import obtener_mapa_historial_docente



def _verificar_limite_hsm(db: Session, docente_id: int, nuevas_horas: int):
    """Verifica que el docente no rebase sus horas contratadas al asignarle una nueva carga."""
    from src.infrastructure.database.orm_models import Docente
    docente_db = db.query(Docente).filter(Docente.id == docente_id).first()
    if docente_db and docente_db.estatus and not docente_db.estatus.permite_carga:
        raise HTTPException(
            status_code=400,
            detail=f"El estatus actual del docente ({docente_db.estatus.nombre}) no permite la asignación de carga académica."
        )
        
    docente = obtener_tablero_docente(db, docente_id)
    horas_actuales = docente["suma_total"] + nuevas_horas
    limite = docente["hsm_base"]
    
    permite_excedentes = ConfiguracionService.obtener("PERMITE_HORAS_EXCEDENTES", False)
    
    if docente["categoria"] == "PAE":
        return  # Los docentes PAE no tienen límite de horas
    
    if permite_excedentes:
        margen = ConfiguracionService.obtener("MAX_HORAS_EXCEDENTES", 0)
        limite += margen
    
    
    if horas_actuales > limite:
        raise HTTPException(
            status_code=400, 
            detail=f"Límite excedido. El docente puede tener máximo {limite} HSM."
        )

def _validar_ciclos_consecutivos(db: Session, docente_id: int, materia_id: int):
    limite_racha = ConfiguracionService.obtener("MAX_CICLOS_CONSECUTIVOS", 0)
    
    if limite_racha == 0:
        return 
    
    historial = obtener_mapa_historial_docente(db, docente_id)
    
    datos_materia = historial.get(materia_id)
    if datos_materia:
        if datos_materia["consecutivos"] >= limite_racha:
            raise HTTPException(
                status_code=400, 
                detail=f"Regla académica: El docente ya ha impartido esta materia por {limite_racha} periodos consecutivos."
            )