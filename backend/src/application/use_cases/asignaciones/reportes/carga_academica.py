from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from src.infrastructure.database.orm_models import Docente, AsignacionCarga, AsignacionOtraActividad
from src.application.use_cases.ciclos_service import obtener_ciclo_activo

def generar_reporte_carga_html(db: Session, docente_id: int) -> str:
    # 1. Query Docente
    docente = db.query(Docente).filter(Docente.id == docente_id).first()
    if not docente:
        return "<h1>Docente no encontrado</h1>"
        
    ciclo = obtener_ciclo_activo(db)
    
    # 2. Query Asignaciones Carga (Frente a grupo)
    asignaciones_carga = db.query(AsignacionCarga).filter(
        or_(
            AsignacionCarga.docente_titular_id == docente_id,
            AsignacionCarga.docente_temporal_id == docente_id
        ),
        AsignacionCarga.ciclo_escolar_id == ciclo.id,
        AsignacionCarga.motivo_descarga.is_(None) # solo frente a grupo
    ).all()
    
    # 3. Query Asignaciones Otras Actividades
    otras_actividades = db.query(AsignacionOtraActividad).filter(
        AsignacionOtraActividad.docente_id == docente_id,
        AsignacionOtraActividad.ciclo_escolar_id == ciclo.id
    ).all()
    
    # 4. Formulate General Data
    docente_id_str = str(docente.id)
    docente_nombre = f"{docente.apellidos} {docente.nombre}".upper()
    plaza = docente.plaza or ""
    categoria = docente.categoria.nombre.upper() if docente.categoria else ""
    rfc = (docente.rfc or "").upper()
    curp = (docente.curp or "").upper()
    fecha_ingreso = docente.fecha_ingreso.strftime("%d/%m/%Y") if docente.fecha_ingreso else ""
    perfil_academico = (docente.perfil_academico or "").upper()
    ultimo_grado_estudio = (docente.ultimo_grado_estudio or "").upper()
    
    # Periodo Laboral
    if "AGOSTO" in ciclo.nombre.upper() or "DICIEMBRE" in ciclo.nombre.upper():
        periodo_laboral = f"1 DE AGOSTO AL 31 DE DICIEMBRE DE {ciclo.anio}"
        ciclo_escolar_texto = f"CICLO ESCOLAR AGOSTO - DICIEMBRE DE {ciclo.anio}"
    else:
        periodo_laboral = f"1 DE ENERO AL 30 DE JUNIO DE {ciclo.anio}"
        ciclo_escolar_texto = f"CICLO ESCOLAR ENERO - JUNIO DE {ciclo.anio}"
        
    # 5. Build Carga frente a grupo rows (Standard linear format)
    carga_rows = []
    total_hfg = 0.0
    for idx, a in enumerate(asignaciones_carga, 1):
        m = a.materia
        g = a.grupo_asignado
        if not m or not g:
            continue
            
        prog_educ = g.plan_estudio.programa_educativo.clave.upper() if (g.plan_estudio and g.plan_estudio.programa_educativo) else ""
        periodo = str(g.numero_periodo or "")
        grupo = g.grupo or ""
        hsm = float(m.hsm)
        total_hfg += hsm
        
        carga_rows.append(f"""
        <tr>
            <td style="border: 1px solid #000; padding: 3.5px 5px; text-align: center; font-size: 8.5px;">{prog_educ}</td>
            <td style="border: 1px solid #000; padding: 3.5px 5px; text-align: left; font-size: 8.5px;">{idx}.-{m.nombre_asignatura.upper()} -</td>
            <td style="border: 1px solid #000; padding: 3.5px 5px; text-align: center; font-size: 8.5px;">{periodo}</td>
            <td style="border: 1px solid #000; padding: 3.5px 5px; text-align: center; font-size: 8.5px;">{grupo}</td>
            <td style="border: 1px solid #000; padding: 3.5px 5px; text-align: center; font-size: 8.5px;">{hsm:.1f}</td>
        </tr>
        """)
        
    if not carga_rows:
        carga_rows.append("""
        <tr>
            <td colspan="5" style="border: 1px solid #000; padding: 6px; text-align: center; color: #888;">SIN ASIGNATURAS FRENTE A GRUPO</td>
        </tr>
        """)
        
    # 6. Build Otras Actividades rows
    otras_tabla_html = ""
    total_hoa = 0.0
    if otras_actividades:
        otras_rows = []
        for act in otras_actividades:
            horas = float(act.horas_asignadas)
            total_hoa += horas
            otras_rows.append(f"""
            <tr>
                <td style="border: 1px solid #000; padding: 3.5px 5px; text-align: left; font-size: 8.5px;">{act.actividad.nombre.upper()}</td>
                <td style="border: 1px solid #000; padding: 3.5px 5px; text-align: center; width: 10%; font-size: 8.5px; font-weight: bold;">{horas:.1f}</td>
            </tr>
            """)
            
        total_general = total_hfg + total_hoa
        otras_tabla_html = f"""
        <!-- HORARIOS OTRAS ACTIVIDADES -->
        <div class="section-bar">HORARIOS OTRAS ACTIVIDADES</div>
        <table class="data-table">
            <thead>
                <tr class="bg-gray" style="font-weight: bold; text-align: center; font-size: 8.5px;">
                    <td>ACTIVIDAD</td>
                    <td style="width: 10%;">H</td>
                </tr>
            </thead>
            <tbody>
                {"".join(otras_rows)}
                <tr class="font-bold bg-gray">
                    <td class="text-right">TOTAL DE HOA:</td>
                    <td class="text-center">{total_hoa:.1f}</td>
                </tr>
                <tr class="font-bold" style="background-color: #d9d9d9; font-size: 9.5px;">
                    <td class="text-right">TOTAL DE HORAS:</td>
                    <td class="text-center">{total_general:.1f}</td>
                </tr>
            </tbody>
        </table>
        """
        
    # 7. Formulate Current Date in Spanish
    meses_es = {
        1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL", 5: "MAYO", 6: "JUNIO",
        7: "JULIO", 8: "AGOSTO", 9: "SEPTIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"
    }
    today = datetime.now()
    fecha_actual_texto = f"{today.day} DE {meses_es[today.month]} DE {today.year}"
    
    # 8. HTML Template
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Carga Académica - {docente_nombre}</title>
    <style>
        * {{
            font-family: Arial, sans-serif;
            box-sizing: border-box;
        }}
        @page {{
            size: letter landscape;
            margin: 0;
        }}
        html, body {{
            margin: 0;
            padding: 0;
            width: 279.4mm;
            height: 215.9mm;
            background-color: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}
        .page-container {{
            width: 279.4mm;
            height: 215.9mm;
            padding: 10mm 15mm 10mm 15mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background-color: #fff;
        }}
        .content-wrap {{
            width: 100%;
        }}
        .footer-wrap {{
            width: 100%;
        }}
        .header-table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }}
        .header-table td {{
            vertical-align: middle;
            border: none;
        }}
        .header-title-container {{
            text-align: center;
            line-height: 1.25;
            color: #000;
        }}
        .main-title {{
            font-weight: bold;
            font-size: 13.5px;
            letter-spacing: 0.25px;
        }}
        .sub-title {{
            font-weight: bold;
            font-size: 10.5px;
        }}
        .header-code {{
            text-align: right;
            font-size: 8.5px;
            font-weight: bold;
            line-height: 1.3;
            width: 15%;
        }}
        .section-bar {{
            background-color: #555555;
            color: #fff;
            text-align: center;
            font-weight: bold;
            font-size: 10.5px;
            padding: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 6px;
            margin-bottom: 4px;
        }}
        .data-table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }}
        .data-table td {{
            border: 1px solid #000;
            padding: 3.5px 5px;
            vertical-align: middle;
            font-size: 8.5px;
        }}
        .bg-gray {{
            background-color: #f2f2f2;
        }}
        .text-center {{
            text-align: center;
        }}
        .text-right {{
            text-align: right;
        }}
        .font-bold {{
            font-weight: bold;
        }}
        .footer-note {{
            font-size: 7.2px;
            line-height: 1.35;
            margin-top: 10px;
            color: #000;
            border-top: 1.2px solid #000;
            padding-top: 4px;
            text-align: justify;
        }}
        .footer-date-page {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8px;
            font-weight: bold;
            margin-top: 6px;
        }}
        @media print {{
            html, body {{
                width: 279.4mm;
                height: 215.9mm;
            }}
            .page-container {{
                width: 279.4mm;
                height: 215.9mm;
                page-break-after: always;
                page-break-inside: avoid;
            }}
        }}
    </style>
