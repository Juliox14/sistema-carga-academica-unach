from sqlalchemy.orm import Session

from src.infrastructure.database.orm_models import ProgramaEducativo
from src.infrastructure.api.schemas.programas_schema import ProgramaEducativoCreate, ProgramaEducativoUpdate


def crear_nuevo_programa(db: Session, programa_data: ProgramaEducativoCreate):
    if db.query(ProgramaEducativo).filter_by(clave=programa_data.clave.upper()).first():
        raise ValueError(f"Ya existe un programa educativo con la clave '{programa_data.clave.upper()}'")
    
    try:
        data_dict = programa_data.model_dump()
        data_dict['clave'] = data_dict['clave'].upper()
        nuevo_programa = ProgramaEducativo(**data_dict)
    except Exception as e:
        raise ValueError(f"Error al crear el programa educativo: {str(e)}")
    
    db.add(nuevo_programa)
    db.commit()
    db.refresh(nuevo_programa)
    
    return nuevo_programa

def obtener_todos_los_programas(db: Session):
    return db.query(ProgramaEducativo).all()

def obtener_programa_por_id(db: Session, programa_id: int):
    programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.id == programa_id).first()
    
    if not programa:
        raise ValueError(f"No se encontró un programa educativo con el ID {programa_id}")
    
    return programa

def actualizar_programa(db: Session, programa_id: int, programa_data: ProgramaEducativoUpdate):
    db_programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.id == programa_id).first()
    
    if not db_programa:
        return None
        
    datos_actualizar = programa_data.model_dump(exclude_unset=True)
    
    if "clave" in datos_actualizar:
        datos_actualizar["clave"] = datos_actualizar["clave"].upper()

    for clave, valor in datos_actualizar.items():
        setattr(db_programa, clave, valor)
        
    db.commit()
    db.refresh(db_programa)
    return db_programa

def eliminar_programa(db: Session, programa_id: int):
    db_programa = db.query(ProgramaEducativo).filter(ProgramaEducativo.id == programa_id).first()
    
    if not db_programa:
        return False
        
    db.delete(db_programa)
    db.commit()
    return True