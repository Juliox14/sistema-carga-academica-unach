from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from src.infrastructure.database.database import get_db

from src.infrastructure.api.schemas.asignaciones_schema import (
    VincularMateriaRequest, AsignarDescargaRequest, AsignarActividadRequest
)

from src.application.use_cases import asignaciones

router = APIRouter(prefix="/api/asignaciones", tags=["Asignaciones Académicas"])

# 1. CATÁLOGOS Y BÚSQUEDAS

@router.get("/catalogos-base")
def obtener_catalogos_base(db: Session = Depends(get_db)):
    """Obtiene los planes de estudio, categorías y actividades para los selects del frontend."""
    return asignaciones.obtener_catalogos_base(db)

@router.get("/docentes")
def buscar_docentes(
    categoria_id: Optional[int] = Query(None, description="Filtrar por ID de categoría"),
    query: Optional[str] = Query(None, description="Buscar por nombre o apellidos"),
    db: Session = Depends(get_db)
):
    """Buscador de docentes en tiempo real para el combobox superior."""
    return asignaciones.buscar_docentes(db, categoria_id=categoria_id, query=query)

# 2. TABLERO Y MATERIAS DISPONIBLES

@router.get("/tablero/{docente_id}")
def obtener_tablero(docente_id: int, db: Session = Depends(get_db)):
    """Obtiene toda la información, métricas y tablas de un docente específico."""
    return asignaciones.obtener_tablero_docente(db, docente_id)

@router.get("/disponibles")
def obtener_materias_disponibles(
    plan_id: int = Query(..., description="ID del plan de estudios seleccionado"),
    docente_id: Optional[int] = Query(None, description="ID del docente actual (opcional)"),
    db: Session = Depends(get_db)
):
    return asignaciones.obtener_materias_disponibles(db, plan_id, docente_id)

# 3. ACCIONES DE CARGA ACADÉMICA (DRAG & DROP)

@router.post("/vincular")
def vincular_materia(datos: VincularMateriaRequest, db: Session = Depends(get_db)):
    """Asigna una materia a un docente (como titular o como suplente)."""
    return asignaciones.vincular_materia_a_docente(db, datos)

@router.delete("/desvincular/{asignacion_id}")
def desvincular_materia(asignacion_id: int, db: Session = Depends(get_db)):
    """Remueve a un docente de una materia (la X roja en la tabla)."""
    return asignaciones.desvincular_materia(db, asignacion_id)

# 4. DESCARGAS

@router.post("/descargar")
def asignar_descarga(datos: AsignarDescargaRequest, db: Session = Depends(get_db)):
    """Pasa una materia de 'Carga Asignada' a 'Descargas'."""
    return asignaciones.asignar_descarga(db, datos)

@router.delete("/remover-descarga/{asignacion_id}")
def remover_descarga(asignacion_id: int, db: Session = Depends(get_db)):
    """Quita el motivo de descarga y la devuelve a la carga normal del titular."""
    return asignaciones.remover_descarga(db, asignacion_id)

# 5. OTRAS ACTIVIDADES

@router.post("/actividades")
def asignar_actividad(datos: AsignarActividadRequest, db: Session = Depends(get_db)):
    """Asigna una 'Otra Actividad' (Tutorías, Tesis, etc.) al docente."""
    return asignaciones.asignar_otra_actividad(db, datos)

@router.delete("/actividades/{asignacion_actividad_id}")
def eliminar_actividad(asignacion_actividad_id: int, db: Session = Depends(get_db)):
    """Remueve una 'Otra Actividad' del tablero del docente."""
    return asignaciones.eliminar_asignacion_otra_actividad(db, asignacion_actividad_id)


# 6. SUGERENCIAS DE MATERIAS
@router.get("/sugerencias")
def obtener_materias_sugeridas(
    plan_id: int = Query(..., description="ID del plan de estudios seleccionado"),
    docente_id: int = Query(..., description="ID del docente actual"),
    db: Session = Depends(get_db),
):
    return asignaciones.obtener_materias_sugeridas(db, docente_id, plan_id, n_sugerencias=5)
