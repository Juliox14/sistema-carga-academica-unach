from sqlalchemy.orm import Session
from fastapi import HTTPException
from .tablero import obtener_tablero_docente



def _verificar_limite_hsm(db: Session, docente_id: int | None, nuevas_horas: int):
    """Verifica que el docente no rebase sus horas contratadas al asignarle una nueva carga."""
    if docente_id is None:
        return
    tablero = obtener_tablero_docente(db, docente_id)
    horas_actuales = tablero["suma_total"]
    limite = tablero["hsm_base"]
    
    if (horas_actuales + nuevas_horas) > limite:
        raise HTTPException(
            status_code=400, 
            detail=f"Límite de horas excedido. El docente tiene {horas_actuales}/{limite} HSM asignadas. No se pueden agregar {nuevas_horas} hrs extra."
        )
