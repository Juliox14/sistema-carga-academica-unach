from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import CicloEscolar, GrupoAbierto, Materia
from src.infrastructure.api.schemas.apertura_schema import EjecutarAperturaRequest

from src.application.use_cases.ciclos_service import obtener_ciclo_activo

def obtener_sugerencias_apertura(db: Session, plan_id: int, unidad_id: int | None = None):
    # 1. Encontrar el ciclo activo actual
    ciclo_actual = obtener_ciclo_activo(db, unidad_id)
    if not ciclo_actual:
        return {"periodos": []}
        
    # 2. Buscar el ciclo cronológicamente anterior.
    ciclo_anterior = db.query(CicloEscolar)\
        .filter(
            (CicloEscolar.anio < ciclo_actual.anio) | 
            ((CicloEscolar.anio == ciclo_actual.anio) & (CicloEscolar.mes_inicio < ciclo_actual.mes_inicio))
        )\
        .order_by(CicloEscolar.anio.desc(), CicloEscolar.mes_inicio.desc())\
        .first()
        
    # Obtener periodos distintos del plan
    periodos = db.query(Materia.numero_periodo)\
        .filter(Materia.plan_estudios_id == plan_id)\
        .distinct().order_by(Materia.numero_periodo.asc()).all()
        
    # Obtener periodos que tienen materias especiales activas
    materias_especiales = db.query(Materia.numero_periodo).filter(
        Materia.plan_estudios_id == plan_id,
        Materia.es_especial == True,
        Materia.estatus == "ACTIVA"
    ).distinct().all()
    periodos_especiales = {me[0] for me in materias_especiales}
        
    result_periodos = []
    
    for p in periodos:
        num_periodo = p[0]
        sugerencias = []
        
        # Determinar qué período del ciclo pasado consultar (P - 1 para cohort progression, o P para nuevo ingreso)
        if num_periodo == 1:
            target_periodo = 1
        else:
            target_periodo = num_periodo - 1
            
        if ciclo_anterior:
             # Buscar los grupos del ciclo anterior en ese periodo (filtrando los especiales)
             grupos_pasados = db.query(GrupoAbierto)\
                 .filter(
                     GrupoAbierto.ciclo_escolar_id == ciclo_anterior.id,
                     GrupoAbierto.plan_estudios_id == plan_id,
                     GrupoAbierto.numero_periodo == target_periodo,
                     GrupoAbierto.es_especial == False
                 ).all()
             for gp in grupos_pasados:
                sugerencias.append({
                    "grupo": gp.grupo,
                    "turno": gp.turno.name if hasattr(gp.turno, 'name') else str(gp.turno),
                    "es_especial": False
                })
                
        # Si el periodo tiene materias especiales, forzar la sugerencia del grupo especial
        if num_periodo in periodos_especiales:
            sugerencias.append({
                "grupo": "U",
                "turno": "MIXTO",
                "es_especial": True
            })
            
        result_periodos.append({
            "numero_periodo": num_periodo,
            "sugerencias": sugerencias
        })
        
    return {"periodos": result_periodos}


