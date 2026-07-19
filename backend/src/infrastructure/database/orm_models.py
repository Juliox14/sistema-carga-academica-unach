import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, BigInteger, Text, Enum as SQLEnum, Table, DateTime, Float, Date, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.orm import Mapped, mapped_column

Base = declarative_base()



class EstatusMateria(enum.Enum):
    ACTIVA = "ACTIVA"
    INACTIVA = "INACTIVA"

class Turno(enum.Enum):
    MATUTINO = "MATUTINO"
    VESPERTINO = "VESPERTINO"
    MIXTO = "MIXTO"

class EstadoAsignacion(enum.Enum):
    PENDIENTE = "PENDIENTE"
    ASIGNADA = "ASIGNADA"
    DESCARGADA = "DESCARGADA"
    VACANTE = "VACANTE"

class TipoPeriodo(enum.Enum):
    SEMESTRAL = "SEMESTRAL"
    CUATRIMESTRAL = "CUATRIMESTRAL"
    MODULAR = "MODULAR"

class TipoContratoOficio(enum.Enum):
    PTC = "PTC"
    PMT = "PMT"
    PAS = "PAS"
    PAT = "PAT"
    PAE = "PAE"

class EstadoOficio(enum.Enum):
    EMITIDO = "EMITIDO"
    LEIDO = "LEIDO"
    FIRMADO = "FIRMADO"
    RECHAZADO = "RECHAZADO"



docentes_areas_conocimiento = Table(
    'docentes_areas_conocimiento',
    Base.metadata,
    Column('docente_id', BigInteger, ForeignKey('docentes.id', ondelete='CASCADE'), primary_key=True),
    Column('area_conocimiento_id', BigInteger, ForeignKey('areas_conocimiento.id', ondelete='CASCADE'), primary_key=True)
)


class UnidadAcademica(Base):
    __tablename__ = 'unidades_academicas'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    clave = Column(String(20), nullable=False, unique=True)  # Abreviatura, ej: ETDA
    campus = Column(Integer, nullable=False, default=1)       # Número de campus
    ciudad = Column(String(100), nullable=True)               # Ciudad/municipio
    direccion = Column(String(300), nullable=True)            # Dirección física

    # Relaciones
    programas_educativos = relationship("ProgramaEducativo", back_populates="unidad_academica")
    usuarios = relationship("Usuario", back_populates="unidad_academica")
    docentes_vinculados = relationship("DocenteUnidad", back_populates="unidad_academica")
    ciclos_unidad = relationship("CicloEscolarUnidad", back_populates="unidad_academica")
    plantillas_oficios = relationship("PlantillaOficio", back_populates="unidad_academica")


class DocenteUnidad(Base):
    """Tabla intermedia que vincula docentes con unidades académicas.
    Un docente puede pertenecer a varias unidades, con una marcada como principal (opcional)."""
    __tablename__ = 'docentes_unidades'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    docente_id = Column(BigInteger, ForeignKey('docentes.id', ondelete='CASCADE'), nullable=False)
    unidad_academica_id = Column(BigInteger, ForeignKey('unidades_academicas.id', ondelete='CASCADE'), nullable=False)
    es_unidad_principal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    horas_obligatorias: Mapped[float] = mapped_column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint('docente_id', 'unidad_academica_id', name='uq_docente_unidad'),
    )

    # Relaciones
    docente = relationship("Docente", back_populates="unidades")
    unidad_academica = relationship("UnidadAcademica", back_populates="docentes_vinculados")


class CicloEscolarUnidad(Base):
    """Estado del ciclo escolar por unidad académica.
    El ciclo es global (definición), pero su estado activo/carga_finalizada varía por unidad."""
    __tablename__ = 'ciclos_escolares_unidades'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ciclo_escolar_id = Column(BigInteger, ForeignKey('ciclos_escolares.id', ondelete='CASCADE'), nullable=False)
    unidad_academica_id = Column(BigInteger, ForeignKey('unidades_academicas.id', ondelete='CASCADE'), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    carga_finalizada: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint('ciclo_escolar_id', 'unidad_academica_id', name='uq_ciclo_unidad'),
    )

    # Relaciones
    ciclo_escolar = relationship("CicloEscolar", back_populates="estados_por_unidad")
    unidad_academica = relationship("UnidadAcademica", back_populates="ciclos_unidad")


