from typing import Optional, List
import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import (
    PlantillaOficio, OficioDocente, Docente, EstadoOficio, TipoContratoOficio, Usuario, CategoriaDocente, CicloEscolar
)
from src.application.use_cases.ciclos_service import obtener_ciclo_activo
from src.infrastructure.api.schemas.oficios_schema import PlantillaOficioCreate
from src.application.use_cases.oficios.parser import interpolar_oficio
from src.infrastructure.security import verify_password

def compilar_oficio_html(data: PlantillaOficioCreate) -> str:
    # Encabezado membretado fijo UNACH con márgenes negativos para expandirse
    header_html = """
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #002d55; padding-bottom: 10px; margin-bottom: 20px; margin-left: -10mm; margin-right: -10mm;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <img src="/logo-unach-color.png" alt="UNACH Shield" style="width: 50px; height: 50px; object-fit: contain;" />
            <div style="font-family: Arial, sans-serif; text-align: left; line-height: 1.2;">
                <strong style="font-size: 13px; color: #002d55; display: block; letter-spacing: 0.5px;">UNIVERSIDAD AUTÓNOMA DE CHIAPAS</strong>
                <span style="font-size: 11px; color: #555; font-weight: bold;">Escuela de Tecnologías Digitales Aplicadas Campus I</span>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
            <img src="/edu-transforma.png" alt="UNACH Transforma" style="width: 140px; object-fit: contain;" />
        </div>
    </div>
    """
    
    # Pie de página membretado fijo a 15mm del borde inferior
    footer_html = """
    <div style="position: absolute; bottom: 15mm; left: 15mm; right: 15mm; border-top: 3px solid #A8C200; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-family: Arial, sans-serif; font-size: 9px; color: #555;">
        <div style="line-height: 1.3; text-transform: uppercase; font-weight: bold; color: #002d55;">
            BOULEVARD DR. BELISARIO DOMÍNGUEZ, KM 1081, SIN NÚMERO/TERÁN, TUXTLA GUTIÉRREZ, MÉXICO<br>
            C.P. 29050 / TELÉFONOS 961 615 1326, 961 615 4249 Ext: 101
        </div>
        <div style="font-size: 14px; font-weight: bold; color: #002d55;">
            unach.mx
        </div>
    </div>
    """
    
    # CSS de impresión integrado para mantener la consistencia en el portal de firmas y previews
    style_block = """
    <style>
      @page {
        size: letter;
        margin: 0mm;
      }
      body {
        margin: 0;
        padding: 0;
        background-color: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page-container {
        box-sizing: border-box;
        width: 215.9mm;
        height: 279.4mm;
        padding: 10mm 25mm 10mm 25mm;
        position: relative;
        background-color: #fff;
        color: #000;
        font-family: Arial, sans-serif;
      }
      @media print {
        .page-container {
          page-break-after: always;
          page-break-inside: avoid;
        }
      }
    </style>
    """
    
    # ─── PÁGINA 1: OFICIO DE ENVÍO ───
    destinatarios_html = data.destinatarios.replace("\n", "<br>") if data.destinatarios else ""
    despedida_html = data.despedida.replace("\n", "<br>") if data.despedida else ""
    con_copia_para_html = data.con_copia_para.replace("\n", "<br>") if data.con_copia_para else ""
    
    page1 = f"""
    <div class="page-container">
        {header_html}
        
        <div style="text-align: right; margin-bottom: 20px; font-weight: bold; font-family: Arial, sans-serif;">
            <span style="font-size: 14px; color: #002d55; display: block; margin-bottom: 5px;">SECRETARÍA ACADÉMICA</span>
            <span style="font-weight: normal; font-size: 11px; color: #444; line-height: 1.4; display: block;">
                {data.lugar_emision};<br>
                {{{{fecha_emision_larga}}}}<br>
                <strong>Oficio No.</strong> {{{{numero_oficio}}}}
            </span>
        </div>
        
        <div style="text-align: right; margin-bottom: 20px; font-size: 11px; font-family: Arial, sans-serif; line-height: 1.4;">
            <strong>ASUNTO:</strong> {data.asunto}<br>
            <strong>CICLO:</strong> {{{{ciclo_escolar_texto}}}}
        </div>
        
        <div style="margin-bottom: 20px; line-height: 1.4; font-family: Arial, sans-serif; text-transform: uppercase; font-size: 11px; font-weight: bold; color: #111;">
            {destinatarios_html}
        </div>
        
        <div style="text-align: justify; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5;">
            {data.cuerpo_html}
        </div>
        
        <div style="margin-bottom: 20px; font-family: Arial, sans-serif; line-height: 1.4; font-size: 11px;">
            <strong>{despedida_html}</strong><br><br><br><br>
            <strong>{data.remitente_nombre}</strong><br>
            <span style="font-size: 10px; color: #555; text-transform: uppercase;">{data.remitente_cargo}</span>
        </div>
        
        {f'<div style="position: absolute; bottom: 30mm; left: 15mm; font-family: Arial, sans-serif; font-size: 8px; line-height: 1.3; color: #000;">{con_copia_para_html}</div>' if con_copia_para_html else ''}
        
        {footer_html}
    </div>
    """
    
    # ─── PÁGINA 2: PLANEACIÓN ACADÉMICA DOCENTE ───
    page2 = f"""
    <div class="page-container">
        {header_html}
        
        <div style="text-align: right; margin-bottom: 20px; font-family: Arial, sans-serif; line-height: 1.3;">
            <strong style="font-size: 14px; color: #000; display: block;">SECRETARÍA ACADÉMICA</strong>
            <span style="font-size: 11px; color: #000; display: block;">Área de Logística Académica</span>
            <span style="font-size: 11px; color: #000; display: block;">Tuxtla Gutiérrez, Chiapas a {{{{fecha_emision_larga}}}}</span>
        </div>
        
        <div style="text-align: right; margin-bottom: 30px; font-family: Arial, sans-serif; line-height: 1.3;">
            <strong style="font-size: 11px; color: #000; display: block;">Planeación Académica Docente ({{{{ciclo_escolar_texto}}}})</strong>
            <strong style="font-size: 11px; color: #000; display: block;">{{{{tipo_docente_reporte}}}}</strong>
        </div>
        
        <div style="margin-bottom: 15px; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #000;">
            <strong>Docente:</strong> {{{{nombre_docente}}}}<br>
            <strong>Categoría:</strong> {{{{categoria_docente}}}}<br>
            <strong>Plaza:</strong> {{{{numero_plaza}}}}<br>
            Horas totales programadas: <strong>{{{{total_horas}}}}</strong><br>
            <strong>Carga académica programada {{{{periodo_ciclo}}}}:</strong>
        </div>
        
        {{{{tabla_carga_academica}}}}
        
        <p style="font-size: 11px; color: #000; text-align: justify; margin-bottom: 60px; font-family: Arial, sans-serif; line-height: 1.4;">
            Las Unidades de Competencia indicadas con anterioridad, pueden estar sujetas a cambios por necesidades académicas.
        </p>
        
        <div style="text-align: right; font-family: Arial, sans-serif; font-size: 11px; color: #000;">
            Área de Logística Académica ETDA C-I
        </div>
        
        <div style="position: absolute; bottom: 30mm; left: 15mm; font-family: Arial, sans-serif; font-size: 8px; line-height: 1.3; color: #000;">
            C.c.p. C. Dra. María de los Ángeles Polanco Enciso.- Encargada de la Dirección de la ETDA C-I.- Para superior conocimiento.-Edificio<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Archivo/Minutario<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*PLL/gam.
        </div>
        
        {footer_html}
    </div>
    """
    
    return style_block + page1 + page2