def ejecutar_apertura_ciclo(db: Session, datos: EjecutarAperturaRequest, unidad_id: int | None = None):
    from fastapi import HTTPException
    
    # 1. Obtener el ciclo activo donde se guardará la apertura
    ciclo_actual = obtener_ciclo_activo(db, unidad_id)
    if not ciclo_actual:
        return False
        
    # 2. Mapear solicitudes de grupos
    solicitados = {
        (g.numero_periodo, g.grupo.upper()): {
            "turno": g.turno.upper(),
            "es_especial": g.es_especial
        } for g in datos.grupos
    }
    
    # 3. Validar reglas de grupos especiales
    # Obtener periodos que tienen materias especiales activas
    materias_especiales = db.query(Materia.numero_periodo).filter(
        Materia.plan_estudios_id == datos.plan_estudios_id,
        Materia.es_especial == True,
        Materia.estatus == "ACTIVA"
    ).distinct().all()
    periodos_especiales = {me[0] for me in materias_especiales}
    
    # Agrupar las solicitudes de grupos por periodo
    grupos_por_periodo = {}
    for g in datos.grupos:
        grupos_por_periodo.setdefault(g.numero_periodo, []).append(g)
        
    for p, grupos_list in grupos_por_periodo.items():
        especiales_en_periodo = [g for g in grupos_list if g.es_especial]
        
        # Regla 1: No puede haber más de un grupo especial por periodo
        if len(especiales_en_periodo) > 1:
            raise HTTPException(
                status_code=400,
                detail=f"Solo se permite un grupo especial por periodo. El Periodo {p} tiene {len(especiales_en_periodo)}."
            )
            
        # Regla 2: Si el periodo tiene materias especiales, debe existir exactamente un grupo especial
        if p in periodos_especiales and len(especiales_en_periodo) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"El Periodo {p} tiene materias especiales, por lo que requiere obligatoriamente que se defina un grupo especial."
            )
            
        # Regla 3: Si el periodo NO tiene materias especiales, no puede haber grupos especiales
        if p not in periodos_especiales and len(especiales_en_periodo) > 0:
            raise HTTPException(
                status_code=400,
                detail=f"El Periodo {p} no tiene materias especiales, por lo que no se permite crear grupos especiales en él."
            )
    
    # 3. Obtener grupos existentes para este plan en el ciclo actual
    existentes = db.query(GrupoAbierto).filter(
        GrupoAbierto.ciclo_escolar_id == ciclo_actual.id,
        GrupoAbierto.plan_estudios_id == datos.plan_estudios_id
    ).all()
    
    existentes_dict = {(eg.numero_periodo, eg.grupo.upper()): eg for eg in existentes}
    
    # 4. Eliminar los que ya no están solicitados
    for (num_p, grp_letra), eg in existentes_dict.items():
        if (num_p, grp_letra) not in solicitados:
            # Verificar si tiene asignaciones activas antes de eliminar
            tiene_asignaciones = db.query(GrupoAbierto).filter(GrupoAbierto.id == eg.id).join(GrupoAbierto.asignaciones).first()
            if tiene_asignaciones:
                raise ValueError(
                    f"No se puede eliminar el Grupo {eg.grupo} del periodo {eg.numero_periodo} "
                    "porque ya tiene materias con cargas académicas asignadas en este ciclo."
                )
            db.delete(eg)
            
    # 5. Insertar o actualizar los solicitados
    for (num_p, grp_letra), info in solicitados.items():
        if (num_p, grp_letra) in existentes_dict:
            eg = existentes_dict[(num_p, grp_letra)]
            eg.turno = info["turno"] #type: ignore
            eg.es_especial = info["es_especial"] #type: ignore
        else:
            nuevo_grupo = GrupoAbierto(
                ciclo_escolar_id=ciclo_actual.id,
                plan_estudios_id=datos.plan_estudios_id,
                numero_periodo=num_p,
                grupo=grp_letra,
                turno=info["turno"],
                es_especial=info["es_especial"]
            )
            db.add(nuevo_grupo)
            
    db.commit()
    return True


def listar_grupos_abiertos(db: Session, unidad_id: int | None = None):
    ciclo_actual = obtener_ciclo_activo(db, unidad_id)
    if not ciclo_actual:
        return []
        
    grupos = db.query(GrupoAbierto).filter(
        GrupoAbierto.ciclo_escolar_id == ciclo_actual.id
    ).all()
    
    res = []
    for g in grupos:
        res.append({
            "id": g.id,
            "ciclo_escolar_id": g.ciclo_escolar_id,
            "ciclo_escolar_nombre": g.ciclo_escolar.nombre if g.ciclo_escolar else "",
            "plan_estudios_id": g.plan_estudios_id,
            "plan_estudios_nombre": g.plan_estudio.nombre if g.plan_estudio else "",
            "numero_periodo": g.numero_periodo,
            "grupo": g.grupo,
            "turno": g.turno.name if hasattr(g.turno, 'name') else str(g.turno),
            "es_especial": g.es_especial
        })
    return res

def eliminar_grupo_abierto(db: Session, grupo_id: int, unidad_id: int | None = None):
    ciclo_actual = obtener_ciclo_activo(db, unidad_id)
    if not ciclo_actual:
        raise ValueError("No hay un ciclo escolar activo.")

    grupo = db.query(GrupoAbierto).filter(
        GrupoAbierto.id == grupo_id,
        GrupoAbierto.ciclo_escolar_id == ciclo_actual.id
    ).first()

    if not grupo:
        raise ValueError("El grupo abierto no existe o no pertenece al ciclo escolar activo.")

    from src.infrastructure.database.orm_models import AsignacionCarga
    asignaciones_grupo = db.query(AsignacionCarga).filter(
        AsignacionCarga.grupo_asignado_id == grupo.id
    ).all()

    for asignacion in asignaciones_grupo:
        db.delete(asignacion)

    db.delete(grupo)
    db.commit()
    return True