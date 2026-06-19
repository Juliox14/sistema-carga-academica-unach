from sqlalchemy.orm import Session

from src.infrastructure.database.orm_models import PlanEstudios
from src.infrastructure.api.schemas.planes_estudios_schema import PlanEstudiosCreate, PlanEstudiosUpdate

def crear_nuevo_plan_estudios(db: Session, plan_data: PlanEstudiosCreate):
    try:
        nuevo_plan = PlanEstudios(**plan_data.model_dump())
    except Exception as e:
        raise ValueError(f"Error al crear el plan de estudios: {str(e)}")
    
    db.add(nuevo_plan)
    db.commit()
    db.refresh(nuevo_plan)
    
    return nuevo_plan

def obtener_todos_los_planes_estudios(db: Session):
    return db.query(PlanEstudios).all()

def obtener_plan_estudios_por_id(db: Session, plan_id: int):
    return db.query(PlanEstudios).filter(PlanEstudios.id == plan_id).first()

def actualizar_plan_estudios(db: Session, plan_id: int, plan_data: PlanEstudiosUpdate):
    plan = db.query(PlanEstudios).filter(PlanEstudios.id == plan_id).first()
    if not plan:
        raise ValueError("Plan de estudios no encontrado")
    
    plan_data_dict = plan_data.model_dump(exclude_unset=True)
    
    for key, value in plan_data_dict.items():
        setattr(plan, key, value)
    
    db.commit()
    db.refresh(plan)
    
    return plan

def eliminar_plan_estudios(db: Session, plan_id: int):
    plan = db.query(PlanEstudios).filter(PlanEstudios.id == plan_id).first()
    if not plan:
        raise ValueError("Plan de estudios no encontrado")
    
    db.delete(plan)
    db.commit()
    return True