class Rol(Base):
    __tablename__ = 'roles'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=True)
    clave = Column(String(50), nullable=True)

    # Relaciones
    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = 'usuarios'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=True)
    email_institucional: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol_id = Column(BigInteger, ForeignKey('roles.id'), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    requiere_cambio_password: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0", nullable=False)
    # NULL para SUPER_ADMIN, obligatorio para SECRETARIA_ACADEMICA y CAPTURISTA
    unidad_academica_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey('unidades_academicas.id'), nullable=True)

    # Relaciones
    rol = relationship("Rol", back_populates="usuarios")
    docente = relationship("Docente", back_populates="usuario", uselist=False)
    unidad_academica = relationship("UnidadAcademica", back_populates="usuarios")


class CategoriaDocente(Base):
    __tablename__ = 'categorias_docentes'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    siglas = Column(String(20), nullable=False)
    hsm_base: Mapped[int] = mapped_column(Integer, nullable=False)
    nivel_prioridad = Column(Integer, nullable=False)
    permite_titular: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    permite_suplente: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relaciones
    docentes = relationship("Docente", back_populates="categoria")


class AreaConocimiento(Base):
    __tablename__ = 'areas_conocimiento'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)

    # Relaciones
    materias = relationship("Materia", back_populates="area_conocimiento")
    docentes = relationship("Docente", secondary=docentes_areas_conocimiento, back_populates="areas_conocimiento")


class ProgramaEducativo(Base):
    __tablename__ = 'programas_educativos'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    clave = Column(String(50), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    nivel = Column(String(50), nullable=False, default="LICENCIATURA")
    unidad_academica_id = Column(BigInteger, ForeignKey('unidades_academicas.id'), nullable=True)

    # Relaciones
    planes_estudio = relationship("PlanEstudios", back_populates="programa_educativo")
    unidad_academica = relationship("UnidadAcademica", back_populates="programas_educativos")


class PlanEstudios(Base):
    __tablename__ = 'plan_estudios'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    programa_educativo_id = Column(BigInteger, ForeignKey('programas_educativos.id'), nullable=False)
    vigente = Column(Boolean, default=True, nullable=False)
    tipo_periodo = Column(SQLEnum(TipoPeriodo), default=TipoPeriodo.SEMESTRAL, nullable=False)

    # Relaciones
    programa_educativo = relationship("ProgramaEducativo", back_populates="planes_estudio")
    materias = relationship("Materia", back_populates="plan_estudio")
    grupos_abiertos = relationship("GrupoAbierto", back_populates="plan_estudio")


class CicloEscolar(Base):
    __tablename__ = "ciclos_escolares"

    # 1. CAMBIO: De Integer a BigInteger para que coincida con tus demás tablas
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    mes_inicio = Column(Integer, nullable=False) # 1 al 12
    mes_final = Column(Integer, nullable=False)  # 1 al 12
    anio = Column(Integer, nullable=False)       # Ej. 2026
    
    activo: Mapped[bool] = mapped_column(Boolean, default=False)
    carga_finalizada: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relaciones
    grupos_abiertos = relationship("GrupoAbierto", back_populates="ciclo_escolar")
    asignaciones_carga = relationship("AsignacionCarga", back_populates="ciclo_escolar")
    # Agregamos la relación hacia las otras actividades
    asignaciones_otras_actividades = relationship("AsignacionOtraActividad", back_populates="ciclo_escolar")
    estados_por_unidad = relationship("CicloEscolarUnidad", back_populates="ciclo_escolar", cascade="all, delete-orphan")

class EstatusDocente(Base):
    __tablename__ = 'estatus_docentes'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, unique=True)
    permite_carga = Column(Boolean, default=True, nullable=False)
    max_horas = Column(Float, nullable=True)
    es_prioritario = Column(Boolean, default=False, nullable=False)

    docentes = relationship("Docente", back_populates="estatus")


