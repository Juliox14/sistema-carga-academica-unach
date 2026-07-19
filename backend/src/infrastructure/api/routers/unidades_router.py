from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.infrastructure.database.database import get_db
from src.application.use_cases import unidades_service
from src.infrastructure.security import require_roles, get_current_user
from src.infrastructure.database.orm_models import Usuario

router = APIRouter(prefix="/api/unidades-academicas", tags=["Unidades Academicas"])

ADMIN_ROLES = ["SUPER_ADMIN"]
ALL_ROLES = ["SUPER_ADMIN", "SECRETARIA_ACADEMICA", "CAPTURISTA"]


# ---- Schemas inline ----
class UnidadCreate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=200)
    clave: str = Field(..., min_length=2, max_length=20)
    campus: int = Field(default=1, ge=1)
    ciudad: Optional[str] = Field(None, max_length=100)
    direccion: Optional[str] = Field(None, max_length=300)

class UnidadUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=200)
    clave: Optional[str] = Field(None, min_length=2, max_length=20)
    campus: Optional[int] = Field(None, ge=1)
    ciudad: Optional[str] = Field(None, max_length=100)
    direccion: Optional[str] = Field(None, max_length=300)

class UnidadResponse(BaseModel):
    id: int
    nombre: str
    clave: str
    campus: int
    ciudad: Optional[str] = None
    direccion: Optional[str] = None

    class Config:
        from_attributes = True

class VincularDocenteRequest(BaseModel):
    docente_id: int
    es_unidad_principal: bool = False
    horas_obligatorias: float = 0

class DocenteVinculoResponse(BaseModel):
    id: int
    docente_id: int
    unidad_academica_id: int
    es_unidad_principal: bool
    horas_obligatorias: float | None = None

    class Config:
        from_attributes = True


# ---- Endpoints ----

@router.get("/", response_model=List[UnidadResponse])
def listar_unidades(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista todas las unidades academicas. SUPER_ADMIN ve todas, los demas solo la suya."""
    if current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        return unidades_service.obtener_unidades(db)
    # Usuarios no admin: solo pueden ver su propia unidad
    if current_user.unidad_academica_id:
        unidad = unidades_service.obtener_unidad_por_id(db, current_user.unidad_academica_id)
        return [unidad]
    return []


@router.post("/", response_model=UnidadResponse, dependencies=[Depends(require_roles(ADMIN_ROLES))])
def crear_unidad(datos: UnidadCreate, db: Session = Depends(get_db)):
    """Crea una nueva unidad academica (solo SUPER_ADMIN)."""
    try:
        return unidades_service.crear_unidad(db, datos.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{unidad_id}", response_model=UnidadResponse)
def obtener_unidad(
    unidad_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene una unidad academica por ID."""
    # No-admins solo pueden ver su propia unidad
    if current_user.rol and current_user.rol.clave != "SUPER_ADMIN":
        if current_user.unidad_academica_id != unidad_id:
            raise HTTPException(status_code=403, detail="Acceso denegado.")
    return unidades_service.obtener_unidad_por_id(db, unidad_id)


@router.patch("/{unidad_id}", response_model=UnidadResponse, dependencies=[Depends(require_roles(ADMIN_ROLES))])
def actualizar_unidad(unidad_id: int, datos: UnidadUpdate, db: Session = Depends(get_db)):
    """Actualiza una unidad academica (solo SUPER_ADMIN)."""
    try:
        return unidades_service.actualizar_unidad(db, unidad_id, datos.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{unidad_id}", dependencies=[Depends(require_roles(ADMIN_ROLES))])
def eliminar_unidad(unidad_id: int, db: Session = Depends(get_db)):
    """Elimina una unidad academica (solo SUPER_ADMIN)."""
    try:
        unidades_service.eliminar_unidad(db, unidad_id)
        return {"detail": "Unidad academica eliminada exitosamente."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---- Gestion de docentes en la unidad ----

@router.get("/{unidad_id}/docentes", response_model=List[DocenteVinculoResponse], dependencies=[Depends(require_roles(ADMIN_ROLES))])
def listar_docentes_de_unidad(unidad_id: int, db: Session = Depends(get_db)):
    """Lista los docentes vinculados a una unidad academica."""
    return unidades_service.obtener_docentes_de_unidad(db, unidad_id)


@router.post("/{unidad_id}/docentes", response_model=DocenteVinculoResponse, dependencies=[Depends(require_roles(ADMIN_ROLES))])
def vincular_docente(unidad_id: int, body: VincularDocenteRequest, db: Session = Depends(get_db)):
    """Vincula un docente a una unidad academica."""
    try:
        return unidades_service.vincular_docente_a_unidad(db, unidad_id, body.docente_id, body.es_unidad_principal, body.horas_obligatorias)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{unidad_id}/docentes/{docente_id}", response_model=DocenteVinculoResponse, dependencies=[Depends(require_roles(ADMIN_ROLES))])
def actualizar_vinculo(unidad_id: int, docente_id: int, body: VincularDocenteRequest, db: Session = Depends(get_db)):
    """Actualiza el vinculo de un docente con la unidad."""
    try:
        return unidades_service.actualizar_vinculo_docente(db, unidad_id, docente_id, body.es_unidad_principal, body.horas_obligatorias)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{unidad_id}/docentes/{docente_id}", dependencies=[Depends(require_roles(ADMIN_ROLES))])
def desvincular_docente(unidad_id: int, docente_id: int, db: Session = Depends(get_db)):
    """Desvincula un docente de una unidad academica."""
    try:
        unidades_service.desvincular_docente_de_unidad(db, unidad_id, docente_id)
        return {"detail": "Docente desvinculado exitosamente."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
