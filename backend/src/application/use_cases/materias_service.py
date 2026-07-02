from io import BytesIO

import openpyxl as xl
from sqlalchemy.orm import Session

from src.infrastructure.api.schemas.materias_schema import MateriaCreate, MateriaUpdate
from src.infrastructure.database.orm_models import Materia


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


async def importar_materias(db: Session, byte_object: BytesIO):
    try:
        byte_object.seek(0)
        wb = xl.load_workbook(byte_object)
        sheet = wb["materias"]
        objects = []
        headers = [cell.value for cell in sheet[1]]

        for row in sheet.iter_rows(min_row=2, values_only=True):
            row_data = {key: value for key, value in zip(headers, row)}
            if not any(value is not None and str(value).strip() != "" for value in row_data.values()):
                continue

            materia_data = MateriaCreate(
                nombre_asignatura=str(row_data.get("nombre_asignatura") or "").strip(),
                plan_estudios_id=int(row_data.get("plan_estudios_id") or 0),
                numero_periodo=int(row_data.get("numero_periodo") or 0),
                hsm=int(row_data.get("hsm") or 0),
                area_conocimiento_id=int(row_data.get("area_conocimiento_id") or 0),
                estatus=str(row_data.get("estatus") or "ACTIVA"),
            )
            objects.append(crear_nueva_materia(db, materia_data))

        return objects
    except Exception as e:
        raise ValueError(f"Error al importar las materias: {str(e)}")


async def exportar_materias(materias: list):
    wb = xl.Workbook()
    sheet = wb.active
    sheet.title = "materias"

    headers = ["id", "nombre_asignatura", "plan_estudios_id", "numero_periodo", "hsm", "area_conocimiento_id", "estatus"]
    for col_idx, header in enumerate(headers, start=1):
        sheet.cell(row=1, column=col_idx, value=header)

    for row_idx, materia in enumerate(materias, start=2):
        sheet.cell(row=row_idx, column=1, value=materia.id)
        sheet.cell(row=row_idx, column=2, value=materia.nombre_asignatura)
        sheet.cell(row=row_idx, column=3, value=materia.plan_estudios_id)
        sheet.cell(row=row_idx, column=4, value=materia.numero_periodo)
        sheet.cell(row=row_idx, column=5, value=materia.hsm)
        sheet.cell(row=row_idx, column=6, value=materia.area_conocimiento_id)
        sheet.cell(row=row_idx, column=7, value=getattr(materia.estatus, "value", materia.estatus))

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer