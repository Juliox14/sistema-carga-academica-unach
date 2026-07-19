from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.ciclos_schema import CicloEscolarCreate, CicloEscolarResponse, CicloEscolarUpdate
from src.application.use_cases import ciclos_service
from src.infrastructure.security import require_roles, get_current_user
from src.infrastructure.database.orm_models import Usuario
from pydantic import BaseModel
from typing import Optional

CATALOG_ROLES = ["SUPER_ADMIN", "SECRETARIA_ACADEMICA", "CAPTURISTA"]

router = APIRouter(prefix="/api/ciclos", tags=["Ciclos Escolares"])


class ActivarCicloRequest(BaseModel):
    unidad_academica_id: Optional[int] = None  # Solo SUPER_ADMIN puede especificar otra unidad

@router.post("/", response_model=CicloEscolarResponse, dependencies=[Depends(require_roles(CATALOG_ROLES))])
def crear(ciclo: CicloEscolarCreate, db: Session = Depends(get_db)):
    return ciclos_service.crear_ciclo(db, ciclo)

@router.get("/", response_model=List[CicloEscolarResponse], dependencies=[Depends(get_current_user)])
def listar(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    unidad_id = current_user.unidad_academica_id if (current_user.rol and current_user.rol.clave != "SUPER_ADMIN") else None
    return ciclos_service.obtener_ciclos(db, unidad_id=unidad_id)

@router.get("/{ciclo_id}", response_model=CicloEscolarResponse, dependencies=[Depends(get_current_user)])
def obtener(ciclo_id: int, db: Session = Depends(get_db)):
    return ciclos_service.obtener_ciclo_por_id(db, ciclo_id)

@router.put("/{ciclo_id}", response_model=CicloEscolarResponse, dependencies=[Depends(require_roles(CATALOG_ROLES))])
def actualizar(ciclo_id: int, ciclo: CicloEscolarUpdate, db: Session = Depends(get_db)):
    return ciclos_service.actualizar_ciclo(db, ciclo_id, ciclo)

@router.delete("/{ciclo_id}", dependencies=[Depends(require_roles(CATALOG_ROLES))])
def eliminar(ciclo_id: int, db: Session = Depends(get_db)):
    ciclos_service.eliminar_ciclo(db, ciclo_id)
    return {"message": "Ciclo escolar eliminado exitosamente"}

@router.post("/finalizar-carga", response_model=CicloEscolarResponse, dependencies=[Depends(require_roles(CATALOG_ROLES))])
def finalizar_carga(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    unidad_id = current_user.unidad_academica_id if (current_user.rol and current_user.rol.clave != "SUPER_ADMIN") else None
    try:
        return ciclos_service.finalizar_carga_ciclo_activo(db, unidad_id=unidad_id)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/desfinalizar-carga", response_model=CicloEscolarResponse, dependencies=[Depends(require_roles(CATALOG_ROLES))])
def desfinalizar_carga(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    unidad_id = current_user.unidad_academica_id if (current_user.rol and current_user.rol.clave != "SUPER_ADMIN") else None
    try:
        return ciclos_service.desfinalizar_carga_ciclo_activo(db, unidad_id=unidad_id)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{ciclo_id}/activar", dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def activar_ciclo_para_unidad(
    ciclo_id: int,
    body: ActivarCicloRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Activa un ciclo escolar para una unidad academica. Si el usuario no es SUPER_ADMIN, solo puede activar para su propia unidad."""
    if current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        unidad_id = body.unidad_academica_id
    else:
        unidad_id = current_user.unidad_academica_id
    if not unidad_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Se requiere una unidad academica para activar el ciclo.")
    try:
        return ciclos_service.activar_ciclo_para_unidad(db, ciclo_id=ciclo_id, unidad_id=unidad_id)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{ciclo_id}/cerrar", dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def cerrar_ciclo_para_unidad_endpoint(
    ciclo_id: int,
    body: ActivarCicloRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Cierra un ciclo escolar activamente, validando asignaciones y horarios."""
    if current_user.rol and current_user.rol.clave == "SUPER_ADMIN":
        unidad_id = body.unidad_academica_id
    else:
        unidad_id = current_user.unidad_academica_id
    if not unidad_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Se requiere una unidad academica para cerrar el ciclo.")
    try:
        res = ciclos_service.cerrar_ciclo_para_unidad(db, ciclo_id=ciclo_id, unidad_id=unidad_id)
        if not res['success']:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=res['errores'])
        return {"message": "Ciclo cerrado exitosamente"}
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))