class Docente(Base):
    __tablename__ = 'docentes'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre: Mapped[String] = mapped_column(String(100), nullable=False)
    apellidos: Mapped[String | None] = mapped_column(String(100), nullable=True)
    plaza: Mapped[String | None] = mapped_column(String(50), nullable=True)
    categoria_id: Mapped[BigInteger] = mapped_column(BigInteger, ForeignKey('categorias_docentes.id'), nullable=False)
    hsm_personalizadas: Mapped[float | None] = mapped_column(Float, nullable=True)
    estatus_id: Mapped[BigInteger | None] = mapped_column(BigInteger, ForeignKey('estatus_docentes.id'), nullable=True)
    correo_institucional: Mapped[String | None] = mapped_column(String(150), nullable=True)
    telefono: Mapped[String | None] = mapped_column(String(30), nullable=True)
    usuario_id: Mapped[BigInteger | None] = mapped_column(BigInteger, ForeignKey('usuarios.id'), unique=True, nullable=True)
    turno: Mapped[Turno] = mapped_column(SQLEnum(Turno), nullable=False, default=Turno.MIXTO)
    es_comodin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rfc = Column(String(13), nullable=True)
    curp = Column(String(18), nullable=True)
    fecha_ingreso = Column(Date, nullable=True)
    perfil_academico = Column(String(200), nullable=True)
    ultimo_grado_estudio = Column(String(150), nullable=True)

    # Relaciones
    estatus = relationship("EstatusDocente", back_populates="docentes")
    usuario = relationship("Usuario", back_populates="docente")
    categoria = relationship("CategoriaDocente", back_populates="docentes")
    areas_conocimiento = relationship("AreaConocimiento", secondary=docentes_areas_conocimiento, back_populates="docentes")
    asignaciones_titular = relationship("AsignacionCarga", foreign_keys='AsignacionCarga.docente_titular_id', back_populates="docente_titular")
    asignaciones_temporal = relationship("AsignacionCarga", foreign_keys='AsignacionCarga.docente_temporal_id', back_populates="docente_temporal")
    otras_actividades = relationship("AsignacionOtraActividad", back_populates="docente")
    unidades = relationship("DocenteUnidad", back_populates="docente", cascade="all, delete-orphan")


class Materia(Base):
    __tablename__ = 'materias'

    id: Mapped[BigInteger] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    nombre_asignatura = Column(String(150), nullable=False)
    plan_estudios_id = Column(BigInteger, ForeignKey('plan_estudios.id'), nullable=False)
    numero_periodo: Mapped[int|None] = mapped_column(Integer, nullable=True)  # Puede ser null para materias que no siguen la estructura tradicional
    hsm: Mapped[int] = mapped_column(Integer, nullable=False)
    area_conocimiento_id = Column(BigInteger, ForeignKey('areas_conocimiento.id'), nullable=False)
    estatus = Column(SQLEnum(EstatusMateria), default=EstatusMateria.ACTIVA, nullable=False)
    es_especial: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relaciones
    plan_estudio = relationship("PlanEstudios", back_populates="materias")
    area_conocimiento = relationship("AreaConocimiento", back_populates="materias")
    asignaciones = relationship("AsignacionCarga", back_populates="materia")


class GrupoAbierto(Base):
    __tablename__ = 'grupos_abiertos'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ciclo_escolar_id = Column(BigInteger, ForeignKey('ciclos_escolares.id'), nullable=False)
    plan_estudios_id = Column(BigInteger, ForeignKey('plan_estudios.id'), nullable=False)
    numero_periodo: Mapped[int|None] = mapped_column(Integer, nullable=True)  # Puede ser null para grupos que no siguen la estructura tradicional
    grupo = Column(String(5), nullable=False)
    turno = Column(SQLEnum(Turno), nullable=False)
    es_especial: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relaciones
    ciclo_escolar = relationship("CicloEscolar", back_populates="grupos_abiertos")
    plan_estudio = relationship("PlanEstudios", back_populates="grupos_abiertos")
    asignaciones = relationship("AsignacionCarga", back_populates="grupo_asignado")


