from io import BytesIO
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.application.use_cases import materias_service
from src.infrastructure.api.schemas.materias_schema import MateriaCreate, MateriaResponse, MateriaUpdate
from ...database.database import get_db

router = APIRouter(prefix="/api/materias", tags=["Materias"])


@router.post("/", response_model=MateriaResponse)
def crear_materia(materia: MateriaCreate, db: Session = Depends(get_db)):
    try:
        nueva_materia = materias_service.crear_nueva_materia(db, materia)
        return nueva_materia
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[MateriaResponse])
def listar_materias(db: Session = Depends(get_db)):
    materias = materias_service.obtener_todas_las_materias(db)
    return materias


@router.post("/import")
async def importar_materias(file: UploadFile, db: Session = Depends(get_db)):
    try:
        plan_importado = await file.read()
        byte_object = BytesIO(plan_importado)
        objects = await materias_service.importar_materias(db, byte_object)
        return objects
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def exportar_materias(db: Session = Depends(get_db)):
    try:
        materias = materias_service.obtener_todas_las_materias(db)
        buffer = await materias_service.exportar_materias(materias)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=materias.xlsx"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{materia_id}", response_model=MateriaResponse)
def obtener_materia(materia_id: int, db: Session = Depends(get_db)):
    try:
        materia = materias_service.obtener_materia_por_id(db, materia_id)
        return materia
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{materia_id}", response_model=MateriaResponse)
def actualizar_materia(materia_id: int, materia: MateriaUpdate, db: Session = Depends(get_db)):
    try:
        materia_actualizada = materias_service.actualizar_materia(db, materia_id, materia)
        return materia_actualizada
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{materia_id}")
def eliminar_materia(materia_id: int, db: Session = Depends(get_db)):
    try:
        materias_service.eliminar_materia(db, materia_id)
        return {"detail": "Materia eliminada exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
