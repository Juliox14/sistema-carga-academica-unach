from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import (
    AsignacionCarga, Materia, Docente, GrupoAbierto, PreferenciaDocente
)
from src.application.use_cases.ciclos_service import obtener_ciclo_activo

def extraer_datos_grupo_para_z3(db: Session, grupo_id: int):
    """
    Paso 1: Extraer y formatear la información de la BD para alimentar a Z3.
    """
    ciclo = obtener_ciclo_activo(db)
    if not ciclo:
        raise ValueError("No hay un ciclo activo.")

    grupo = db.query(GrupoAbierto).filter(GrupoAbierto.id == grupo_id).first()
    if not grupo:
        raise ValueError(f"Grupo con ID {grupo_id} no encontrado.")

    # Obtenemos las asignaciones de carga del grupo
    asignaciones = db.query(AsignacionCarga).filter(
        AsignacionCarga.grupo_asignado_id == grupo_id,
        AsignacionCarga.ciclo_escolar_id == ciclo.id
    ).all()

    if not asignaciones:
        raise ValueError("El grupo no tiene materias asignadas en este ciclo.")

    materias_z3 = []
    for a in asignaciones:
        if not a.docente_titular_id and not a.docente_temporal_id:
            # Para armar horario inteligentemente preferimos que todas tengan docente, 
            # pero si no, asignamos un 'docente virtual' vacío para que Z3 sí acomode la materia.
            docente_asignado = f"VACANTE_{a.materia_id}"
        else:
            docente_asignado = f"DOCENTE_{a.docente_temporal_id or a.docente_titular_id}"

        materias_z3.append({
            "asignacion_id": a.id,
            "materia_id": a.materia_id,
            "nombre": a.materia.nombre_asignatura if a.materia else "Desconocida",
            "hsm": a.materia.hsm if a.materia else 0,
            "docente_id_str": docente_asignado,
            "docente_db_id": a.docente_temporal_id or a.docente_titular_id
        })

    # Extraer las preferencias (bloqueos) de los docentes involucrados
    docentes_ids = [m["docente_db_id"] for m in materias_z3 if m["docente_db_id"] is not None]
    
    preferencias_dict = {}
    if docentes_ids:
        preferencias_db = db.query(PreferenciaDocente).filter(
            PreferenciaDocente.docente_id.in_(docentes_ids),
            PreferenciaDocente.ciclo_escolar_id == ciclo.id
        ).all()
        
        for pref in preferencias_db:
            doc_key = f"DOCENTE_{pref.docente_id}"
            if doc_key not in preferencias_dict:
                preferencias_dict[doc_key] = []
            
            preferencias_dict[doc_key].append({
                "dia_semana": pref.dia_semana.name,
                "tipo": pref.tipo_preferncia.name,  # BLOQUEO, PREFERENCIA, etc
                "horas_bloqueadas": pref.horas_bloqueadas
            })

    return {
        "grupo": {
            "id": grupo.id,
            "turno": grupo.turno.name,
            "numero_periodo": grupo.numero_periodo,
            "grupo": grupo.grupo
        },
        "materias": materias_z3,
        "preferencias": preferencias_dict
    }

from z3 import Optimize, Bool, Sum, If, And, Or, Not, Implies, sat, is_true

