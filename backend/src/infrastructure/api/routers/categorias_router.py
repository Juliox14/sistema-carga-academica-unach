from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.categorias_schema import CategoriaDocenteCreate, CategoriaDocenteResponse, CategoriaDocenteUpdate, CategoriaBulkRulesUpdate
from src.application.use_cases import categorias_service

router = APIRouter(prefix="/api/categorias", tags=["Categorías Docentes"])

@router.post("/", response_model=CategoriaDocenteResponse)
def crear(categoria: CategoriaDocenteCreate, db: Session = Depends(get_db)):
    return categorias_service.crear_categoria(db, categoria)

@router.get("/", response_model=List[CategoriaDocenteResponse])
def listar(db: Session = Depends(get_db)):
    return categorias_service.obtener_categorias(db)

@router.get("/{categoria_id}", response_model=CategoriaDocenteResponse)
def obtener(categoria_id: int, db: Session = Depends(get_db)):
    return categorias_service.obtener_categoria_por_id(db, categoria_id)

@router.put("/{categoria_id}", response_model=CategoriaDocenteResponse)
def actualizar(categoria_id: int, categoria: CategoriaDocenteUpdate, db: Session =
        Depends(get_db)):
    return categorias_service.actualizar_categoria(db, categoria_id, categoria)

@router.delete("/{categoria_id}")
def eliminar(categoria_id: int, db: Session = Depends(get_db)):
    categorias_service.eliminar_categoria(db, categoria_id)
    return {"message": "Categoría docente eliminada exitosamente"}

@router.put("/bulk-rules")
def actualizar_reglas_bulk(datos: List[CategoriaBulkRulesUpdate], db: Session = Depends(get_db)):
    return categorias_service.actualizar_reglas_bulk(db, datos)
