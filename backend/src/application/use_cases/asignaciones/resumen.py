from sqlalchemy.orm import Session
from sqlalchemy import or_
from src.infrastructure.database.orm_models import Docente, CategoriaDocente, AsignacionCarga, AsignacionOtraActividad, EstatusDocente
from src.application.use_cases.ciclos_service import obtener_ciclo_activo

def obtener_resumen_carga_docentes(db: Session):
    try:
        ciclo = obtener_ciclo_activo(db)
    except Exception:
        return {
            "cobertura": [],
            "docentes_incompletos": []
        }

    # Obtener categorías de docentes
    categorias = db.query(CategoriaDocente).all()
    mapa_categorias = {cat.id: {"nombre": cat.nombre, "siglas": cat.siglas, "hsm_base": cat.hsm_base} for cat in categorias}

    # Obtener docentes activos
    docentes_activos = db.query(Docente).filter(Docente.estatus == EstatusDocente.ACTIVO).all()
    if not docentes_activos:
        return {
            "cobertura": [],
            "docentes_incompletos": []
        }

    docente_ids = [d.id for d in docentes_activos]

    # Obtener asignaciones del ciclo activo
    asignaciones_carga = db.query(AsignacionCarga).filter(
        AsignacionCarga.ciclo_escolar_id == ciclo.id,
        or_(
            AsignacionCarga.docente_titular_id.in_(docente_ids),
            AsignacionCarga.docente_temporal_id.in_(docente_ids)
        )
    ).all()

    asignaciones_otras = db.query(AsignacionOtraActividad).filter(
        AsignacionOtraActividad.ciclo_escolar_id == ciclo.id,
        AsignacionOtraActividad.docente_id.in_(docente_ids)
    ).all()

    # Calcular horas asignadas en memoria
    horas_por_docente = {d.id: {"frente": 0, "descargas": 0, "otras": 0} for d in docentes_activos}

    for a in asignaciones_carga:
        hsm = a.materia.hsm if a.materia else 0
        if a.docente_titular_id in horas_por_docente:
            if a.motivo_descarga:
                horas_por_docente[a.docente_titular_id]["descargas"] += hsm #type: ignore
            else:
                horas_por_docente[a.docente_titular_id]["frente"] += hsm #type: ignore
        if a.docente_temporal_id in horas_por_docente:
            horas_por_docente[a.docente_temporal_id]["frente"] += hsm #type: ignore

    for act in asignaciones_otras:
        if act.docente_id in horas_por_docente:
            horas_por_docente[act.docente_id]["otras"] += act.horas_asignadas #type: ignore

    resumen_tipos = {
        "PTC": {"tipo": "Tiempo Completo", "horas_asignadas": 0, "horas_requeridas": 0, "docentes_detalle": []},
        "PMT": {"tipo": "Medio Tiempo", "horas_asignadas": 0, "horas_requeridas": 0, "docentes_detalle": []},
        "PAS": {"tipo": "Sindicalizados", "horas_asignadas": 0, "horas_requeridas": 0, "docentes_detalle": []},
        "PAT": {"tipo": "Temporales", "horas_asignadas": 0, "horas_requeridas": 0, "docentes_detalle": []},
        "PAE": {"tipo": "Eventuales", "horas_asignadas": 0, "horas_requeridas": 0, "docentes_detalle": []},
    }

    docentes_incompletos = []

    for d in docentes_activos:
        cat_info = mapa_categorias.get(d.categoria_id, {"nombre": "Desconocido", "siglas": "N/A", "hsm_base": 0}) #type: ignore
        siglas = cat_info["siglas"]

        hsm_requerida = d.hsm_personalizadas if d.hsm_personalizadas is not None else cat_info["hsm_base"]
        
        d_horas = horas_por_docente.get(d.id, {"frente": 0, "descargas": 0, "otras": 0})
        hsm_asignada = d_horas["frente"] + d_horas["descargas"] + d_horas["otras"]

        nombre_completo = f"{d.apellidos} {d.nombre}".upper()

        docente_det = {
            "id": d.id,
            "nombre_completo": nombre_completo,
            "horas_asignadas": hsm_asignada,
            "alerta": hsm_asignada == 0
        }

        if siglas in resumen_tipos:
            resumen_tipos[siglas]["horas_asignadas"] += hsm_asignada
            resumen_tipos[siglas]["horas_requeridas"] += hsm_requerida
            resumen_tipos[siglas]["docentes_detalle"].append(docente_det)
        else:
            if siglas not in resumen_tipos:
                resumen_tipos[siglas] = {"tipo": cat_info["nombre"], "horas_asignadas": 0, "horas_requeridas": 0, "docentes_detalle": []}
            resumen_tipos[siglas]["horas_asignadas"] += hsm_asignada
            resumen_tipos[siglas]["horas_requeridas"] += hsm_requerida
            resumen_tipos[siglas]["docentes_detalle"].append(docente_det)

        # Cargas incompletas
        if hsm_asignada < hsm_requerida:
            docentes_incompletos.append({
                "id": d.id,
                "nombre_completo": nombre_completo,
                "tipo": resumen_tipos[siglas]["tipo"] if siglas in resumen_tipos else cat_info["nombre"],
                "siglas": siglas,
                "horas_asignadas": hsm_asignada,
                "horas_requeridas": hsm_requerida,
                "horas_pendientes": hsm_requerida - hsm_asignada
            })

    cobertura_lista = []
    for siglas, info in resumen_tipos.items():
        req = info["horas_requeridas"]
        asig = info["horas_asignadas"]
        
        # Calcular porcentaje si req > 0
        porcentaje = round((asig / req) * 100, 1) if req > 0 else None

        # Ordenar los docentes de este tipo por nombre completo
        info["docentes_detalle"].sort(key=lambda x: x["nombre_completo"])

        cobertura_lista.append({
            "tipo": info["tipo"],
            "siglas": siglas,
            "horas_asignadas": asig,
            "horas_requeridas": req,
            "porcentaje": porcentaje,
            "docentes": info["docentes_detalle"]
        })

    docentes_incompletos.sort(key=lambda x: x["horas_pendientes"], reverse=True)

    return {
        "cobertura": cobertura_lista,
        "docentes_incompletos": docentes_incompletos
    }
