from datetime import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import Docente, CicloEscolar, AsignacionCarga

def format_fecha_es(dt: datetime) -> str:
    """Formatea la fecha al formato largo en español: '16 de abril de 2026'."""
    meses = {
        1: "enero", 2: "febrero", 3: "marzo", 4: "abril",
        5: "mayo", 6: "junio", 7: "julio", 8: "agosto",
        9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
    }
    return f"{dt.day} de {meses[dt.month]} del {dt.year}"

def generar_tabla_carga_html(db: Session, docente: Docente, ciclo: CicloEscolar) -> str:
    """Genera la tabla HTML con las materias asignadas a un docente."""

    asignaciones = db.query(AsignacionCarga).filter(
        AsignacionCarga.ciclo_escolar_id == ciclo.id,
        or_(
            # Titular sin motivo de descarga
            (AsignacionCarga.docente_titular_id == docente.id) & (AsignacionCarga.motivo_descarga == None),
            # Temporal (suplente)
            (AsignacionCarga.docente_temporal_id == docente.id)
        )
    ).all()

    rows = []
    total_hsm = 0

    for a in asignaciones:
        m = a.materia
        g = a.grupo_asignado
        if not m or not g:
            continue
        
        # LIC (Programa Educativo Clave)
        lic_clave = ""
        if g.plan_estudio and g.plan_estudio.programa_educativo:
            lic_clave = g.plan_estudio.programa_educativo.clave

        # SEM
        periodo = f"{g.numero_periodo}°" if g.numero_periodo else "N/A"
        
        # GPO
        grupo = g.grupo or "A"
        
        # HSM
        hsm = m.hsm
        total_hsm += hsm

        rows.append(f"""
        <tr>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">{lic_clave}</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: left;">{m.nombre_asignatura.upper()}</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">{periodo}</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">{grupo}</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center; color: #dc2626;">{hsm}</td>
        </tr>
        """)

    # Fila final de totales
    rows.append(f"""
    <tr style="font-weight: bold;">
        <td colspan="4" style="border: 1px solid #000; padding: 4px; text-align: center;">TOTAL DE HORAS PROGRAMADAS</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; color: #dc2626;">{total_hsm}</td>
    </tr>
    """)

    table_style = "width: 100%; border-collapse: collapse; border: 1px solid #000; font-family: Arial, sans-serif; font-size: 11px; margin-bottom: 25px;"

    table_html = f"""
    <table style="{table_style}">
        <thead>
            <tr style="background-color: #b8cce4; font-weight: bold;">
                <th style="border: 1px solid #000; padding: 4px; width: 10%;">LIC</th>
                <th style="border: 1px solid #000; padding: 4px; width: 60%; text-align: center;">MATERIA</th>
                <th style="border: 1px solid #000; padding: 4px; width: 10%;">PDO</th>
                <th style="border: 1px solid #000; padding: 4px; width: 10%;">GPO</th>
                <th style="border: 1px solid #000; padding: 4px; width: 10%; color: #dc2626;">HSM</th>
            </tr>
        </thead>
        <tbody>
            {"".join(rows)}
        </tbody>
    </table>
    """
    return table_html

def interpolar_oficio(
    db: Session,
    contenido_html: str,
    docente: Docente,
    ciclo: CicloEscolar,
    numero_oficio: str,
    fecha_emision: datetime
) -> str:
    """Parsea y reemplaza variables dinámicas de plantilla en el string HTML crudo."""
    # Sum total HSM
    total_horas = 0
    asignaciones = db.query(AsignacionCarga).filter(
        AsignacionCarga.ciclo_escolar_id == ciclo.id,
        or_(
            (AsignacionCarga.docente_titular_id == docente.id) & (AsignacionCarga.motivo_descarga == None),
            (AsignacionCarga.docente_temporal_id == docente.id)
        )
    ).all()
    for a in asignaciones:
        if a.materia:
            total_horas += a.materia.hsm

    # Formulate variables
    nombre_docente = f"{docente.apellidos} {docente.nombre}".upper()
    categoria_docente = docente.categoria.nombre.upper() if docente.categoria else "DOCENTE"
    numero_plaza = docente.plaza or "N/A"
    
    # Render table html
    tabla_html = generar_tabla_carga_html(db, docente, ciclo)

    # Date / text values
    lugar = "Tuxtla Gutiérrez, Chiapas"
    fecha_emision_larga = format_fecha_es(fecha_emision)
    ciclo_escolar_texto = f"agosto – diciembre {ciclo.anio}" if "AGOSTO" in ciclo.nombre.upper() else f"enero – junio {ciclo.anio}"

    # Determinar tipo_docente_reporte para la cabecera de la página 2
    siglas = docente.categoria.siglas.upper() if docente.categoria and docente.categoria.siglas else ""
    if siglas == "PTC":
        tipo_docente_reporte = "Docentes de Tiempo Completo"
    elif siglas == "PMT":
        tipo_docente_reporte = "Docentes de Medio Tiempo"
    elif siglas in ["PAS", "PAT"]:
        tipo_docente_reporte = "Docentes de Asignatura"
    elif siglas == "PAE":
        tipo_docente_reporte = "Docentes de Asignatura Eventuales"
    else:
        tipo_docente_reporte = "Docentes"

    # Determinar periodo_ciclo, ej: 2026-2
    nombre_ciclo = ciclo.nombre.upper()
    periodo = "2" if "AGOSTO" in nombre_ciclo or "DICIEMBRE" in nombre_ciclo else "1"
    periodo_ciclo = f"{ciclo.anio}-{periodo}"

    html = contenido_html
    replacements = {
        "{{lugar_emision}}": lugar,
        "{{fecha_emision_larga}}": fecha_emision_larga,
        "{{ciclo_escolar_texto}}": ciclo_escolar_texto,
        "{{numero_oficio}}": numero_oficio,
        "{{nombre_docente}}": nombre_docente,
        "{{categoria_docente}}": categoria_docente,
        "{{numero_plaza}}": numero_plaza,
        "{{total_horas}}": str(total_horas),
        "{{tabla_carga_academica}}": tabla_html,
        "{{tipo_docente_reporte}}": tipo_docente_reporte,
        "{{periodo_ciclo}}": periodo_ciclo
    }

    for key, value in replacements.items():
        html = html.replace(key, value)

    return html
