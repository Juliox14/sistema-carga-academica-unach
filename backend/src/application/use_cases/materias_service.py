from sqlalchemy.orm import Session

from src.infrastructure.database.orm_models import Materia
from src.infrastructure.api.schemas.materias_schema import MateriaCreate, MateriaUpdate


def crear_nueva_materia(db: Session, materia_data: MateriaCreate):
    try:
        nueva_materia = Materia(**materia_data.model_dump())
    except Exception as e:
        raise ValueError(f"Error al crear la materia: {str(e)}")
    db.add(nueva_materia)
    db.commit()
    db.refresh(nueva_materia)
    return nueva_materia

def obtener_todas_las_materias(db: Session):
    return db.query(Materia).all()

def obtener_materia_por_id(db: Session, materia_id: int):
    return db.query(Materia).filter(Materia.id == materia_id).first()

def actualizar_materia(db: Session, materia_id: int, materia_data: MateriaUpdate):
    materia = db.query(Materia).filter(Materia.id == materia_id).first()
    if not materia:
        raise ValueError("Materia no encontrada")
    
    materia_data_dict = materia_data.model_dump(exclude_unset=True)
    
    for key, value in materia_data_dict.items():
        setattr(materia, key, value)
    
    db.commit()
    db.refresh(materia)
    
    return materia

def eliminar_materia(db: Session, materia_id: int):
    materia = db.query(Materia).filter(Materia.id == materia_id).first()
    if not materia:
        raise ValueError("Materia no encontrada")
    
    db.delete(materia)
    db.commit()
    return True