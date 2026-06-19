from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import OtraActividad
from src.infrastructure.api.schemas.actividades_schema import OtraActividadCreate, OtraActividadUpdate

def crear_actividad(db: Session, actividad_data: OtraActividadCreate):
    nueva_actividad = OtraActividad(**actividad_data.model_dump())
    
    db.add(nueva_actividad)
    db.commit()
    db.refresh(nueva_actividad)
    
    return nueva_actividad

def obtener_actividades(db: Session):
    return db.query(OtraActividad).all()

def obtener_actividad(db: Session, actividad_id: int):
    return db.query(OtraActividad).filter(OtraActividad.id == actividad_id).first()

def actualizar_actividad(db: Session, actividad_id: int, actividad_data: OtraActividadUpdate):
    actividad = db.query(OtraActividad).filter(OtraActividad.id == actividad_id).first()
    if not actividad:
        return None

    actividad_data_dict = actividad_data.model_dump(exclude_unset=True)
    
    for clave, valor in actividad_data_dict.items():
        setattr(actividad, clave, valor)
    
    db.commit()
    db.refresh(actividad)
    return actividad

def eliminar_actividad(db: Session, actividad_id: int):
    actividad = db.query(OtraActividad).filter(OtraActividad.id == actividad_id).first()
    if not actividad:
        return None
    db.delete(actividad)
    db.commit()
    return actividad