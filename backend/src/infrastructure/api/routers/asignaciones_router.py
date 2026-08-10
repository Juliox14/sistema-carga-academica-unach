from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from src.infrastructure.database.database import get_db

from src.infrastructure.api.schemas.asignaciones_schema import (
    VincularMateriaRequest, AsignarDescargaRequest, AsignarActividadRequest, ResumenCargaResponse, VacanteDTO
)

from src.application.use_cases import asignaciones
from src.infrastructure.security import require_roles, get_current_user
from src.infrastructure.database.orm_models import Usuario

router = APIRouter(prefix="/api/asignaciones", tags=["Asignaciones Académicas"])

def _unidad_filtro(current_user: Usuario) -> int | None:
    if current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        return None
    return current_user.unidad_academica_id

# 1. CATÁLOGOS Y BÚSQUEDAS

@router.get("/catalogos-base")
def obtener_catalogos_base(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene los planes de estudio, categorías y actividades para los selects del frontend."""
    return asignaciones.obtener_catalogos_base(db, unidad_id=_unidad_filtro(current_user))

@router.get("/docentes")
def buscar_docentes(
    categoria_id: Optional[int] = Query(None, description="Filtrar por ID de categoría"),
    query: Optional[str] = Query(None, description="Buscar por nombre o apellidos"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Buscador de docentes en tiempo real para el combobox superior."""
    return asignaciones.buscar_docentes(db, categoria_id=categoria_id, query=query, unidad_id=_unidad_filtro(current_user))

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

@router.post("/vincular", dependencies=[Depends(require_roles(["SECRETARIA_ACADEMICA"]))])
def vincular_materia(datos: VincularMateriaRequest, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Asigna una materia a un docente (como titular o como suplente)."""
    return asignaciones.vincular_materia_a_docente(db, datos, current_user.unidad_academica_id)

@router.delete("/desvincular/{asignacion_id}", dependencies=[Depends(require_roles(["SECRETARIA_ACADEMICA"]))])
def desvincular_materia(asignacion_id: int, db: Session = Depends(get_db)):
    """Remueve a un docente de una materia (la X roja en la tabla)."""
    return asignaciones.desvincular_materia(db, asignacion_id)

# 4. DESCARGAS

@router.post("/descargar", dependencies=[Depends(require_roles(["SECRETARIA_ACADEMICA"]))])
def asignar_descarga(
    datos: AsignarDescargaRequest, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Pasa una materia de 'Carga Asignada' a 'Descargas'."""
    return asignaciones.asignar_descarga(db, datos, current_user.unidad_academica_id)

@router.delete("/remover-descarga/{asignacion_id}", dependencies=[Depends(require_roles(["SECRETARIA_ACADEMICA"]))])
def remover_descarga(asignacion_id: int, db: Session = Depends(get_db)):
    """Quita el motivo de descarga y la devuelve a la carga normal del titular."""
    return asignaciones.remover_descarga(db, asignacion_id)

# 5. OTRAS ACTIVIDADES

@router.post("/actividades", dependencies=[Depends(require_roles(["SECRETARIA_ACADEMICA"]))])
def asignar_actividad(datos: AsignarActividadRequest, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Asigna una 'Otra Actividad' (Tutorías, Tesis, etc.) al docente."""
    return asignaciones.asignar_otra_actividad(db, datos, current_user.unidad_academica_id)

@router.delete("/actividades/{asignacion_actividad_id}", dependencies=[Depends(require_roles(["SECRETARIA_ACADEMICA"]))])
def eliminar_actividad(asignacion_actividad_id: int, db: Session = Depends(get_db)):
    """Remueve una 'Otra Actividad' del tablero del docente."""
    return asignaciones.eliminar_asignacion_otra_actividad(db, asignacion_actividad_id)


# 6. SUGERENCIAS DE MATERIAS
@router.get("/sugerencias")
def obtener_materias_sugeridas(
    plan_id: int = Query(..., description="ID del plan de estudios seleccionado"),
    docente_id: int = Query(..., description="ID del docente actual"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return asignaciones.obtener_materias_sugeridas(db, docente_id, plan_id, current_user.unidad_academica_id, n_sugerencias=5)


# 7. RESUMEN GLOBAL DE CARGA ACADÉMICA
@router.get("/resumen-carga", response_model=ResumenCargaResponse)
def obtener_resumen_carga(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene el resumen global de cobertura y docentes con cargas incompletas/alertas."""
    return asignaciones.obtener_resumen_carga_docentes(db, unidad_id=_unidad_filtro(current_user))


# 8. VACANTES DISPONIBLES DE LA CARGA ACADÉMICA
@router.get("/vacantes", response_model=List[VacanteDTO])
def obtener_vacantes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene la lista de vacantes disponibles generadas tras finalizar la carga académica."""
    return asignaciones.obtener_vacantes_ciclo_activo(db, unidad_id=_unidad_filtro(current_user))

# 9. REPORTE OFICIAL DE CARGA ACADÉMICA
from fastapi.responses import HTMLResponse

@router.get("/reporte-carga/{docente_id}", response_class=HTMLResponse)
def obtener_reporte_carga_docente(docente_id: int, db: Session = Depends(get_db)):
    """Genera el reporte de carga académica oficial e institucional en formato HTML para imprimir."""
    return asignaciones.generar_reporte_carga_html(db, docente_id)


@router.get("/reporte-pad", response_class=HTMLResponse)
def obtener_reporte_pad_masivo(
    categorias: str = "ALL",
    formulo_nombre: str = "MTRA. PAOLA LOPEZ Y LOPEZ",
    formulo_puesto: str = "SECRETARIA ACADEMICA",
    vobo_nombre: str = "DRA. MARIA DE LOS ANGELES POLANCO ENCISO",
    vobo_puesto: str = "ENCARGADA DE LA DIRECCION",
    aprog_nombre: str = "DR. MANUEL GUSTAVO OCAMPO MUÑOA",
    aprog_puesto: str = "DIRECTOR GENERAL",
    apres_nombre: str = "DRA. MARIA CONCEPCION RUIZ RUIZ",
    apres_puesto: str = "DIR. DE PROGRAMACION Y PRESUPUESTO",
    apago_nombre: str = "MTRO. ROMEO ALEXANDER SALAZAR MALDONADO",
    apago_puesto: str = "DIR. DE PERSONAL Y PREST. SOCIALES",
    db: Session = Depends(get_db)
):
    """Genera el reporte PAD (Planeación Académica Docente) masivo o filtrado por categorías con firmas."""
    return asignaciones.generar_reporte_pad_html(
        db,
        categorias=categorias,
        formulo_nombre=formulo_nombre,
        formulo_puesto=formulo_puesto,
        vobo_nombre=vobo_nombre,
        vobo_puesto=vobo_puesto,
        aprog_nombre=aprog_nombre,
        aprog_puesto=aprog_puesto,
        apres_nombre=apres_nombre,
        apres_puesto=apres_puesto,
        apago_nombre=apago_nombre,
        apago_puesto=apago_puesto
    )

