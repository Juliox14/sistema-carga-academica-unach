from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from src.application.ports.output.logger_port import LoggerPort
from src.infrastructure.database.database import get_db
from src.infrastructure.security import get_current_user
from src.infrastructure.database.orm_models import Usuario
from src.infrastructure.api.schemas.docentes_schema import DocenteCreate, DocenteResponse, DocenteUpdate
from src.application.use_cases import docentes_service
from src.infrastructure.api.routers.logging_utils import get_logger, get_trace_id

router = APIRouter(prefix="/api/docentes", tags=["Gestión de Docentes"])


def _unidad_filtro(current_user: Usuario) -> int | None:
    if current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        return None
    return current_user.unidad_academica_id

@router.post("/importar", response_model=List[DocenteResponse])
async def importar_docentes(
    file: UploadFile = File(...),
    request: Request = None,  # type: ignore[assignment]
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    logger: LoggerPort = Depends(get_logger),
):
    trace_id = get_trace_id(request) if request else None
    logger.info("Intentando importar docentes", context={"filename": file.filename}, trace_id=trace_id)
    if not file.filename.endswith(('.xlsx', '.xls')): #type: ignore
        logger.warning("Archivo inválido para importar docentes", context={"filename": file.filename}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx, .xls)")
    try:
        from io import BytesIO
        contents = await file.read()
        byte_object = BytesIO(contents)
        unidad_id = _unidad_filtro(current_user)
        resultado = await docentes_service.importar_docentes(db, byte_object, unidad_id=unidad_id)
        logger.info("Importación de docentes completada", context={"unidad_id": unidad_id, "cantidad": len(resultado)}, trace_id=trace_id)
        return resultado
    except Exception as e:
        logger.error("Error al importar docentes", context={"error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/", response_model=DocenteResponse)
def crear_docente(
    docente: DocenteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    logger: LoggerPort = Depends(get_logger),
):
    unidad_id = docente.unidad_academica_id if (docente.unidad_academica_id and current_user.rol and current_user.rol.clave == "SUPER_ADMIN") else _unidad_filtro(current_user)
    return docentes_service.crear_docente(db, docente, unidad_id=unidad_id)

@router.get("/", response_model=List[DocenteResponse])
def listar_docentes(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    logger: LoggerPort = Depends(get_logger),
):
    trace_id = get_trace_id(request)
    logger.info("Listando docentes", context={"unidad_id": _unidad_filtro(current_user)}, trace_id=trace_id)
    return docentes_service.obtener_docentes(db, unidad_id=_unidad_filtro(current_user))

@router.get("/{docente_id}", response_model=DocenteResponse)
def obtener_docente(docente_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Consultando docente", context={"docente_id": docente_id}, trace_id=trace_id)
    return docentes_service.obtener_docente_por_id(db, docente_id)

@router.put("/{docente_id}", response_model=DocenteResponse)
def actualizar_docente(docente_id: int, docente: DocenteUpdate, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando actualizar docente", context={"docente_id": docente_id}, trace_id=trace_id)
    try:
        docente_actualizado = docentes_service.actualizar_docente(db, docente_id, docente)
        logger.info("Docente actualizado", context={"docente_id": docente_id}, trace_id=trace_id)
        return docente_actualizado
    except Exception as e:
        logger.warning("Error al actualizar docente", context={"docente_id": docente_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{docente_id}")
def eliminar_docente(docente_id: int, request: Request, db: Session = Depends(get_db), logger: LoggerPort = Depends(get_logger)):
    trace_id = get_trace_id(request)
    logger.info("Intentando eliminar docente", context={"docente_id": docente_id}, trace_id=trace_id)
    try:
        docentes_service.eliminar_docente(db, docente_id)
        logger.info("Docente eliminado", context={"docente_id": docente_id}, trace_id=trace_id)
        return {"detail": "Docente eliminado exitosamente"}
    except Exception as e:
        logger.warning("Error al eliminar docente", context={"docente_id": docente_id, "error": str(e)}, trace_id=trace_id)
        raise HTTPException(status_code=400, detail=str(e))