from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.database import get_db
from src.infrastructure.security import get_current_user
from src.infrastructure.database.orm_models import Usuario
from src.infrastructure.api.schemas.docentes_schema import DocenteCreate, DocenteResponse, DocenteUpdate
from src.application.use_cases import docentes_service

router = APIRouter(prefix="/api/docentes", tags=["Gestión de Docentes"])


def _unidad_filtro(current_user: Usuario) -> int | None:
    if current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        return None
    return current_user.unidad_academica_id

@router.post("/importar", response_model=List[DocenteResponse])
async def importar_docentes(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not file.filename.endswith(('.xlsx', '.xls')): #type: ignore
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx, .xls)")
    try:
        from io import BytesIO
        contents = await file.read()
        byte_object = BytesIO(contents)
        unidad_id = _unidad_filtro(current_user)
        return await docentes_service.importar_docentes(db, byte_object, unidad_id=unidad_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/", response_model=DocenteResponse)
def crear_docente(
    docente: DocenteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    unidad_id = docente.unidad_academica_id if (docente.unidad_academica_id and current_user.rol and current_user.rol.clave == "SUPER_ADMIN") else _unidad_filtro(current_user)
    return docentes_service.crear_docente(db, docente, unidad_id=unidad_id)

@router.get("/", response_model=List[DocenteResponse])
def listar_docentes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    return docentes_service.obtener_docentes(db, unidad_id=_unidad_filtro(current_user))

@router.get("/{docente_id}", response_model=DocenteResponse)
def obtener_docente(docente_id: int, db: Session = Depends(get_db)):
    return docentes_service.obtener_docente_por_id(db, docente_id)

@router.put("/{docente_id}", response_model=DocenteResponse)
def actualizar_docente(docente_id: int, docente: DocenteUpdate, db: Session = Depends(get_db)):
    return docentes_service.actualizar_docente(db, docente_id, docente)

@router.delete("/{docente_id}")
def eliminar_docente(docente_id: int, db: Session = Depends(get_db)):
    docentes_service.eliminar_docente(db, docente_id)
    return {"detail": "Docente eliminado exitosamente"}