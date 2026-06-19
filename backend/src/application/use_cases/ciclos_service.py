from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import CicloEscolar
from src.infrastructure.api.schemas.ciclos_schema import CicloEscolarCreate, CicloEscolarUpdate

def crear_ciclo(db: Session, ciclo_data: CicloEscolarCreate):
    db.query(CicloEscolar).filter_by(activo=True).update({"activo": False})
    
    nuevo_ciclo = CicloEscolar(**ciclo_data.model_dump())
    
    db.add(nuevo_ciclo)
    db.commit()
    db.refresh(nuevo_ciclo)
    return nuevo_ciclo

def obtener_ciclos(db: Session):
    return db.query(CicloEscolar).all()

def obtener_ciclo_por_id(db: Session, ciclo_id: int):
    return db.query(CicloEscolar).filter(CicloEscolar.id == ciclo_id).first()

def actualizar_ciclo(db: Session, ciclo_id: int, ciclo_data: CicloEscolarUpdate):
    ciclo = db.query(CicloEscolar).filter(CicloEscolar.id == ciclo_id).first()
    if not ciclo:
        raise ValueError("Ciclo escolar no encontrado")
    
    ciclo_data_dict = ciclo_data.model_dump(exclude_unset=True)
    
    for key, value in ciclo_data_dict.items():
        setattr(ciclo, key, value)
    
    db.commit()
    db.refresh(ciclo)
    
    return ciclo

def eliminar_ciclo(db: Session, ciclo_id: int):
    ciclo = db.query(CicloEscolar).filter(CicloEscolar.id == ciclo_id).first()
    if not ciclo:
        raise ValueError("Ciclo escolar no encontrado")
    
    db.delete(ciclo)
    db.commit()
    return True