</head>
<body onload="window.print()">
    <div class="page-container">
        <div class="content-wrap">
            <!-- Membrete -->
            <table class="header-table">
                <tr>
                    <td style="width: 15%; text-align: left;">
                        <img src="/logo-unach-color.png" alt="Logo UNACH" style="width: 60px; height: auto;" />
                    </td>
                    <td class="header-title-container">
                        <div class="main-title">UNIVERSIDAD AUTÓNOMA DE CHIAPAS</div>
                        <div class="sub-title">DIRECCIÓN GENERAL DE DOCENCIA Y SERVICIOS ESCOLARES</div>
                        <div class="sub-title">DIRECCIÓN DE DESARROLLO DOCENTE</div>
                        <div class="sub-title">REPORTE DE CARGAS ACADÉMICAS</div>
                        <div class="sub-title">ESCUELA DE TECNOLOGÍAS DIGITALES APLICADAS, CAMPUS I</div>
                        <div class="sub-title">{ciclo_escolar_texto}</div>
                    </td>
                    <td class="header-code">
                        Código: FO-634-14-07<br>
                        Revisión: 00
                    </td>
                </tr>
            </table>

            <!-- DATOS GENERALES -->
            <div class="section-bar">DATOS GENERALES</div>
            <table class="data-table">
                <tr>
                    <td style="width: 50%;"><span class="font-bold">ID:</span> {docente_id_str} &nbsp;&nbsp;&nbsp; <span class="font-bold">NOMBRE:</span> {docente_nombre}</td>
                    <td style="width: 25%;"><span class="font-bold">RFC:</span> {rfc}</td>
                    <td style="width: 25%;"><span class="font-bold">CURP:</span> {curp}</td>
                </tr>
                <tr>
                    <td><span class="font-bold">PLAZA:</span> {plaza}</td>
                    <td><span class="font-bold">CATEGORIA:</span> {categoria}</td>
                    <td><span class="font-bold">FECHA INGRESO:</span> {fecha_ingreso}</td>
                </tr>
                <tr>
                    <td colspan="3"><span class="font-bold">PERIODO LABORAL:</span> {periodo_laboral}</td>
                </tr>
                <tr>
                    <td colspan="1.5"><span class="font-bold">PERFIL ACADÉMICO:</span> {perfil_academico}</td>
                    <td colspan="1.5"><span class="font-bold">ÚLTIMO GRADO DE ESTUDIO:</span> {ultimo_grado_estudio}</td>
                </tr>
            </table>

            <!-- CARGA ACADEMICA DOCENTE -->
            <div class="section-bar">CARGA ACADÉMICA DOCENTE</div>
            <table class="data-table">
                <thead>
                    <tr class="bg-gray" style="font-weight: bold; text-align: center;">
                        <td style="width: 12%;">PROG. EDUC.</td>
                        <td>UNIDAD DE COMPETENCIA</td>
                        <td style="width: 8%;">S</td>
                        <td style="width: 8%;">G</td>
                        <td style="width: 8%;">H</td>
                    </tr>
                </thead>
                <tbody>
                    {"".join(carga_rows)}
                    <tr class="font-bold bg-gray">
                        <td colspan="4" class="text-right">TOTAL DE HFG:</td>
                        <td class="text-center">{total_hfg:.1f}</td>
                    </tr>
                </tbody>
            </table>

            {otras_tabla_html}
        </div>

        <div class="footer-wrap">
            <!-- Footer Notes -->
            <div class="footer-note">
                S: SEMESTRE, G: GRUPO, HT: HORAS TEÓRICAS, HP: HORAS PRÁCTICAS, HD: HORAS DEFINITIVAS; SEMESTRE, G: GRUPO, HT: HORAS TEÓRICAS, HP: HORAS PRÁCTICAS, L.S.C.: LICENCIATURA EN SISTEMAS COMPUTACIONALES, L.D.T.S.: LICENCIATURA EN DESARROLLO DE TECNOLOGÍAS DE SOFTWARE.
            </div>

            <!-- Date and Page -->
            <div class="footer-date-page">
                <div>{fecha_actual_texto}</div>
                <div>PAGINA 1 DE 1</div>
            </div>
        </div>
    </div>
</body>
</html>
"""
    return html
