from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from src.infrastructure.database.database import get_db
from src.infrastructure.api.schemas.oficios_schema import (
    PlantillaOficioCreate, PlantillaOficioResponse, OficioDocenteResponse, FirmarOficioRequest, EmitirOficiosRequest, RechazarOficioRequest
)
from src.application.use_cases.oficios import oficios_service
from src.infrastructure.security import require_roles, get_current_user
from src.infrastructure.database.orm_models import Usuario
from src.application.use_cases import horarios_service

router = APIRouter(prefix="/api/oficios", tags=["Oficios y Firmas"])

# ─── GESTIÓN DE PLANTILLAS (SUPER_ADMIN Y SECRETARIA_ACADEMICA) ───

@router.get("/plantillas", response_model=List[PlantillaOficioResponse], dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def listar_plantillas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Lista las plantillas disponibles para firmar documentos oficiales en el ciclo."""
    return oficios_service.obtener_plantillas(db, current_user.unidad_academica_id)

@router.post("/plantillas", response_model=PlantillaOficioResponse, dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def agregar_plantilla(data: PlantillaOficioCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Registra una nueva plantilla, compilando automáticamente su estructura HTML."""
    return oficios_service.crear_plantilla(db, data, current_user.unidad_academica_id)


@router.put("/plantillas/{plantilla_id}/activar", response_model=PlantillaOficioResponse, dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def activar_plantilla(plantilla_id: int, db: Session = Depends(get_db)):
    """Activa una plantilla específica desactivando las otras del mismo contrato."""
    try:
        return oficios_service.activar_plantilla(db, plantilla_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/plantillas/{plantilla_id}", response_model=PlantillaOficioResponse, dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def actualizar_plantilla(plantilla_id: int, data: PlantillaOficioCreate, db: Session = Depends(get_db)):
    """Actualiza una plantilla existente re-compilando su contenido HTML."""
    try:
        return oficios_service.actualizar_plantilla(db, plantilla_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/plantillas/{plantilla_id}", dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def eliminar_plantilla(plantilla_id: int, db: Session = Depends(get_db)):
    """Elimina una plantilla si no está asociada a ningún oficio emitido."""
    try:
        oficios_service.eliminar_plantilla(db, plantilla_id)
        return {"detail": "Plantilla eliminada exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))



# ─── EMISIÓN Y AUDITORÍA (SUPER_ADMIN Y SECRETARIA_ACADEMICA) ───

@router.post("/emitir", status_code=status.HTTP_200_OK, dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def emitir_oficios(payload: Optional[EmitirOficiosRequest] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Genera en batch los oficios para los docentes de las categorías indicadas con folios manuales."""
    try:
        categorias = payload.categorias if payload else None
        prefijo = payload.folio_prefijo if payload else None
        inicial = payload.folio_inicial if payload else None
        sufijo = payload.folio_sufijo if payload else None
        
        total = oficios_service.emitir_oficios_ciclo(
            db, 
            categorias_siglas=categorias,
            folio_prefijo=prefijo,
            folio_inicial=inicial,
            folio_sufijo=sufijo,
            unidad_id=current_user.unidad_academica_id
        )
        return {
            "mensaje": f"Proceso completado. Se emitieron {total} nuevos oficios de carga académica para este ciclo escolar.",
            "total": total
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/emitidos", response_model=List[OficioDocenteResponse], dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
def listar_oficios_emitidos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Retorna la lista de todos los oficios emitidos en el ciclo para control de firmas."""
    
    ciclo = horarios_service.obtener_ciclo_activo(db)
    if not ciclo: return []
    return oficios_service.obtener_oficios_emitidos(db, ciclo.id, current_user.unidad_academica_id) #type: ignore


# ─── PORTAL DEL DOCENTE (ACCESO LOGUEADO GENERAL) ───

@router.get("/mi-oficio", response_model=OficioDocenteResponse)
def obtener_mi_oficio(current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retorna el oficio activo asignado al docente logueado, interpolado con sus materias."""
    oficio = oficios_service.obtener_oficio_docente_activo(db, current_user.id) #type: ignore
    if not oficio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró ningún oficio de carga académica emitido para tu cuenta en este ciclo escolar."
        )
    return oficio


@router.patch("/mi-oficio/leer", response_model=OficioDocenteResponse)
def registrar_lectura_mi_oficio(request: Request, current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    """Registra la lectura/acuse tácito del oficio (especialmente para eventuales)."""
    ip = request.client.host if request.client else "127.0.0.1"
    try:
        return oficios_service.registrar_lectura_oficio(db, current_user.id, ip) #type: ignore
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/mi-oficio/firmar", response_model=OficioDocenteResponse)
def firmar_mi_oficio(request: Request, body: FirmarOficioRequest, current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    """Firma de conformidad el oficio del docente logueado verificando su contraseña de acceso."""
    ip = request.client.host if request.client else "127.0.0.1"
    try:
        return oficios_service.firmar_oficio_digital(db, current_user, body.password, ip)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/mi-oficio/rechazar", response_model=OficioDocenteResponse)
def rechazar_mi_oficio(body: RechazarOficioRequest, current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    """Rechaza la carga académica asignada y registra los motivos de rechazo en observaciones."""
    try:
        return oficios_service.rechazar_oficio_digital(db, current_user, body.observaciones)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
