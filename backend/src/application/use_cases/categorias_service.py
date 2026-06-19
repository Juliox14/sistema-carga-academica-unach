from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import CategoriaDocente
from src.infrastructure.api.schemas.categorias_schema import CategoriaDocenteCreate, CategoriaDocenteUpdate

def crear_categoria(db: Session, categoria_data: CategoriaDocenteCreate):
    datos = categoria_data.model_dump()
    datos["siglas"] = datos["siglas"].upper() # Forzamos siglas en mayúscula
    
    nueva_categoria = CategoriaDocente(**datos)
    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)
    
    return nueva_categoria

def obtener_categorias(db: Session):
    # Aquí es útil ordenar por nivel de prioridad para que en el frontend 
    # salgan ordenados jerárquicamente en los selects
    return db.query(CategoriaDocente).order_by(CategoriaDocente.nivel_prioridad.asc()).all()

def obtener_categoria_por_id(db: Session, categoria_id: int):
    return db.query(CategoriaDocente).filter(CategoriaDocente.id == categoria_id).first()

def eliminar_categoria(db: Session, categoria_id: int):
    categoria = db.query(CategoriaDocente).filter(CategoriaDocente.id == categoria_id).first()
    if not categoria:
        raise ValueError("Categoría docente no encontrada")
    
    db.delete(categoria)
    db.commit()
    return True

def actualizar_categoria(db: Session, categoria_id: int, categoria_data: CategoriaDocenteUpdate):
    categoria = db.query(CategoriaDocente).filter(CategoriaDocente.id == categoria_id).first()
    if not categoria:
        raise ValueError("Categoría docente no encontrada")
    
    datos_actualizar = categoria_data.model_dump(exclude_unset=True)
    
    if "siglas" in datos_actualizar:
        datos_actualizar["siglas"] = datos_actualizar["siglas"].upper() # Forzamos siglas en mayúscula
    
    for clave, valor in datos_actualizar.items():
        setattr(categoria, clave, valor)
        
    db.commit()
    db.refresh(categoria)
    return categoria