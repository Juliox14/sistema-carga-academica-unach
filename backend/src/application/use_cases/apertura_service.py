from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import CicloEscolar, GrupoAbierto, Materia
from src.infrastructure.api.schemas.apertura_schema import EjecutarAperturaRequest

def obtener_sugerencias_apertura(db: Session, plan_id: int):
    # 1. Encontrar el ciclo activo actual
    ciclo_actual = db.query(CicloEscolar).filter(CicloEscolar.activo == True).first()
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
            # Buscar los grupos del ciclo anterior en ese periodo
            grupos_pasados = db.query(GrupoAbierto)\
                .filter(
                    GrupoAbierto.ciclo_escolar_id == ciclo_anterior.id,
                    GrupoAbierto.plan_estudios_id == plan_id,
                    GrupoAbierto.numero_periodo == target_periodo
                ).all()
            for gp in grupos_pasados:
                sugerencias.append({
                    "grupo": gp.grupo,
                    "turno": gp.turno.name if hasattr(gp.turno, 'name') else str(gp.turno)
                })
                
        
            
        result_periodos.append({
            "numero_periodo": num_periodo,
            "sugerencias": sugerencias
        })
        
    return {"periodos": result_periodos}


def ejecutar_apertura_ciclo(db: Session, datos: EjecutarAperturaRequest):
    # 1. Obtener el ciclo activo donde se guardará la apertura
    ciclo_actual = db.query(CicloEscolar).filter(CicloEscolar.activo == True).first()
    if not ciclo_actual:
        return False
        
    # 2. Mapear solicitudes de grupos
    solicitados = {(g.numero_periodo, g.grupo.upper()): g.turno.upper() for g in datos.grupos}
    
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
    for (num_p, grp_letra), turno_str in solicitados.items():
        if (num_p, grp_letra) in existentes_dict:
            eg = existentes_dict[(num_p, grp_letra)]
            eg.turno = turno_str #type: ignore
        else:
            nuevo_grupo = GrupoAbierto(
                ciclo_escolar_id=ciclo_actual.id,
                plan_estudios_id=datos.plan_estudios_id,
                numero_periodo=num_p,
                grupo=grp_letra,
                turno=turno_str
            )
            db.add(nuevo_grupo)
            
    db.commit()
    return True


def listar_grupos_abiertos(db: Session):
    ciclo_actual = db.query(CicloEscolar).filter(CicloEscolar.activo == True).first()
    if not ciclo_actual:
        return []
        
    grupos = db.query(GrupoAbierto).filter(GrupoAbierto.ciclo_escolar_id == ciclo_actual.id).all()
    
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
            "turno": g.turno.name if hasattr(g.turno, 'name') else str(g.turno)
        })
    return res

def eliminar_grupo_abierto(db: Session, grupo_id: int):
    ciclo_actual = db.query(CicloEscolar).filter(CicloEscolar.activo == True).first()
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