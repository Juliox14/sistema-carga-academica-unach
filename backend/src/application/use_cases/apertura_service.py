# src/application/use_cases/apertura_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.infrastructure.database.orm_models import CicloEscolar, GrupoAbierto, Materia
from src.infrastructure.api.schemas.apertura_schema import EjecutarAperturaRequest

def obtener_sugerencias_apertura(db: Session, plan_id: int):
    # 1. Encontrar el ciclo activo actual
    ciclo_actual = db.query(CicloEscolar).filter(CicloEscolar.activo == True).first()
    if not ciclo_actual:
        return {"sugerencias": {}}
        
    # 2. Buscar el ciclo cronológicamente anterior.
    # La regla es: "Que sea de un año menor AL ACTUAL" Ó "Que sea del mismo año PERO con un mes de inicio anterior"
    ciclo_anterior = db.query(CicloEscolar)\
        .filter(
            (CicloEscolar.anio < ciclo_actual.anio) | 
            ((CicloEscolar.anio == ciclo_actual.anio) & (CicloEscolar.mes_inicio < ciclo_actual.mes_inicio))
        )\
        .order_by(CicloEscolar.anio.desc(), CicloEscolar.mes_inicio.desc())\
        .first()
        
    # Si es el primer ciclo del sistema y no hay historial, sugerimos 0 para todos
    # Primero obtenemos qué periodos/niveles existen en las materias de este plan
    periodos_plan = db.query(Materia.numero_periodo)\
        .filter(Materia.plan_estudios_id == plan_id)\
        .distinct().order_by(Materia.numero_periodo.asc()).all()
        
    sugerencias = {p[0]: 0 for p in periodos_plan}
    
    if not ciclo_anterior:
        return {"sugerencias": sugerencias}

    # 3. Contar cuántos grupos únicos se abrieron por periodo en el ciclo pasado
    # Agrupamos por numero_periodo y contamos los nombres de grupos distintos (A, B...)
    grupos_pasados = db.query(
            GrupoAbierto.numero_periodo, 
            func.count(func.distinct(GrupoAbierto.grupo))
        )\
        .filter(GrupoAbierto.ciclo_escolar_id == ciclo_anterior.id)\
        .filter(GrupoAbierto.plan_estudios_id == plan_id)\
        .group_by(GrupoAbierto.numero_periodo)\
        .all()

    # 4. Aplicar el algoritmo de empuje (Progresión Académica: Nivel N -> Nivel N+1)
    for periodo_pasado, total_grupos in grupos_pasados:
        siguiente_periodo = periodo_pasado + 1
        # Si el siguiente periodo existe en este plan, le heredamos los grupos
        if siguiente_periodo in sugerencias:
            sugerencias[siguiente_periodo] = total_grupos
            
    # El periodo 1 (nuevo ingreso) siempre sugerirá 0 (o el histórico de periodos 1 si prefieres)
    if 1 in sugerencias:
        sugerencias[1] = 0

    return {"sugerencias": sugerencias}


def ejecutar_apertura_ciclo(db: Session, datos: EjecutarAperturaRequest):
    # 1. Obtener el ciclo activo donde se guardará la apertura
    ciclo_actual = db.query(CicloEscolar).filter(CicloEscolar.active == True).first()
    if not ciclo_actual:
        return False
        
    # Abecedario para asignar los nombres de los grupos dinámicamente
    letras_grupos = ["A", "B", "C", "D", "E", "F"]
    
    # 2. Iterar sobre la configuración que envió la secretaria (Ej: Periodo 1 -> 2 grupos)
    for periodo, cantidad_grupos in datos.configuracion_grupos.items():
        if cantidad_grupos <= 0:
            continue
            
        # 3. Buscar TODAS las materias que pertenecen a este periodo en este plan de estudios
        materias = db.query(Materia).filter(
            Materia.plan_estudios_id == datos.plan_estudios_id,
            Materia.numero_periodo == periodo
        ).all()
        
        # 4. Generar los grupos en masa
        for i in range(cantidad_grupos):
            letra = letras_grupos[i] if i < len(letras_grupos) else f"G{i+1}"
            
            # Para cada materia de ese periodo, abrimos el mismo grupo
            for materia in materias:
                # Validar primero que no se haya abierto ya (por seguridad)
                existe = db.query(GrupoAbierto).filter(
                    GrupoAbierto.ciclo_escolar_id == ciclo_actual.id,
                    GrupoAbierto.materia_id == materia.id,
                    GrupoAbierto.grupo == letra
                ).first()
                
                if not existe:
                    nuevo_grupo = GrupoAbierto(
                        ciclo_escolar_id=ciclo_actual.id,
                        plan_estudios_id=datos.plan_estudios_id,
                        materia_id=materia.id,
                        numero_periodo=periodo,
                        grupo=letra,
                        turno="MIXTO" # Un valor por defecto, modificable después
                    )
                    db.add(nuevo_grupo)
                    
    db.commit()
    return True