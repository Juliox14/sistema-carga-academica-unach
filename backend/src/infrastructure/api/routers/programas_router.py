from io import BytesIO
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.application.use_cases import programas_service
from src.infrastructure.api.schemas.programas_schema import (
    ProgramaEducativoCreate,
    ProgramaEducativoResponse,
    ProgramaEducativoUpdate,
)
from ...database.database import get_db

router = APIRouter(prefix="/api/programas", tags=["Programas Educativos"])


@router.post("/", response_model=ProgramaEducativoResponse)
def crear_programa(programa: ProgramaEducativoCreate, db: Session = Depends(get_db)):
    try:
        nuevo_programa = programas_service.crear_nuevo_programa(db, programa)
        return nuevo_programa
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[ProgramaEducativoResponse])
def listar_programas(db: Session = Depends(get_db)):
    programas = programas_service.obtener_todos_los_programas(db)
    return programas


@router.post("/import")
async def importar_programas(file: UploadFile, db: Session = Depends(get_db)):
    try:
        plan_importado = await file.read()
        byte_object = BytesIO(plan_importado)
        objects = await programas_service.importar_programas(db, byte_object)
        return objects
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def exportar_programas(db: Session = Depends(get_db)):
    try:
        programas = programas_service.obtener_todos_los_programas(db)
        buffer = await programas_service.exportar_programas(programas)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=programas_educativos.xlsx"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{programa_id}", response_model=ProgramaEducativoResponse)
def obtener_programa(programa_id: int, db: Session = Depends(get_db)):
    try:
        programa = programas_service.obtener_programa_por_id(db, programa_id)
        return programa
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{programa_id}", response_model=ProgramaEducativoResponse)
def actualizar_programa(programa_id: int, programa: ProgramaEducativoUpdate, db: Session = Depends(get_db)):
    try:
        programa_actualizado = programas_service.actualizar_programa(db, programa_id, programa)
        return programa_actualizado
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


from sqlalchemy.exc import IntegrityError

@router.delete("/{programa_id}")
def eliminar_programa(programa_id: int, db: Session = Depends(get_db)):
    try:
        programas_service.eliminar_programa(db, programa_id)
        return {"detail": "Programa educativo eliminado exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el programa educativo porque tiene planes de estudio vigentes asociados."
        )