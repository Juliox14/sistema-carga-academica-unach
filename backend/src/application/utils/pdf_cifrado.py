import io
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

def generar_pdf_credenciales_protegido(email: str, password_temporal: str, plaza_docente: str) -> bytes:
    """
    Genera un PDF con credenciales de acceso y lo cifra utilizando la contraseña generada por el número de plaza del docente.
    Devuelve el PDF cifrado como bytes.
    """
    # 1. Create a basic PDF in memory using ReportLab
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)
    width, height = letter

    # Draw header decorations (UNACH Style)
    c.setFillColor(colors.HexColor("#002d55")) # Blue
    c.rect(0, height - 15, width, 15, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#D4E600")) # Yellow-Green line
    c.rect(0, height - 20, width, 5, fill=1, stroke=0)

    # Title
    c.setFillColor(colors.HexColor("#002d55"))
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 70, "UNIVERSIDAD AUTÓNOMA DE CHIAPAS")
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawString(50, height - 88, "Sistema de Planeación Académica Docente (SIPAD)")

    # Divider line
    c.setStrokeColor(colors.HexColor("#dddddd"))
    c.setLineWidth(1)
    c.line(50, height - 105, width - 50, height - 105)

    # Content Title
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("Helvetica-Bold", 13)
    c.drawString(50, height - 140, "OFICIO DE CREDENCIALES DE ACCESO Y PRIMER INGRESO")

    # Body text
    c.setFont("Helvetica", 10)
    text_lines = [
        "Estimado(a) docente,",
        "",
        "Se ha registrado y habilitado de forma exitosa tu cuenta de acceso a la plataforma SIPAD",
        "de la Escuela de Tecnologías Digitales Aplicadas.",
        "",
        "Para ingresar por primera vez al sistema, utiliza las siguientes credenciales institucionales:",
        ""
    ]
    
    y = height - 170
    for line in text_lines:
        c.drawString(50, y, line)
        y -= 16

    # Credentials box
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.rect(50, y - 65, width - 100, 75, fill=1, stroke=1)
    
    c.setFillColor(colors.HexColor("#000000"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(70, y - 20, f"Correo Institucional: {email}")
    c.drawString(70, y - 45, f"Contraseña Temporal: {password_temporal}")

    # Security warning
    y -= 95
    c.setFillColor(colors.HexColor("#991b1b")) # Red
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y, "AVISO DE SEGURIDAD OBLIGATORIO:")
    
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("Helvetica", 9)
    y -= 15
    c.drawString(50, y, "1. Por motivos de seguridad, se requiere un cambio obligatorio de contraseña en tu primer ingreso.")
    y -= 14
    c.drawString(50, y, "2. No compartas este oficio ni tus credenciales con terceros bajo ninguna circunstancia.")
    y -= 14
    c.drawString(50, y, "3. El sistema solicitará que definas una nueva contraseña robusta y privada para activar la firma digital.")

    # Footer
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.HexColor("#777777"))
    c.drawString(50, 50, "C.c.p. Departamento de Logística Académica / Registro de Usuarios C-I")

    c.save()
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()

    # 2. Encrypt the generated PDF bytes using pypdf
    input_pdf = io.BytesIO(pdf_bytes)
    reader = PdfReader(input_pdf)
    writer = PdfWriter()

    # Copy pages
    for page in reader.pages:
        writer.add_page(page)

    # Cifrar utilizando el número de plaza del docente como contraseña de usuario
    writer.encrypt(user_password=plaza_docente)

    output_pdf = io.BytesIO()
    writer.write(output_pdf)
    encrypted_bytes = output_pdf.getvalue()
    
    input_pdf.close()
    output_pdf.close()

    return encrypted_bytes