class OtraActividad(Base):
    __tablename__ = 'otras_actividades'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    # Regresamos el hsm a Float (es el valor base del catálogo)
    hsm = Column(Float, nullable=False) 
    
    # Relaciones
    asignaciones = relationship("AsignacionOtraActividad", back_populates="actividad")

class AsignacionOtraActividad(Base):
    __tablename__ = 'asignaciones_otras_actividades'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    actividad_id = Column(BigInteger, ForeignKey('otras_actividades.id'), nullable=False)
    docente_id = Column(BigInteger, ForeignKey('docentes.id'), nullable=False)
    unidad_academica_id = Column(BigInteger, ForeignKey('unidades_academicas.id', ondelete='CASCADE'), nullable=True) # Migracion
    
    ciclo_escolar_id = Column(BigInteger, ForeignKey('ciclos_escolares.id'), nullable=False)
    horas_asignadas: Mapped[float] = mapped_column(Float, nullable=False)
    
    observaciones = Column(Text, nullable=True)

    # Relaciones
    actividad = relationship("OtraActividad", back_populates="asignaciones")
    docente = relationship("Docente", back_populates="otras_actividades")
    ciclo_escolar = relationship("CicloEscolar", back_populates="asignaciones_otras_actividades")

class AsignacionCarga(Base):
    __tablename__ = 'asignaciones_carga'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    materia_id = Column(BigInteger, ForeignKey('materias.id'), nullable=False)
    grupo_asignado_id = Column(BigInteger, ForeignKey('grupos_abiertos.id'), nullable=True)
    docente_titular_id: Mapped[BigInteger | None | int] = mapped_column(BigInteger, ForeignKey('docentes.id'), nullable=True)
    docente_temporal_id: Mapped[BigInteger | None | int] = mapped_column(BigInteger, ForeignKey('docentes.id'), nullable=True)
    ciclo_escolar_id: Mapped[BigInteger] = mapped_column(BigInteger, ForeignKey('ciclos_escolares.id'), nullable=False)
    estado_asignacion: Mapped[EstadoAsignacion] = mapped_column(SQLEnum(EstadoAsignacion), default=EstadoAsignacion.PENDIENTE, nullable=False)
    motivo_descarga: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relaciones
    materia = relationship("Materia", back_populates="asignaciones")
    grupo_asignado = relationship("GrupoAbierto", back_populates="asignaciones")
    ciclo_escolar = relationship("CicloEscolar", back_populates="asignaciones_carga")
    horarios = relationship("HorarioClase", back_populates="asignacion_carga", cascade="all, delete-orphan")
    
    docente_titular = relationship("Docente", foreign_keys=[docente_titular_id], back_populates="asignaciones_titular")
    docente_temporal = relationship("Docente", foreign_keys=[docente_temporal_id], back_populates="asignaciones_temporal")
    

class ConfiguracionSistema(Base):
    __tablename__ = 'configuracion_sistema'

    clave: Mapped[str] = mapped_column(String(100), primary_key=True)
    unidad_academica_id = Column(BigInteger, ForeignKey('unidades_academicas.id', ondelete='CASCADE'), primary_key=True)
    modulo: Mapped[str] = mapped_column(String(50), nullable=False)
    nombre_descriptivo: Mapped[str] = mapped_column(String(150), nullable=False)
    tipo_dato: Mapped[str] = mapped_column(String(20), nullable=False)
    valor: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Relaciones
    unidad_academica = relationship("UnidadAcademica")


