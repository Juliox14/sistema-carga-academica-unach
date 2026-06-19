from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import Docente, AreaConocimiento
from src.infrastructure.api.schemas.docentes_schema import DocenteCreate, DocenteUpdate

def crear_docente(db: Session, docente_data: DocenteCreate):
    # 1. Separamos los IDs de las áreas del resto de los datos
    datos_dict = docente_data.model_dump(exclude={"areas_conocimiento_ids"})
    areas_ids = docente_data.areas_conocimiento_ids
    
    # 2. Creamos la instancia del docente
    nuevo_docente = Docente(**datos_dict)
    
    # 3. Si mandaron áreas de conocimiento, las buscamos y las vinculamos
    if areas_ids:
        # Hacemos un SELECT de las áreas cuyos IDs estén en la lista
        areas = db.query(AreaConocimiento).filter(AreaConocimiento.id.in_(areas_ids)).all()
        nuevo_docente.areas_conocimiento = areas
        
    # 4. Guardamos todo (SQLAlchemy inserta en docentes y en la tabla intermedia automáticamente)
    db.add(nuevo_docente)
    db.commit()
    db.refresh(nuevo_docente)
    
    return nuevo_docente

def obtener_docentes(db: Session):
    return db.query(Docente).all()

def obtener_docente_por_id(db: Session, docente_id: int):
    return db.query(Docente).filter(Docente.id == docente_id).first()

def actualizar_docente(db: Session, docente_id: int, docente_data: DocenteUpdate):
    db_docente = db.query(Docente).filter(Docente.id == docente_id).first()
    if not db_docente:
        return None
        
    datos_actualizar = docente_data.model_dump(exclude_unset=True)
    
    if "areas_conocimiento_ids" in datos_actualizar:
        nuevos_ids = datos_actualizar.pop("areas_conocimiento_ids")
        nuevas_areas = db.query(AreaConocimiento).filter(AreaConocimiento.id.in_(nuevos_ids)).all()
        db_docente.areas_conocimiento = nuevas_areas
        
    for clave, valor in datos_actualizar.items():
        setattr(db_docente, clave, valor)
        
    db.commit()
    db.refresh(db_docente)
    return db_docente

def eliminar_docente(db: Session, docente_id: int):
    db_docente = db.query(Docente).filter(Docente.id == docente_id).first()
    if not db_docente:
        return False
    
    db.delete(db_docente)
    db.commit()
    return True