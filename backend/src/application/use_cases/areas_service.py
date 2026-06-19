from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import AreaConocimiento
from src.infrastructure.api.schemas.areas_schema import AreaConocimientoCreate, AreaConocimientoUpdate

def crear_area(db: Session, area_data: AreaConocimientoCreate):
    nueva_area = AreaConocimiento(**area_data.model_dump())
    
    db.add(nueva_area)
    db.commit()
    db.refresh(nueva_area)
    
    return nueva_area

def obtener_areas(db: Session):
    return db.query(AreaConocimiento).all()

def obtener_area_por_id(db: Session, area_id: int):
    return db.query(AreaConocimiento).filter(AreaConocimiento.id == area_id).first()

def actualizar_area(db: Session, area_id: int, area_data: AreaConocimientoUpdate):
    area = db.query(AreaConocimiento).filter(AreaConocimiento.id == area_id).first()
    if not area:
        raise ValueError("Área de conocimiento no encontrada")
    
    area_data_dict = area_data.model_dump(exclude_unset=True)
    
    for key, value in area_data_dict.items():
        setattr(area, key, value)
    
    db.commit()
    db.refresh(area)
    
    return area

def eliminar_area(db: Session, area_id: int):
    area = db.query(AreaConocimiento).filter(AreaConocimiento.id == area_id).first()
    if not area:
        raise ValueError("Área de conocimiento no encontrada")
    
    db.delete(area)
    db.commit()
    return True
    