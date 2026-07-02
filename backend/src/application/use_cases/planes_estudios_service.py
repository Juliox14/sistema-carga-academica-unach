from sqlalchemy.orm import Session

import openpyxl as xl
from io import BytesIO
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

async def importar_plan_estudios(db: Session, byte_object: BytesIO):
    try:
        wb = xl.load_workbook(byte_object)
        sheet = wb["plan_estudios"]
        objects = []
        headers = [cell.value for cell in sheet[1]]

        for row in sheet.iter_rows(min_row=2, values_only=True):
            row_data = {key: value for key, value in zip(headers, row)}
            if not any(value is not None and str(value).strip() != "" for value in row_data.values()):
                continue

            plan_data = PlanEstudiosCreate(
                nombre=str(row_data.get("nombre") or "").strip(),
                programa_educativo_id=int(row_data.get("programa_educativo_id") or 0),
                vigente=row_data.get("vigente") if row_data.get("vigente") is not None else True,
                tipo_periodo=row_data.get("tipo_periodo")
            )
            nuevo_plan = crear_nuevo_plan_estudios(db, plan_data)
            objects.append(nuevo_plan)

        return objects
    except Exception as e:
        raise ValueError(f"Error al crear el plan de estudios: {str(e)}")
    
async def exportar_plan_estudios(db: Session):
    planes = db.query(PlanEstudios).all()
    wb = xl.Workbook()
    sheet = wb.active
    sheet.title = "planes_estudio"

    headers = ["id", "nombre", "programa_educativo_id", "vigente", "tipo_periodo"]
    for col_idx, header in enumerate(headers, start=1):
        sheet.cell(row=1, column=col_idx, value=header)

    for row_idx, plan in enumerate(planes, start=2):
        sheet.cell(row=row_idx, column=1, value=plan.id)
        sheet.cell(row=row_idx, column=2, value=plan.nombre)
        sheet.cell(row=row_idx, column=3, value=plan.programa_educativo_id)
        sheet.cell(row=row_idx, column=4, value=plan.vigente)
        sheet.cell(row=row_idx, column=5, value=plan.tipo_periodo.value)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer