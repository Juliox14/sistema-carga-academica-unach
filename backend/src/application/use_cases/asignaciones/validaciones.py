from sqlalchemy.orm import Session
from fastapi import HTTPException
from .tablero import obtener_tablero_docente
from src.infrastructure.config.settings_service import ConfiguracionService
from .historial import obtener_mapa_historial_docente



def _verificar_limite_hsm(db: Session, docente_id: int, nuevas_horas: int | float, unidad_actual_id: int | None = None):
    """Verifica que el docente no rebase sus horas contratadas al asignarle una nueva carga."""
    from src.infrastructure.database.orm_models import Docente, DocenteUnidad
    docente_db = db.query(Docente).filter(Docente.id == docente_id).first()
    if docente_db and docente_db.estatus and not docente_db.estatus.permite_carga:
        raise HTTPException(
            status_code=400,
            detail=f"El estatus actual del docente ({docente_db.estatus.nombre}) no permite la asignación de carga académica."
        )
        
    docente = obtener_tablero_docente(db, docente_id)
    horas_actuales = docente["suma_total"] + nuevas_horas
    limite = docente["hsm_base"]
    
    # 1. Validación de Horas Globales
    permite_excedentes = False
    if unidad_actual_id:
        permite_excedentes = ConfiguracionService.obtener("PERMITE_HORAS_EXCEDENTES", unidad_actual_id, False)
    
    if docente["categoria"] == "PAE":
        return  # Los docentes PAE no tienen límite de horas
    
    if permite_excedentes and unidad_actual_id:
        margen = ConfiguracionService.obtener("MAX_HORAS_EXCEDENTES", unidad_actual_id, 0)
        limite += margen
    
    if horas_actuales > limite:
        raise HTTPException(
            status_code=400, 
            detail=f"Límite global excedido. El docente puede tener máximo {limite} HSM."
        )

    # 2. Validación de Horas de Sede (Bolsa Libre)
    if not unidad_actual_id:
        return
        
    unidad_principal = next((u for u in docente_db.unidades if u.es_unidad_principal), None)
    
    if unidad_principal and unidad_principal.horas_obligatorias is not None and unidad_principal.horas_obligatorias > 0:
        # Si la unidad que está asignando NO es la principal
        if unidad_principal.unidad_academica_id != unidad_actual_id:
            # Calcular horas ya asignadas en SEDES SECUNDARIAS
            horas_en_secundarias = 0
            
            # Carga académica en secundarias
            for carga in docente["carga_academica"]:
                if carga.programa_educativo:
                    # En tablero, programa_educativo es un str. 
                    # Necesitamos cruzar si pertenece a la unidad principal. Pero tablero no exporta el ID de la unidad.
                    pass
            # Para mayor certeza, usamos DB directamente:
            from src.infrastructure.database.orm_models import AsignacionCarga, GrupoAbierto, PlanEstudios, ProgramaEducativo, AsignacionOtraActividad
            from src.application.use_cases.ciclos_service import obtener_ciclo_activo
            ciclo = obtener_ciclo_activo(db)
            
            cargas_secundarias = db.query(AsignacionCarga).join(GrupoAbierto).join(PlanEstudios).join(ProgramaEducativo).filter(
                (AsignacionCarga.docente_titular_id == docente_id) | (AsignacionCarga.docente_temporal_id == docente_id),
                AsignacionCarga.ciclo_escolar_id == ciclo.id,
                ProgramaEducativo.unidad_academica_id != unidad_principal.unidad_academica_id
            ).all()
            
            for c in cargas_secundarias:
                if c.docente_temporal_id == docente_id or (c.docente_titular_id == docente_id and not c.docente_temporal_id):
                    horas_en_secundarias += c.grupo_asignado.materia.hsm
                    
            otras_act_sec = db.query(AsignacionOtraActividad).filter(
                AsignacionOtraActividad.docente_id == docente_id,
                AsignacionOtraActividad.ciclo_escolar_id == ciclo.id,
                AsignacionOtraActividad.unidad_academica_id != unidad_principal.unidad_academica_id
            ).all()
            
            for oa in otras_act_sec:
                horas_en_secundarias += oa.horas_asignadas
                
            bolsa_libre = limite - unidad_principal.horas_obligatorias
            
            if (horas_en_secundarias + nuevas_horas) > bolsa_libre:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Límite excedido. El docente debe cumplir {unidad_principal.horas_obligatorias} hrs en su sede principal. Horas libres disponibles para otras sedes: {bolsa_libre - horas_en_secundarias}."
                )

def _validar_ciclos_consecutivos(db: Session, docente_id: int, materia_id: int):
    limite_racha = ConfiguracionService.obtener("MAX_CICLOS_CONSECUTIVOS", 0)
    
    if limite_racha == 0:
        return 
    
    historial = obtener_mapa_historial_docente(db, docente_id)
    
    datos_materia = historial.get(materia_id)
    if datos_materia:
        if datos_materia["consecutivos"] >= limite_racha:
            raise HTTPException(
                status_code=400, 
                detail=f"Regla académica: El docente ya ha impartido esta materia por {limite_racha} periodos consecutivos."
            )

def _validar_tipo_asignacion_categoria(db: Session, docente_id: int, requiere_titular: bool = False, requiere_suplente: bool = False):
    """Valida que la categoría del docente permita asignarlo como titular o suplente."""
    from src.infrastructure.database.orm_models import Docente
    docente = db.query(Docente).filter(Docente.id == docente_id).first()
    if not docente or not docente.categoria:
        return
        
    categoria = docente.categoria
    if requiere_titular and not getattr(categoria, 'permite_titular', True):
        raise HTTPException(
            status_code=400,
            detail=f"La categoría del docente ({categoria.siglas}) no permite la asignación de materias regulares (titularidades)."
        )
    if requiere_suplente and not getattr(categoria, 'permite_suplente', False):
        raise HTTPException(
            status_code=400,
            detail=f"La categoría del docente ({categoria.siglas}) no permite cubrir descargas (suplencias)."
        )

def _validar_materia_especial(db: Session, materia_id: int, grupo_abierto_id: int):
    """Valida que una materia especial solo sea asignada a un grupo especial y viceversa."""
    from src.infrastructure.database.orm_models import Materia, GrupoAbierto
    
    materia = db.query(Materia).filter(Materia.id == materia_id).first()
    if not materia:
        return
        
    grupo = db.query(GrupoAbierto).filter(GrupoAbierto.id == grupo_abierto_id).first()
    if not grupo:
        return
        
    es_materia_especial = getattr(materia, 'es_especial', False)
    es_grupo_especial = getattr(grupo, 'es_especial', False)
    
    if es_materia_especial and not es_grupo_especial:
        raise HTTPException(
            status_code=400,
            detail="Esta es una materia especial y solo se permite su asignación en un grupo configurado como Especial."
        )
    elif not es_materia_especial and es_grupo_especial:
        raise HTTPException(
            status_code=400,
            detail="No se puede asignar una materia regular a un grupo configurado como Especial."
        )