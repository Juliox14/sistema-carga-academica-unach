from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from src.infrastructure.database.orm_models import Docente, AsignacionCarga, AsignacionOtraActividad, CategoriaDocente
from src.application.use_cases.ciclos_service import obtener_ciclo_activo

def generar_reporte_pad_html(
    db: Session,
    categorias: str = "ALL",
    formulo_nombre: str = "MTRA. PAOLA LOPEZ Y LOPEZ",
    formulo_puesto: str = "SECRETARIA ACADEMICA",
    vobo_nombre: str = "DRA. MARIA DE LOS ANGELES POLANCO ENCISO",
    vobo_puesto: str = "ENCARGADA DE LA DIRECCION",
    aprog_nombre: str = "DR. MANUEL GUSTAVO OCAMPO MUÑOA",
    aprog_puesto: str = "DIRECTOR GENERAL",
    apres_nombre: str = "DRA. MARIA CONCEPCION RUIZ RUIZ",
    apres_puesto: str = "DIR. DE PROGRAMACION Y PRESUPUESTO",
    apago_nombre: str = "MTRO. ROMEO ALEXANDER SALAZAR MALDONADO",
    apago_puesto: str = "DIR. DE PERSONAL Y PREST. SOCIALES"
) -> str:
    # 1. Fetch Cycle and Docentes
    ciclo = obtener_ciclo_activo(db)
    
    query = db.query(Docente)
    if categorias and categorias.upper() != "ALL":
        cat_list = [c.strip().upper() for c in categorias.split(",")]
        query = query.join(CategoriaDocente).filter(CategoriaDocente.siglas.in_(cat_list))
    docentes = query.all()
    
    docentes_validos = []
    for doc in docentes:
        # Check if they have load
        has_carga = db.query(AsignacionCarga).filter(
            or_(
                AsignacionCarga.docente_titular_id == doc.id,
                AsignacionCarga.docente_temporal_id == doc.id
            ),
            AsignacionCarga.ciclo_escolar_id == ciclo.id
        ).first() is not None
        
        has_otras = db.query(AsignacionOtraActividad).filter(
            AsignacionOtraActividad.docente_id == doc.id,
            AsignacionOtraActividad.ciclo_escolar_id == ciclo.id
        ).first() is not None
        
        if has_carga or has_otras:
            docentes_validos.append(doc)

    if not docentes_validos:
        return """<html><body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px;">
        <h2>No se encontraron docentes con carga asignada para las categorías seleccionadas.</h2>
        </body></html>"""
        
    # Helpers
    def format_horarios_dia(horarios_list, dia: str) -> str:
        slots = [h for h in horarios_list if h.dia_semana.name == dia]
        if not slots:
            return ""
        intervals = sorted([(s.hora_inicio, s.hora_fin) for s in slots], key=lambda x: x[0])
        merged = []
        for start, end in intervals:
            if not merged:
                merged.append([start, end])
            else:
                prev_start, prev_end = merged[-1]
                if start <= prev_end:
                    merged[-1][1] = max(prev_end, end)
                else:
                    merged.append([start, end])
        return "<br>".join([f"{s}:00-{e}:00" for s, e in merged])

    # Date
    meses_es = {
        1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL", 5: "MAYO", 6: "JUNIO",
        7: "JULIO", 8: "AGOSTO", 9: "SEPTIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"
    }
    today = datetime.now()
    fecha_actual_texto = f"{today.day} DE {meses_es[today.month]} DE {today.year}"
    
    # Periodo Laboral
    if "AGOSTO" in ciclo.nombre.upper() or "DICIEMBRE" in ciclo.nombre.upper():
        periodo_laboral = f"1 DE AGOSTO AL 31 DE DICIEMBRE DE {ciclo.anio}"
        ciclo_escolar_texto = f"CICLO ESCOLAR AGOSTO - DICIEMBRE DE {ciclo.anio}"
    else:
        periodo_laboral = f"1 DE ENERO AL 30 DE JUNIO DE {ciclo.anio}"
        ciclo_escolar_texto = f"CICLO ESCOLAR ENERO - JUNIO DE {ciclo.anio}"

    pages_html = []
    
    for doc in docentes_validos:
        # Load Carga frente a grupo
        doc_carga = db.query(AsignacionCarga).filter(
            or_(
                AsignacionCarga.docente_titular_id == doc.id,
                AsignacionCarga.docente_temporal_id == doc.id
            ),
            AsignacionCarga.ciclo_escolar_id == ciclo.id
        ).all()
        
        carga_grupo = [a for a in doc_carga if a.motivo_descarga is None]
        carga_descarga = [a for a in doc_carga if a.motivo_descarga is not None]
        
        # Load Otras Actividades
        doc_otras = db.query(AsignacionOtraActividad).filter(
            AsignacionOtraActividad.docente_id == doc.id,
            AsignacionOtraActividad.ciclo_escolar_id == ciclo.id
        ).all()
        
        docente_id_str = str(doc.id)
        docente_nombre = f"{doc.apellidos} {doc.nombre}".upper()
        plaza = doc.plaza or ""
        categoria = doc.categoria.nombre.upper() if doc.categoria else ""
        correo = doc.correo_institucional or ""
        
        lic_rows = []
        pos_rows = []
        total_hfg_lic = 0.0
        total_hfg_pos = 0.0
        
        idx_lic = 1
        idx_pos = 1
        
        for a in carga_grupo:
            m = a.materia
            g = a.grupo_asignado
            if not m or not g:
                continue
                
            prog_educ = g.plan_estudio.programa_educativo.clave.upper() if (g.plan_estudio and g.plan_estudio.programa_educativo) else ""
            nivel_prog = g.plan_estudio.programa_educativo.nivel.upper() if (g.plan_estudio and g.plan_estudio.programa_educativo and g.plan_estudio.programa_educativo.nivel) else "LICENCIATURA"
            
            periodo = str(g.numero_periodo or "")
            grupo = g.grupo or ""
            hsm = float(m.hsm)
            
            h_lun = format_horarios_dia(a.horarios, "LUNES")
            h_mar = format_horarios_dia(a.horarios, "MARTES")
            h_mie = format_horarios_dia(a.horarios, "MIERCOLES")
            h_jue = format_horarios_dia(a.horarios, "JUEVES")
            h_vie = format_horarios_dia(a.horarios, "VIERNES")
            h_sab = format_horarios_dia(a.horarios, "SABADO")
            h_dom = ""
            
            row_html = f"""
            <tr>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">{prog_educ}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: left;">{{idx}}.-{m.nombre_asignatura.upper()} -</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">{periodo}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">{grupo}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 7.5px;">{h_lun}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 7.5px;">{h_mar}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 7.5px;">{h_mie}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 7.5px;">{h_jue}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 7.5px;">{h_vie}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 7.5px;">{h_sab}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 7.5px;">{h_dom}</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center;">{hsm:.1f}</td>
            </tr>
            """
            
            if nivel_prog in ["POSGRADO", "MAESTRIA", "DOCTORADO", "ESPECIALIDAD"]:
                pos_rows.append(row_html.format(idx=idx_pos))
                idx_pos += 1
                total_hfg_pos += hsm
            else:
                lic_rows.append(row_html.format(idx=idx_lic))
                idx_lic += 1
                total_hfg_lic += hsm

        lic_block = ""
        if lic_rows:
            lic_block = f"""
            <div style="background-color: #d9d9d9; border: 1px solid #000; border-bottom: none; text-align: center; font-weight: bold; padding: 3px; font-size: 8px; text-transform: uppercase;">
                HORARIOS DOCENCIA FRENTE A GRUPO EN LICENCIATURA - {ciclo_escolar_texto}
            </div>
            <table class="data-table">
                <thead>
                    <tr class="bg-gray" style="font-weight: bold; text-align: center; font-size: 8px;">
                        <td style="width: 8%;">PROG. EDUC.</td>
                        <td>UNIDAD DE COMPETENCIA</td>
                        <td style="width: 3%;">PDO</td>
                        <td style="width: 3%;">G</td>
                        <td style="width: 7%;">L</td>
                        <td style="width: 7%;">M</td>
                        <td style="width: 7%;">M</td>
                        <td style="width: 7%;">J</td>
                        <td style="width: 7%;">V</td>
                        <td style="width: 7%;">S</td>
                        <td style="width: 7%;">D</td>
                        <td style="width: 4%;">H</td>
                    </tr>
                </thead>
                <tbody>
                    {"".join(lic_rows)}
                    <tr class="font-bold bg-gray">
                        <td colspan="11" class="text-right">TOTAL DE HFG:</td>
                        <td class="text-center">{total_hfg_lic:.1f}</td>
                    </tr>
                </tbody>
            </table>
            """
            
        pos_block = ""
        if pos_rows:
            pos_block = f"""
            <div style="background-color: #d9d9d9; border: 1px solid #000; border-bottom: none; text-align: center; font-weight: bold; padding: 3px; font-size: 8px; text-transform: uppercase; margin-top: 6px;">
                HORARIOS DOCENCIA FRENTE A GRUPO EN POSGRADO - {ciclo_escolar_texto}
            </div>
            <table class="data-table">
                <thead>
                    <tr class="bg-gray" style="font-weight: bold; text-align: center; font-size: 8px;">
                        <td style="width: 8%;">PROG. EDUC.</td>
                        <td>UNIDAD DE COMPETENCIA</td>
                        <td style="width: 3%;">PDO</td>
                        <td style="width: 3%;">G</td>
                        <td style="width: 7%;">L</td>
                        <td style="width: 7%;">M</td>
                        <td style="width: 7%;">M</td>
                        <td style="width: 7%;">J</td>
                        <td style="width: 7%;">V</td>
                        <td style="width: 7%;">S</td>
                        <td style="width: 7%;">D</td>
                        <td style="width: 4%;">H</td>
                    </tr>
                </thead>
                <tbody>
                    {"".join(pos_rows)}
                    <tr class="font-bold bg-gray">
                        <td colspan="11" class="text-right">TOTAL DE HPOSG:</td>
                        <td class="text-center">{total_hfg_pos:.1f}</td>
                    </tr>
                </tbody>
            </table>
            """

        otras_tabla_html = ""
        total_hoa = 0.0
        if doc_otras:
            otras_rows = []
            for act in doc_otras:
                horas = float(act.horas_asignadas)
                total_hoa += horas
                otras_rows.append(f"""
                <tr>
                    <td style="border: 1px solid #000; padding: 3px; text-align: left;">{act.actividad.nombre.upper()}</td>
                    <td style="border: 1px solid #000; padding: 3px; text-align: center; width: 7%;"></td>
                    <td style="border: 1px solid #000; padding: 3px; text-align: center; width: 7%;"></td>
                    <td style="border: 1px solid #000; padding: 3px; text-align: center; width: 7%;"></td>
                    <td style="border: 1px solid #000; padding: 3px; text-align: center; width: 7%;"></td>
                    <td style="border: 1px solid #000; padding: 3px; text-align: center; width: 7%;"></td>
                    <td style="border: 1px solid #000; padding: 3px; text-align: center; width: 7%;"></td>
                    <td style="border: 1px solid #000; padding: 3px; text-align: center; width: 4%; font-weight: bold;">{horas:.1f}</td>
                </tr>
                """)
                
            otras_tabla_html = f"""
            <div class="section-bar">HORARIOS OTRAS ACTIVIDADES</div>
            <table class="data-table">
                <thead>
                    <tr class="bg-gray" style="font-weight: bold; text-align: center; font-size: 8px;">
                        <td>ACTIVIDAD</td>
                        <td style="width: 7%;">L</td>
                        <td style="width: 7%;">M</td>
                        <td style="width: 7%;">M</td>
                        <td style="width: 7%;">J</td>
                        <td style="width: 7%;">V</td>
                        <td style="width: 7%;">S</td>
                        <td style="width: 4%;">H</td>
                    </tr>
                </thead>
                <tbody>
                    {"".join(otras_rows)}
                    <tr class="font-bold bg-gray">
                        <td colspan="7" class="text-right">TOTAL DE HOA:</td>
                        <td class="text-center">{total_hoa:.1f}</td>
                    </tr>
                </tbody>
            </table>
            """
            
        descarga_tabla_html = ""
        total_descarga = 0.0
        if carga_descarga:
            descarga_rows = []
            for a in carga_descarga:
                hsm = float(a.materia.hsm) if a.materia else 0.0
                total_descarga += hsm
                motivo = a.motivo_descarga.upper() if a.motivo_descarga else ""
                descarga_rows.append(f"""
                <tr>
                    <td style="border: 1px solid #000; padding: 3px; text-align: left;">{motivo}</td>
                    <td style="border: 1px solid #000; padding: 3px; text-align: center; width: 4%; font-weight: bold;">{hsm:.1f}</td>
                </tr>
                """)
                
            descarga_tabla_html = f"""
            <div class="section-bar">DESCARGA ACADÉMICA</div>
            <table class="data-table">
                <thead>
                    <tr class="bg-gray" style="font-weight: bold; text-align: center; font-size: 8px;">
                        <td>ACTIVIDAD QUE DESCARGA</td>
                        <td style="width: 4%;">HOA</td>
                    </tr>
                </thead>
                <tbody>
                    {"".join(descarga_rows)}
                    <tr class="font-bold bg-gray">
                        <td class="text-right">TOTAL DE HOA EN DESCARGA:</td>
                        <td class="text-center">{total_descarga:.1f}</td>
                    </tr>
                </tbody>
            </table>
            """
            
        total_general = total_hfg_lic + total_hfg_pos + total_hoa + total_descarga
        
        page = f"""
        <div class="page-container">
            <div class="content-wrap">
                <!-- Membrete -->
                <table class="header-table">
                    <tr>
                        <td style="width: 15%; text-align: left;">
                            <img src="/logo-unach-color.png" alt="Logo UNACH" style="width: 55px; height: auto;" />
                        </td>
                        <td class="header-title-container">
                            <div class="main-title">UNIVERSIDAD AUTÓNOMA DE CHIAPAS</div>
                            <div class="sub-title">DIRECCIÓN GENERAL DE DOCENCIA Y SERVICIOS ESCOLARES</div>
                            <div class="sub-title">DIRECCIÓN DE DESARROLLO DOCENTE</div>
                            <div class="sub-title">PLANEACIÓN ACADÉMICA DOCENTE (PAD)</div>
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
                        <td style="width: 40%;"><span class="font-bold">ID:</span> {docente_id_str} &nbsp;&nbsp;&nbsp; <span class="font-bold">NOMBRE:</span> {docente_nombre}</td>
                        <td style="width: 20%;"><span class="font-bold">FECHA INGRESO:</span> </td>
                        <td style="width: 20%;"><span class="font-bold">RFC:</span> </td>
                        <td style="width: 20%;"><span class="font-bold">CURP:</span> </td>
                    </tr>
                    <tr>
                        <td><span class="font-bold">PLAZA:</span> {plaza}</td>
                        <td><span class="font-bold">CATEGORIA:</span> {categoria}</td>
                        <td><span class="font-bold">CORREO:</span> {correo}</td>
                        <td><span class="font-bold">SINDICATO:</span> </td>
                    </tr>
                    <tr>
                        <td colspan="2"><span class="font-bold">PERIODO LABORAL:</span> {periodo_laboral}</td>
                        <td colspan="2"><span class="font-bold">RECONOCIMIENTOS:</span> </td>
                    </tr>
                    <tr>
                        <td colspan="2"><span class="font-bold">PERFIL ACADEMICO:</span> </td>
                        <td colspan="2"><span class="font-bold">ULTIMO GRADO DE ESTUDIO:</span> </td>
                    </tr>
                </table>

                <!-- CARGA ACADEMICA DOCENTE -->
                <div class="section-bar">CARGA ACADÉMICA DOCENTE</div>
                
                {lic_block}
                {pos_block}
                {otras_tabla_html}
                {descarga_tabla_html}

                <table class="data-table" style="margin-top: 4px;">
                    <tr class="font-bold" style="background-color: #d9d9d9; font-size: 9.5px;">
                        <td class="text-right">TOTAL DE HORAS:</td>
                        <td class="text-center" style="width: 4%; font-weight: bold;">{total_general:.1f}</td>
                    </tr>
                </table>
            </div>

            <div class="footer-wrap">
                <!-- Tabla de Firmas de Autorización -->
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center; font-size: 7.5px; border: 1px solid #000;">
                        <td style="border: 1px solid #000; width: 16.6%;">DOCENTE</td>
                        <td style="border: 1px solid #000; width: 16.6%;">FORMULO</td>
                        <td style="border: 1px solid #000; width: 16.6%;">VO. BO.</td>
                        <td style="border: 1px solid #000; width: 16.6%;">AUTORIZACION PROGRAMATICA</td>
                        <td style="border: 1px solid #000; width: 16.6%;">AUTORIZACION PRESUPUESTAL</td>
                        <td style="border: 1px solid #000; width: 16.6%;">AUTORIZACION DE PAGO</td>
                    </tr>
                    <tr style="text-align: center; font-size: 8px; height: 35px; border: 1px solid #000; vertical-align: bottom; font-weight: bold;">
                        <td style="border: 1px solid #000; padding-bottom: 4px; text-transform: uppercase;">{docente_nombre}</td>
                        <td style="border: 1px solid #000; padding-bottom: 4px; text-transform: uppercase;">{formulo_nombre}</td>
                        <td style="border: 1px solid #000; padding-bottom: 4px; text-transform: uppercase;">{vobo_nombre}</td>
                        <td style="border: 1px solid #000; padding-bottom: 4px; text-transform: uppercase;">{aprog_nombre}</td>
                        <td style="border: 1px solid #000; padding-bottom: 4px; text-transform: uppercase;">{apres_nombre}</td>
                        <td style="border: 1px solid #000; padding-bottom: 4px; text-transform: uppercase;">{apago_nombre}</td>
                    </tr>
                    <tr style="text-align: center; font-size: 7.2px; border: 1px solid #000; font-weight: bold; color: #333; text-transform: uppercase;">
                        <td style="border: 1px solid #000; padding: 2.5px;">DOCENTE</td>
                        <td style="border: 1px solid #000; padding: 2.5px;">{formulo_puesto}</td>
                        <td style="border: 1px solid #000; padding: 2.5px;">{vobo_puesto}</td>
                        <td style="border: 1px solid #000; padding: 2.5px;">{aprog_puesto}</td>
                        <td style="border: 1px solid #000; padding: 2.5px;">{apres_puesto}</td>
                        <td style="border: 1px solid #000; padding: 2.5px;">{apago_puesto}</td>
                    </tr>
                </table>

                <!-- Footer Notes -->
                <div class="footer-note">
                    PDO: PERIODO, G: GRUPO, HT: HORAS TEÓRICAS, HP: HORAS PRÁCTICAS, HD: HORAS DEFINITIVAS; G: GRUPO, HT: HORAS TEÓRICAS, HP: HORAS PRÁCTICAS, L.S.C.: LICENCIATURA EN SISTEMAS COMPUTACIONALES, L.D.T.S.: LICENCIATURA EN DESARROLLO DE TECNOLOGÍAS DE SOFTWARE.
                </div>

                <!-- Date and Page -->
                <div class="footer-date-page">
                    <div>{fecha_actual_texto}</div>
                    <div>PAGINA 1 DE 1</div>
                </div>
            </div>
        </div>
        """
        pages_html.append(page)
        
    # Combined HTML Document
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Planeación Académica Docente (PAD)</title>
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
            padding: 8mm 12mm 8mm 12mm;
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
            margin-bottom: 4px;
        }}
        .header-table td {{
            vertical-align: middle;
            border: none;
        }}
        .header-title-container {{
            text-align: center;
            line-height: 1.2;
            color: #000;
        }}
        .main-title {{
            font-weight: bold;
            font-size: 13px;
            letter-spacing: 0.2px;
        }}
        .sub-title {{
            font-weight: bold;
            font-size: 9.5px;
        }}
        .header-code {{
            text-align: right;
            font-size: 8px;
            font-weight: bold;
            line-height: 1.25;
            width: 15%;
        }}
        .section-bar {{
            background-color: #555555;
            color: #fff;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            padding: 3.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 5px;
            margin-bottom: 3px;
        }}
        .data-table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }}
        .data-table td {{
            border: 1px solid #000;
            padding: 3px 4px;
            vertical-align: middle;
            font-size: 8px;
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
            font-size: 7px;
            line-height: 1.3;
            margin-top: 6px;
            color: #000;
            border-top: 1.2px solid #000;
            padding-top: 4px;
            text-align: justify;
        }}
        .footer-date-page {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 7.5px;
            font-weight: bold;
            margin-top: 5px;
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
    {"".join(pages_html)}
</body>
</html>
"""
    return html