class PlantillaOficio(Base):
    __tablename__ = 'plantillas_oficios'

    id: Mapped[BigInteger] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo_contrato: Mapped[TipoContratoOficio] = mapped_column(SQLEnum(TipoContratoOficio), nullable=False)
    contenido_html: Mapped[str] = mapped_column(Text, nullable=False)
    requiere_firma: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    es_activa: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # NULL = plantilla base global (visible para todas las unidades)
    unidad_academica_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey('unidades_academicas.id'), nullable=True)

    # Campos estructurados para diseño membretado fijo UNACH
    lugar_emision: Mapped[str | None] = mapped_column(String(150), nullable=True)
    asunto: Mapped[str | None] = mapped_column(String(200), nullable=True)
    destinatarios: Mapped[str | None] = mapped_column(Text, nullable=True)
    cuerpo_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    despedida: Mapped[str | None] = mapped_column(String(150), nullable=True)
    remitente_nombre: Mapped[str | None] = mapped_column(String(150), nullable=True)
    remitente_cargo: Mapped[str | None] = mapped_column(String(150), nullable=True)
    con_copia_para: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relaciones
    oficios_emitidos = relationship("OficioDocente", back_populates="plantilla")
    unidad_academica = relationship("UnidadAcademica", back_populates="plantillas_oficios")


class OficioDocente(Base):
    __tablename__ = 'oficios_docentes'

    id: Mapped[BigInteger] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    docente_id: Mapped[BigInteger] = mapped_column(BigInteger, ForeignKey('docentes.id'), nullable=False)
    ciclo_id: Mapped[BigInteger] = mapped_column(BigInteger, ForeignKey('ciclos_escolares.id'), nullable=False)
    plantilla_id: Mapped[BigInteger] = mapped_column(BigInteger, ForeignKey('plantillas_oficios.id'), nullable=False)
    # Unidad académica que emite el oficio
    unidad_academica_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey('unidades_academicas.id'), nullable=True)
    estado: Mapped[EstadoOficio] = mapped_column(SQLEnum(EstadoOficio), default=EstadoOficio.EMITIDO, nullable=False)
    numero_oficio: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    fecha_emision: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    fecha_lectura: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    fecha_firma: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    ip_firma: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hash_firma: Mapped[str | None] = mapped_column(String(255), nullable=True)
    observaciones_rechazo: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relaciones
    docente = relationship("Docente")
    ciclo_escolar = relationship("CicloEscolar")
    plantilla = relationship("PlantillaOficio", back_populates="oficios_emitidos")


class DiaSemana(enum.Enum):
    LUNES = "LUNES"
    MARTES = "MARTES"
    MIERCOLES = "MIERCOLES"
    JUEVES = "JUEVES"
    VIERNES = "VIERNES"
    SABADO = "SABADO"


class TipoPreferencia(enum.Enum):
    PREFERIR = "PREFERIR"
    EVITAR = "EVITAR"
    NEUTRAL = "NEUTRAL"


class PreferenciaDocente(Base):
    __tablename__ = 'preferencias_docentes'

    id: Mapped[BigInteger] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    docente_id: Mapped[BigInteger] = mapped_column(BigInteger, ForeignKey('docentes.id', ondelete='CASCADE'), nullable=False)
    ciclo_escolar_id: Mapped[BigInteger] = mapped_column(BigInteger, ForeignKey('ciclos_escolares.id', ondelete='CASCADE'), nullable=False)
    dia_semana: Mapped[DiaSemana] = mapped_column(SQLEnum(DiaSemana), nullable=False)
    tipo_preferencia: Mapped[TipoPreferencia] = mapped_column(SQLEnum(TipoPreferencia), nullable=False, default=TipoPreferencia.NEUTRAL)
    horas_bloqueadas: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relaciones
    docente = relationship("Docente")
    ciclo_escolar = relationship("CicloEscolar")


class HorarioClase(Base):
    __tablename__ = 'horarios_clases'

    id: Mapped[BigInteger] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    asignacion_carga_id: Mapped[BigInteger] = mapped_column(BigInteger, ForeignKey('asignaciones_carga.id', ondelete='CASCADE'), nullable=False)
    dia_semana: Mapped[DiaSemana] = mapped_column(SQLEnum(DiaSemana), nullable=False)
    hora_inicio: Mapped[Integer] = mapped_column(Integer, nullable=False)
    hora_fin: Mapped[Integer] = mapped_column(Integer, nullable=False)

    # Relaciones
    asignacion_carga = relationship("AsignacionCarga", back_populates="horarios")  