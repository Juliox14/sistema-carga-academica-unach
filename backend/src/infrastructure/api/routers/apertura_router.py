from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.apertura_schema import SugerenciaAperturaResponse, EjecutarAperturaRequest, GrupoAbiertoResponse
from src.application.use_cases import apertura_service
from src.infrastructure.security import get_current_user, require_roles
from src.infrastructure.database.orm_models import Usuario

router = APIRouter(prefix="/api/aperturas", tags=["Apertura de Ciclos"])

@router.get("/sugerencias/{plan_id}", response_model=SugerenciaAperturaResponse)
def obtener_sugerencias(plan_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return apertura_service.obtener_sugerencias_apertura(db, plan_id, current_user.unidad_academica_id)

@router.post("/ejecutar", dependencies=[Depends(require_roles(["SECRETARIA_ACADEMICA"]))])
def ejecutar_apertura(datos: EjecutarAperturaRequest, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    exito = apertura_service.ejecutar_apertura_ciclo(db, datos, current_user.unidad_academica_id)
    if not exito:
        raise HTTPException(
            status_code=400, 
            detail="No se pudo realizar la apertura. Asegúrese de tener un ciclo escolar activo."
        )
    return {"mensaje": "Apertura de ciclo generada exitosamente en la base de datos."}

@router.get("/abiertos", response_model=List[GrupoAbiertoResponse])
def listar_grupos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return apertura_service.listar_grupos_abiertos(db, current_user.unidad_academica_id)

@router.delete("/grupos-abiertos/{grupo_id}", dependencies=[Depends(require_roles(["SECRETARIA_ACADEMICA"]))])
def eliminar_grupo_abierto(grupo_id: int, db: Session = Depends(get_db)):
    """Elimina un grupo abierto y todas sus asignaciones y horarios asociados en cascada."""
    try:
        apertura_service.eliminar_grupo_abierto(db, grupo_id)
        return {"mensaje": "Grupo abierto eliminado exitosamente."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")