def obtener_plantillas(db: Session, unidad_id: int | None = None):
    """Lista todas las plantillas disponibles para la unidad actual o globales."""
    q = db.query(PlantillaOficio)
    if unidad_id is not None:
        q = q.filter((PlantillaOficio.unidad_academica_id == unidad_id) | (PlantillaOficio.unidad_academica_id.is_(None)))
    return q.all()

def crear_plantilla(db: Session, data: PlantillaOficioCreate, unidad_id: int | None = None) -> PlantillaOficio:
    """Crea una nueva plantilla compilando su HTML a partir de campos estructurados."""
    compilado = compilar_oficio_html(data)
    nueva = PlantillaOficio(
        nombre=data.nombre,
        tipos_contrato=",".join(data.tipos_contrato),
        contenido_html=compilado,
        requiere_firma=data.requiere_firma,
        es_activa=False,
        lugar_emision=data.lugar_emision,
        asunto=data.asunto,
        destinatarios=data.destinatarios,
        cuerpo_html=data.cuerpo_html,
        despedida=data.despedida,
        remitente_nombre=data.remitente_nombre,
        remitente_cargo=data.remitente_cargo,
        con_copia_para=data.con_copia_para,
        unidad_academica_id=unidad_id
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

def activar_plantilla(db: Session, plantilla_id: int) -> PlantillaOficio:
    """Activa una plantilla y desactiva todas las demás que tengan algún tipo de contrato en común."""
    plantilla = db.query(PlantillaOficio).filter(PlantillaOficio.id == plantilla_id).first()
    if not plantilla:
        raise ValueError("La plantilla no existe")
    
    # Desactivar otras plantillas activas que colisionen en algún tipo de contrato
    tipos_esta_plantilla = set(plantilla.tipos_contrato.split(',')) if plantilla.tipos_contrato else set()
    
    plantillas_activas = db.query(PlantillaOficio).filter(
        PlantillaOficio.es_activa == True,
        PlantillaOficio.id != plantilla_id
    ).all()
    
    for pa in plantillas_activas:
        tipos_pa = set(pa.tipos_contrato.split(',')) if pa.tipos_contrato else set()
        if tipos_esta_plantilla.intersection(tipos_pa):
            pa.es_activa = False
            
    plantilla.es_activa = True
    db.commit()
    db.refresh(plantilla)
    return plantilla

def actualizar_plantilla(db: Session, plantilla_id: int, data: PlantillaOficioCreate) -> PlantillaOficio:
    """Actualiza una plantilla existente y recompila su contenido HTML."""
    plantilla = db.query(PlantillaOficio).filter(PlantillaOficio.id == plantilla_id).first()
    if not plantilla:
        raise ValueError("La plantilla no existe")
    
    compilado = compilar_oficio_html(data)
    
    plantilla.nombre = data.nombre
    plantilla.tipos_contrato = ",".join(data.tipos_contrato)
    plantilla.contenido_html = compilado
    plantilla.requiere_firma = data.requiere_firma
    plantilla.lugar_emision = data.lugar_emision
    plantilla.asunto = data.asunto
    plantilla.destinatarios = data.destinatarios
    plantilla.cuerpo_html = data.cuerpo_html
    plantilla.despedida = data.despedida
    plantilla.remitente_nombre = data.remitente_nombre
    plantilla.remitente_cargo = data.remitente_cargo
    plantilla.con_copia_para = data.con_copia_para
    
    db.commit()
    db.refresh(plantilla)
    return plantilla

def eliminar_plantilla(db: Session, plantilla_id: int) -> None:
    """Elimina una plantilla, bloqueando si está siendo utilizada en oficios emitidos."""
    plantilla = db.query(PlantillaOficio).filter(PlantillaOficio.id == plantilla_id).first()
    if not plantilla:
        raise ValueError("La plantilla no existe")
        
    oficios_asociados = db.query(OficioDocente).filter(OficioDocente.plantilla_id == plantilla_id).first()
    if oficios_asociados:
        raise ValueError("No se puede eliminar esta plantilla porque ya existen oficios emitidos que la utilizan.")
        
    db.delete(plantilla)
    db.commit()


def emitir_oficios_ciclo(
    db: Session, 
    categorias_siglas: Optional[List[str]] = None,
    folio_prefijo: Optional[str] = None,
    folio_inicial: Optional[int] = None,
    folio_sufijo: Optional[str] = None,
    unidad_id: int | None = None
) -> int:
    """Genera oficios en lote para todos los docentes activos en el ciclo activo, opcionalmente filtrados por siglas de categoría."""
    ciclo = obtener_ciclo_activo(db)
    if not ciclo:
        raise ValueError("No hay un ciclo escolar activo registrado en el sistema")

    # Validar secuenciación de fases de publicación
    if categorias_siglas:
        filtro_cats = [c.upper() for c in categorias_siglas]
        
        # Si se intenta emitir la Fase 2 (PAS, PAT)
        if any(c in ["PAS", "PAT"] for c in filtro_cats):
            # Verificar si existen docentes de Fase 1
            fase1_docentes_exist = db.query(Docente).join(CategoriaDocente).filter(
                CategoriaDocente.siglas.in_(["PTC", "PMT"])
            ).first()
            if fase1_docentes_exist:
                # Verificar si se han emitido oficios para Fase 1 en este ciclo
                fase1_oficios = db.query(OficioDocente).join(Docente).join(CategoriaDocente).filter(
                    OficioDocente.ciclo_id == ciclo.id,
                    CategoriaDocente.siglas.in_(["PTC", "PMT"])
                ).all()
                if not fase1_oficios:
                    raise ValueError(
                        "No se puede realizar la publicación de la Fase 2 (PAS & PAT) "
                        "porque la Fase 1 (PTC & PMT) aún no ha sido publicada en este ciclo."
                    )
                # Verificar si todos están firmados
                fase1_unsigned = [o for o in fase1_oficios if o.estado != EstadoOficio.FIRMADO]
                if fase1_unsigned:
                    raise ValueError(
                        f"No se puede realizar la publicación de la Fase 2 porque existen "
                        f"{len(fase1_unsigned)} oficios de la Fase 1 (PTC & PMT) pendientes de firma de conformidad."
                    )
                    
        # Si se intenta emitir la Fase 3 (PAE)
        if "PAE" in filtro_cats:
            # Verificar si existen docentes de Fase 2
            fase2_docentes_exist = db.query(Docente).join(CategoriaDocente).filter(
                CategoriaDocente.siglas.in_(["PAS", "PAT"])
            ).first()
            if fase2_docentes_exist:
                # Verificar si se han emitido oficios para Fase 2 en este ciclo
                fase2_oficios = db.query(OficioDocente).join(Docente).join(CategoriaDocente).filter(
                    OficioDocente.ciclo_id == ciclo.id,
                    CategoriaDocente.siglas.in_(["PAS", "PAT"])
                ).all()
                if not fase2_oficios:
                    raise ValueError(
                        "No se puede realizar la publicación de la Fase 3 (PAE) "
                        "porque la Fase 2 (PAS & PAT) aún no ha sido publicada en este ciclo."
                    )
                # Verificar si todos están firmados
                fase2_unsigned = [o for o in fase2_oficios if o.estado != EstadoOficio.FIRMADO]
                if fase2_unsigned:
                    raise ValueError(
                        f"No se puede realizar la publicación de la Fase 3 porque existen "
                        f"{len(fase2_unsigned)} oficios de la Fase 2 (PAS & PAT) pendientes de firma de conformidad."
                    )
    
    # Fetch active teachers
    docentes = db.query(Docente).all()
    
    # Fetch active templates
    plantillas_activas = db.query(PlantillaOficio).filter(PlantillaOficio.es_activa == True).all()
    mapa_plantillas = {}
    for p in plantillas_activas:
        if p.tipos_contrato:
            for tc in p.tipos_contrato.split(','):
                mapa_plantillas[tc] = p

    total_emitidos = 0
    anio_corto = str(ciclo.anio)[2:]
    
    # Resolver prefijo, sufijo y número secuencial inicial
    prefijo = folio_prefijo if folio_prefijo is not None else "D/SA/"
    sufijo = folio_sufijo if folio_sufijo is not None else f"/{anio_corto}"
    
    if folio_inicial is not None:
        secuencia_base = folio_inicial
    else:
        # Obtener el folio máximo existente para evitar colisiones por huecos de eliminación
        oficios_existentes = db.query(OficioDocente.numero_oficio).all()
        max_seq = 0
        for (num,) in oficios_existentes:
            try:
                # Formato esperado: D/SA/XXX/YY
                parts = num.split('/')
                if len(parts) >= 3:
                    seq = int(parts[2])
                    if seq > max_seq:
                        max_seq = seq
            except Exception:
                continue
        secuencia_base = max_seq + 1

    # Parse and capitalize filter categories if provided
    filtro_cats = [c.upper() for c in categorias_siglas] if categorias_siglas else None

    for d in docentes:
        # Get category siglas (PTC, PMT, PAS, PAT, PAE)
        if not d.categoria or not d.categoria.siglas:
            continue
        
        siglas = d.categoria.siglas.upper()
        
        # Filtrar si se proporcionó una lista de categorías
        if filtro_cats and siglas not in filtro_cats:
            continue
            
        if siglas not in mapa_plantillas:
            continue
        
        plantilla = mapa_plantillas[siglas]

        # Check if an oficio already exists for this teacher in this cycle
        oficio_existente = db.query(OficioDocente).filter(
            OficioDocente.docente_id == d.id,
            OficioDocente.ciclo_id == ciclo.id
        ).first()

        if oficio_existente:
            continue  # Skip to avoid duplicate generation

        # Generate unique folio sequence using local counter
        secuencia = secuencia_base + total_emitidos
        numero_oficio = f"{prefijo}{secuencia:03d}{sufijo}"

        # Verificar si el folio generado ya está en uso en el sistema para evitar IntegrityError
        folio_usado = db.query(OficioDocente).filter(OficioDocente.numero_oficio == numero_oficio).first()
        if folio_usado:
            raise ValueError(
                f"El número de oficio '{numero_oficio}' ya existe en el sistema. "
                "Por favor, selecciona un número de folio inicial diferente para evitar colisiones."
            )

        nuevo_oficio = OficioDocente(
            docente_id=d.id,
            ciclo_id=ciclo.id,
            plantilla_id=plantilla.id,
            estado=EstadoOficio.EMITIDO,
            numero_oficio=numero_oficio,
            fecha_emision=datetime.now(timezone.utc),
            unidad_academica_id=unidad_id 
        )
        db.add(nuevo_oficio)
        total_emitidos += 1

    db.commit()
    return total_emitidos

def obtener_oficios_emitidos(db: Session, ciclo_id: int, unidad_id: int | None = None):
    """Retorna todos los oficios emitidos en un ciclo, con su detalle."""
    q = db.query(OficioDocente).filter(OficioDocente.ciclo_id == ciclo_id)
    if unidad_id is not None:
        q = q.filter(OficioDocente.unidad_academica_id == unidad_id)
    oficios = q.all()
    for o in oficios:
        # Interpolate content dynamically on read
        o.docente_nombre = f"{o.docente.apellidos} {o.docente.nombre}".upper() if o.docente else "N/A"
        o.ciclo_nombre = o.ciclo_escolar.nombre if o.ciclo_escolar else "N/A"
        o.plantilla_nombre = o.plantilla.nombre if o.plantilla else "N/A"
        o.requiere_firma = o.plantilla.requiere_firma if o.plantilla else False
        o.tipo_contrato = o.docente.categoria.siglas if o.docente and o.docente.categoria else None
    return oficios

def _populate_oficio_response(db: Session, oficio: OficioDocente, docente: Docente, ciclo: CicloEscolar):
    """Helper to populate dynamic schema fields for OficioDocenteResponse."""
    oficio.docente_nombre = f"{docente.apellidos} {docente.nombre}".upper()
    oficio.ciclo_nombre = ciclo.nombre
    oficio.plantilla_nombre = oficio.plantilla.nombre if oficio.plantilla else "N/A"
    oficio.requiere_firma = oficio.plantilla.requiere_firma if oficio.plantilla else False
    oficio.tipo_contrato = docente.categoria.siglas if docente.categoria else None

    # Interpolate HTML content dynamically
    if oficio.plantilla:
        oficio.contenido_html = interpolar_oficio(
            db,
            oficio.plantilla.contenido_html,
            docente,
            ciclo,
            oficio.numero_oficio,
            oficio.fecha_emision #type: ignore
        )
    return oficio

def obtener_oficio_docente_activo(db: Session, usuario_id: int):
    """Obtiene el oficio del docente activo en el ciclo escolar actual, si existe."""
    ciclo = obtener_ciclo_activo(db)
    if not ciclo:
        return None

    # Get teacher record from User ID
    docente = db.query(Docente).filter(Docente.usuario_id == usuario_id).first()
    if not docente:
        return None

    oficio = db.query(OficioDocente).filter(
        OficioDocente.docente_id == docente.id,
        OficioDocente.ciclo_id == ciclo.id
    ).first()

    if not oficio:
        return None

    return _populate_oficio_response(db, oficio, docente, ciclo)

def registrar_lectura_oficio(db: Session, usuario_id: int, ip: str):
    """Registra la confirmación de lectura (acuse de recibo) del oficio para eventuales."""
    ciclo = obtener_ciclo_activo(db)
    if not ciclo:
        raise ValueError("No hay ciclo activo")

    docente = db.query(Docente).filter(Docente.usuario_id == usuario_id).first()
    if not docente:
        raise ValueError("Docente no encontrado")

    oficio = db.query(OficioDocente).filter(
        OficioDocente.docente_id == docente.id,
        OficioDocente.ciclo_id == ciclo.id
    ).first()

    if not oficio:
        raise ValueError("Oficio no encontrado")

    # Set as read if it is still only in EMITIDO status
    if oficio.estado == EstadoOficio.EMITIDO:
        oficio.estado = EstadoOficio.LEIDO
        oficio.fecha_lectura = datetime.now(timezone.utc) #type: ignore
        oficio.ip_firma = ip
        db.commit()
        db.refresh(oficio)

    return _populate_oficio_response(db, oficio, docente, ciclo)

def firmar_oficio_digital(db: Session, usuario: Usuario, password: str, ip: str):
    """Firma digitalmente el oficio del docente usando la contraseña como MFA."""
    # 1. Validate signature password
    if not verify_password(password, usuario.password_hash):
        raise ValueError("La contraseña introducida es incorrecta. La firma digital no pudo ser validada.")

    ciclo = obtener_ciclo_activo(db)
    if not ciclo:
        raise ValueError("No hay ciclo escolar activo registrado")

    docente = db.query(Docente).filter(Docente.usuario_id == usuario.id).first()
    if not docente:
        raise ValueError("No se encontró el registro docente asociado al usuario")

    oficio = db.query(OficioDocente).filter(
        OficioDocente.docente_id == docente.id,
        OficioDocente.ciclo_id == ciclo.id
    ).first()

    if not oficio:
        raise ValueError("No se encontró ningún oficio programado para firma en este ciclo")

    if not oficio.plantilla or not oficio.plantilla.requiere_firma:
        raise ValueError("Este tipo de oficio no requiere firma digital de conformidad")

    if oficio.estado == EstadoOficio.FIRMADO:
        return _populate_oficio_response(db, oficio, docente, ciclo)  # Already signed

    # 2. Generate cryptographic digital seal (SHA-256)
    timestamp = datetime.now(timezone.utc)
    raw_signature_data = f"{docente.id}|{ciclo.id}|{oficio.numero_oficio}|{timestamp.isoformat()}|{ip}"
    hash_seal = hashlib.sha256(raw_signature_data.encode('utf-8')).hexdigest()

    # 3. Update status
    oficio.estado = EstadoOficio.FIRMADO
    oficio.fecha_firma = timestamp #type: ignore
    if not oficio.fecha_lectura:
        oficio.fecha_lectura = timestamp #type: ignore
    oficio.ip_firma = ip
    oficio.hash_firma = hash_seal

    db.commit()
    db.refresh(oficio)

    return _populate_oficio_response(db, oficio, docente, ciclo)

def rechazar_oficio_digital(db: Session, usuario: Usuario, observaciones: str):
    """Marca el oficio como rechazado, registrando las observaciones del docente."""
    if not observaciones.strip():
        raise ValueError("Es obligatorio indicar una justificación o motivo de rechazo en las observaciones.")

    ciclo = obtener_ciclo_activo(db)
    if not ciclo:
        raise ValueError("No hay ciclo escolar activo registrado")

    docente = db.query(Docente).filter(Docente.usuario_id == usuario.id).first()
    if not docente:
        raise ValueError("No se encontró el registro docente asociado al usuario")

    oficio = db.query(OficioDocente).filter(
        OficioDocente.docente_id == docente.id,
        OficioDocente.ciclo_id == ciclo.id
    ).first()

    if not oficio:
        raise ValueError("No se encontró ningún oficio programado para rechazo en este ciclo")

    if oficio.estado == EstadoOficio.FIRMADO:
        raise ValueError("No se puede rechazar un oficio que ya ha sido firmado de conformidad.")

    # Update status and observations
    oficio.estado = EstadoOficio.RECHAZADO
    oficio.observaciones_rechazo = observaciones
    timestamp = datetime.now(timezone.utc)
    if not oficio.fecha_lectura:
        oficio.fecha_lectura = timestamp #type: ignore
    
    db.commit()
    db.refresh(oficio)

    return _populate_oficio_response(db, oficio, docente, ciclo)