def generar_horario_z3(datos: dict):
    """
    Paso 2: Genera un horario óptimo usando Z3.
    Retorna una lista de slots programados si es exitoso, o None si no hay solución.
    """
    turno = datos["grupo"]["turno"]
    if turno == "MATUTINO":
        horas = [7, 8, 9, 10, 11, 12, 13]
    elif turno == "VESPERTINO":
        horas = [15, 16, 17, 18, 19, 20, 21]
    else:
        # Mixto
        horas = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

    dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"]
    num_dias = len(dias)
    num_horas = len(horas)

    materias = datos["materias"]
    num_materias = len(materias)

    # Variables
    X = [[[Bool(f"X_m{m}_d{d}_h{h}") for h in range(num_horas)] for d in range(num_dias)] for m in range(num_materias)]

    opt = Optimize()

    # 1. HARD CONSTRAINTS
    for m, materia in enumerate(materias):
        # A) Total de horas = HSM
        total_horas = Sum([If(X[m][d][h], 1, 0) for d in range(num_dias) for h in range(num_horas)])
        opt.add(total_horas == materia["hsm"])

        dias_con_dos_horas = []
        for d in range(num_dias):
            # B) Maximo 2 horas por dia
            horas_diarias = Sum([If(X[m][d][h], 1, 0) for h in range(num_horas)])
            opt.add(horas_diarias <= 2)

            # C) Si son 2 horas, deben ser contiguas
            horas_contiguas = Sum([If(And(X[m][d][h], X[m][d][h+1]), 1, 0) for h in range(num_horas - 1)])
            opt.add(Implies(horas_diarias == 2, horas_contiguas == 1))
            
            # Guardamos si este día tiene bloque de 2 horas
            dias_con_dos_horas.append(If(horas_diarias == 2, 1, 0))
            
        # D) Exactamente UN día con 2 horas (si HSM >= 2)
        if materia["hsm"] >= 2:
            opt.add(Sum(dias_con_dos_horas) == 1)
        else:
            opt.add(Sum(dias_con_dos_horas) == 0)

    # E) Traslapes en el mismo grupo (max 1 materia a la vez)
    for d in range(num_dias):
        for h in range(num_horas):
            materias_simultaneas = Sum([If(X[m][d][h], 1, 0) for m in range(num_materias)])
            opt.add(materias_simultaneas <= 1)

    # F) Empalmes del Docente
    docentes_materias = {}
    for m, mat in enumerate(materias):
        doc_str = mat["docente_id_str"]
        if doc_str not in docentes_materias:
            docentes_materias[doc_str] = []
        docentes_materias[doc_str].append(m)

    for doc_str, mats in docentes_materias.items():
        if len(mats) > 1:
            for d in range(num_dias):
                for h in range(num_horas):
                    clases_simultaneas = Sum([If(X[m][d][h], 1, 0) for m in mats])
                    opt.add(clases_simultaneas <= 1)
    
    # 2. SOFT CONSTRAINTS (Penalizaciones y Optimización)

    # A) Preferencias y Bloqueos
    preferencias = datos["preferencias"]
    for m, mat in enumerate(materias):
        doc_str = mat["docente_id_str"]
        prefs = preferencias.get(doc_str, [])
        for pref in prefs:
            try:
                d_idx = dias.index(pref["dia_semana"])
            except ValueError:
                continue

            tipo = pref["tipo"]
            horas_str = pref["horas_bloqueadas"]
            
            # Extraer lista de horas reales (ej. "7,8" -> [7,8])
            horas_afectadas_reales = []
            if horas_str:
                horas_afectadas_reales = [int(h.strip()) for h in horas_str.split(",") if h.strip().isdigit()]
            else:
                # Si no hay horas especificadas, aplica a todo el día
                horas_afectadas_reales = horas

            # Traducir horas reales a índices de Z3
            horas_indices = [horas.index(hr) for hr in horas_afectadas_reales if hr in horas]

            for h_idx in horas_indices:
                if tipo == "BLOQUEO":
                    # Hard constraint: Prohibido
                    opt.add(X[m][d_idx][h_idx] == False)
                elif tipo == "PREFERENCIA_NO":
                    # Soft constraint: Multa si lo pones ahí
                    opt.add_soft(X[m][d_idx][h_idx] == False, 5) #type: ignore

   
    
    # B) Penalizar Sábado (Evitar a toda costa a menos que sea estrictamente necesario)
    # Sábado es el índice 5 en la lista 'dias'
    sabado_idx = 5
    for m in range(num_materias):
        for h in range(num_horas):
            # Penalización altísima (100 puntos por cada bloque en sábado)
            opt.add_soft(X[m][sabado_idx][h] == False, 100) #type: ignore

    # C) Minimizar Huecos Vacíos del Grupo
    huecos_totales = []
    for d in range(num_dias):
        for h in range(1, num_horas - 1):
            G_h = Or([X[m][d][h] for m in range(num_materias)])
            hay_clase_antes = Or([X[m][d][i] for m in range(num_materias) for i in range(h)])
            hay_clase_despues = Or([X[m][d][i] for m in range(num_materias) for i in range(h+1, num_horas)])
            es_hueco = And(Not(G_h), hay_clase_antes, hay_clase_despues)
            huecos_totales.append(If(es_hueco, 1, 0))

    opt.minimize(Sum(huecos_totales))

    # 3. RESOLVER
    if opt.check() == sat:
        modelo = opt.model()
        horario_generado = []

        for d in range(num_dias):
            for h in range(num_horas):
                for m in range(num_materias):
                    if is_true(modelo[X[m][d][h]]):
                        horario_generado.append({
                            "asignacion_id": materias[m]["asignacion_id"],
                            "dia_semana": dias[d],
                            "hora_inicio": horas[h],
                            "duracion": 1
                        })
        return horario_generado
    else:
        return None

from src.infrastructure.database.orm_models import HorarioClase, DiaSemana

def auto_generar_horario(db: Session, grupo_id: int):
    """
    Paso 3: Orquestador que extrae, genera y guarda en BD.
    """
    datos = extraer_datos_grupo_para_z3(db, grupo_id)
    horario_propuesto = generar_horario_z3(datos)
    
    if not horario_propuesto:
        raise ValueError("Es matemáticamente imposible generar un horario con las restricciones actuales.")
        
    # Eliminar el horario actual del grupo
    asignaciones_ids = [m["asignacion_id"] for m in datos["materias"]]
    if asignaciones_ids:
        db.query(HorarioClase).filter(
            HorarioClase.asignacion_carga_id.in_(asignaciones_ids)
        ).delete(synchronize_session=False)
        
    # Guardar el nuevo horario
    for slot in horario_propuesto:
        nuevo_horario = HorarioClase(
            asignacion_carga_id=slot["asignacion_id"],
            dia_semana=DiaSemana[slot["dia_semana"]],
            hora_inicio=slot["hora_inicio"],
            hora_fin=slot["hora_inicio"] + slot["duracion"]
        )
        db.add(nuevo_horario)
        
    db.commit()
    return {"mensaje": "Horario generado exitosamente.", "slots_creados": len(horario_propuesto)}
