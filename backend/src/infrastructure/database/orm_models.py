import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, BigInteger, Text, Enum as SQLEnum, Table
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class EstatusDocente(enum.Enum):
    ACTIVO = "Activo"
    INACTIVO = "Inactivo"
    SABATICO = "Sabático"
    LICENCIA = "Licencia"

class EstatusMateria(enum.Enum):
    ACTIVA = "Activa"
    INACTIVA = "Inactiva"

class TurnoGrupo(enum.Enum):
    MATUTINO = "Matutino"
    VESPERTINO = "Vespertino"
    MIXTO = "Mixto"

class EstadoAsignacion(enum.Enum):
    PENDIENTE = "Pendiente"
    ASIGNADA = "Asignada"
    SABATICO = "Sabático"
    
class TipoPeriodo(enum.Enum):
    SEMESTRAL = "SEMESTRAL"
    CUATRIMESTRAL = "CUATRIMESTRAL"
    MODULAR = "MODULAR"


docentes_areas_conocimiento = Table(
    'docentes_areas_conocimiento',
    Base.metadata,
    Column('docente_id', BigInteger, ForeignKey('docentes.id', ondelete='CASCADE'), primary_key=True),
    Column('area_conocimiento_id', BigInteger, ForeignKey('areas_conocimiento.id', ondelete='CASCADE'), primary_key=True)
)


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
    email_institucional = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol_id = Column(BigInteger, ForeignKey('roles.id'), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)

    # Relaciones
    rol = relationship("Rol", back_populates="usuarios")
    docente = relationship("Docente", back_populates="usuario", uselist=False)


class CategoriaDocente(Base):
    __tablename__ = 'categorias_docentes'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    siglas = Column(String(20), nullable=False)
    hsm_base = Column(Integer, nullable=False)
    nivel_prioridad = Column(Integer, nullable=False)
    es_comodin = Column(Boolean, default=False, nullable=False)

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

    # Relaciones
    planes_estudio = relationship("PlanEstudios", back_populates="programa_educativo")


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
    
    activo = Column(Boolean, default=False)

    # Relaciones
    grupos_abiertos = relationship("GrupoAbierto", back_populates="ciclo_escolar")
    asignaciones_carga = relationship("AsignacionCarga", back_populates="ciclo_escolar")
    # Agregamos la relación hacia las otras actividades
    asignaciones_otras_actividades = relationship("AsignacionOtraActividad", back_populates="ciclo_escolar")

class Docente(Base):
    __tablename__ = 'docentes'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    plaza = Column(String(50), nullable=False)
    categoria_id = Column(BigInteger, ForeignKey('categorias_docentes.id'), nullable=False)
    hsm_personalizadas = Column(Integer, nullable=True)
    estatus = Column(SQLEnum(EstatusDocente), nullable=False)
    usuario_id = Column(BigInteger, ForeignKey('usuarios.id'), unique=True, nullable=True)

    # Relaciones
    usuario = relationship("Usuario", back_populates="docente")
    categoria = relationship("CategoriaDocente", back_populates="docentes")
    areas_conocimiento = relationship("AreaConocimiento", secondary=docentes_areas_conocimiento, back_populates="docentes")
    asignaciones_titular = relationship("AsignacionCarga", foreign_keys='AsignacionCarga.docente_titular_id', back_populates="docente_titular")
    asignaciones_temporal = relationship("AsignacionCarga", foreign_keys='AsignacionCarga.docente_temporal_id', back_populates="docente_temporal")
    otras_actividades = relationship("AsignacionOtraActividad", back_populates="docente")


class Materia(Base):
    __tablename__ = 'materias'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre_asignatura = Column(String(150), nullable=False)
    plan_estudios_id = Column(BigInteger, ForeignKey('plan_estudios.id'), nullable=False)
    numero_periodo = Column(Integer, nullable=False)
    hsm = Column(Integer, nullable=False)
    area_conocimiento_id = Column(BigInteger, ForeignKey('areas_conocimiento.id'), nullable=False)
    estatus = Column(SQLEnum(EstatusMateria), default=EstatusMateria.ACTIVA, nullable=False)

    # Relaciones
    plan_estudio = relationship("PlanEstudios", back_populates="materias")
    area_conocimiento = relationship("AreaConocimiento", back_populates="materias")
    asignaciones = relationship("AsignacionCarga", back_populates="materia")


class GrupoAbierto(Base):
    __tablename__ = 'grupos_abiertos'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ciclo_escolar_id = Column(BigInteger, ForeignKey('ciclos_escolares.id'), nullable=False)
    plan_estudios_id = Column(BigInteger, ForeignKey('plan_estudios.id'), nullable=False)
    numero_periodo = Column(Integer, nullable=False)
    grupo = Column(String(5), nullable=False)
    turno = Column(SQLEnum(TurnoGrupo), nullable=False)

    # Relaciones
    ciclo_escolar = relationship("CicloEscolar", back_populates="grupos_abiertos")
    plan_estudio = relationship("PlanEstudios", back_populates="grupos_abiertos")
    asignaciones = relationship("AsignacionCarga", back_populates="grupo_asignado")


class OtraActividad(Base):
    __tablename__ = 'otras_actividades'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    # Regresamos el hsm a Integer (es el valor base del catálogo)
    hsm = Column(Integer, nullable=False) 
    
    # (Quitamos el ciclo y las horas asignadas de aquí)

    # Relaciones
    asignaciones = relationship("AsignacionOtraActividad", back_populates="actividad")

class AsignacionOtraActividad(Base):
    __tablename__ = 'asignaciones_otras_actividades'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    actividad_id = Column(BigInteger, ForeignKey('otras_actividades.id'), nullable=False)
    docente_id = Column(BigInteger, ForeignKey('docentes.id'), nullable=False)
    
    # 2. CAMBIO: Aquí es donde van los campos de contexto temporal y horas reales
    ciclo_escolar_id = Column(BigInteger, ForeignKey('ciclos_escolares.id'), nullable=False)
    horas_asignadas = Column(Integer, nullable=False)
    
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
    docente_titular_id = Column(BigInteger, ForeignKey('docentes.id'), nullable=True)
    docente_temporal_id = Column(BigInteger, ForeignKey('docentes.id'), nullable=True)
    ciclo_escolar_id = Column(BigInteger, ForeignKey('ciclos_escolares.id'), nullable=False)
    estado_asignacion = Column(SQLEnum(EstadoAsignacion), default=EstadoAsignacion.PENDIENTE, nullable=False)
    motivo_descarga = Column(String(100), nullable=True)

    # Relaciones
    materia = relationship("Materia", back_populates="asignaciones")
    grupo_asignado = relationship("GrupoAbierto", back_populates="asignaciones")
    ciclo_escolar = relationship("CicloEscolar", back_populates="asignaciones_carga")
    
    docente_titular = relationship("Docente", foreign_keys=[docente_titular_id], back_populates="asignaciones_titular")
    docente_temporal = relationship("Docente", foreign_keys=[docente_temporal_id], back_populates="asignaciones_temporal")