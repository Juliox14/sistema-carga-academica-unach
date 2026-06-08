from typing import List, Optional
import enum
from sqlalchemy import String, Integer, Boolean, ForeignKey, Text, Enum, Table, Column
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship



# 0. CONFIGURACIÓN BASE Y ENUMS


class Base(DeclarativeBase):
    pass


class TurnoEnum(str, enum.Enum):
    MATUTINO = "Matutino"
    VESPERTINO = "Vespertino"
    MIXTO = "Mixto"


class EstatusDocenteEnum(str, enum.Enum):
    ACTIVO = "Activo"
    COMISIONADO = "Comisionado"
    LICENCIA = "Licencia"
    SABATICO = "Sabático"
    VACANTE = "Vacante"


class EstatusMateriaEnum(str, enum.Enum):
    VACANTE = "Vacante"
    ASIGNADA = "Asignada"
    EN_COMODIN = "En Comodín"


class EstadoAsignacionEnum(str, enum.Enum):
    NORMAL = "Normal"
    RESERVADA_SABATICO = "Reservada por sabático"
    LIBERADA_TEMPORAL = "Liberada temporalmente"
    RESTITUIDA = "Restituida"
    COMODIN = "Comodín"



# 1. TABLA PIVOTE (Relación Muchos a Muchos)


docentes_areas_conocimiento = Table(
    "docentes_areas_conocimiento",
    Base.metadata,
    Column("docente_id", ForeignKey("docentes.id", ondelete="CASCADE"), primary_key=True),
    Column("area_conocimiento_id", ForeignKey("areas_conocimiento.id", ondelete="CASCADE"), primary_key=True),
)



# 2. MODELOS DE AUTENTICACIÓN Y SEGURIDAD


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    # Clave corta para lógica de permisos: 'admin', 'capturista', etc.
    clave: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    usuarios: Mapped[List["Usuario"]] = relationship(back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email_institucional: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    rol: Mapped["Role"] = relationship(back_populates="usuarios")
    # uselist=False porque un usuario tiene a lo mucho un docente asociado
    docente: Mapped[Optional["Docente"]] = relationship(back_populates="usuario", uselist=False)



# 3. MODELOS DE CATÁLOGOS ACADÉMICOS


class ProgramaEducativo(Base):
    __tablename__ = "programas_educativos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    clave: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    planes_estudio: Mapped[List["PlanEstudio"]] = relationship(back_populates="programa_educativo")


class PlanEstudio(Base):
    __tablename__ = "plan_estudios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    programa_educativo_id: Mapped[int] = mapped_column(ForeignKey("programas_educativos.id"), nullable=False)
    vigente: Mapped[bool] = mapped_column(Boolean, default=True)

    programa_educativo: Mapped["ProgramaEducativo"] = relationship(back_populates="planes_estudio")
    materias: Mapped[List["Materia"]] = relationship(back_populates="plan_estudios")


class CategoriaDocente(Base):
    __tablename__ = "categorias_docentes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    siglas: Mapped[str] = mapped_column(String(10), nullable=False)
    hsm_base: Mapped[int] = mapped_column(Integer, nullable=False)
    # Menor número = mayor prioridad en la asignación de carga
    nivel_prioridad: Mapped[int] = mapped_column(Integer, nullable=False)
    es_comodin: Mapped[bool] = mapped_column(Boolean, default=False)

    docentes: Mapped[List["Docente"]] = relationship(back_populates="categoria")


class AreaConocimiento(Base):
    __tablename__ = "areas_conocimiento"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    # CORRECCIÓN: faltaba el paréntesis de cierre en mapped_column
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    materias: Mapped[List["Materia"]] = relationship(back_populates="area_conocimiento")
    docentes: Mapped[List["Docente"]] = relationship(
        secondary=docentes_areas_conocimiento,
        back_populates="areas_conocimiento",
    )



# 4. ENTIDADES PRINCIPALES Y TRANSACCIONALES


class CicloEscolar(Base):
    __tablename__ = "ciclos_escolares"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)  # ej: 'Agosto - Diciembre 2026'
    activo: Mapped[bool] = mapped_column(Boolean, default=False)

    asignaciones: Mapped[List["AsignacionCarga"]] = relationship(back_populates="ciclo_escolar")


class Docente(Base):
    __tablename__ = "docentes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(100), nullable=False)
    plaza: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias_docentes.id"), nullable=False)
    # Permite sobreescribir las HSM base de la categoría para casos especiales
    hsm_personalizadas: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    estatus: Mapped[EstatusDocenteEnum] = mapped_column(
        Enum(EstatusDocenteEnum), default=EstatusDocenteEnum.ACTIVO
    )
    usuario_id: Mapped[Optional[int]] = mapped_column(ForeignKey("usuarios.id"), unique=True, nullable=True)

    categoria: Mapped["CategoriaDocente"] = relationship(back_populates="docentes")
    usuario: Mapped[Optional["Usuario"]] = relationship(back_populates="docente", uselist=False)
    areas_conocimiento: Mapped[List["AreaConocimiento"]] = relationship(
        secondary=docentes_areas_conocimiento,
        back_populates="docentes",
    )
    asignaciones_titular: Mapped[List["AsignacionCarga"]] = relationship(
        foreign_keys="[AsignacionCarga.docente_titular_id]",
        back_populates="docente_titular",
    )
    asignaciones_temporal: Mapped[List["AsignacionCarga"]] = relationship(
        foreign_keys="[AsignacionCarga.docente_temporal_id]",
        back_populates="docente_temporal",
    )


class Materia(Base):
    __tablename__ = "materias"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre_asignatura: Mapped[str] = mapped_column(String(150), nullable=False)
    plan_estudios_id: Mapped[int] = mapped_column(ForeignKey("plan_estudios.id"), nullable=False)
    semestre: Mapped[int] = mapped_column(Integer, nullable=False)
    grupo: Mapped[str] = mapped_column(String(5), nullable=False)
    turno: Mapped[TurnoEnum] = mapped_column(Enum(TurnoEnum), nullable=False)
    hsm: Mapped[int] = mapped_column(Integer, nullable=False)
    area_conocimiento_id: Mapped[int] = mapped_column(ForeignKey("areas_conocimiento.id"), nullable=False)
    estatus: Mapped[EstatusMateriaEnum] = mapped_column(
        Enum(EstatusMateriaEnum), default=EstatusMateriaEnum.VACANTE
    )

    plan_estudios: Mapped["PlanEstudio"] = relationship(back_populates="materias")
    area_conocimiento: Mapped["AreaConocimiento"] = relationship(back_populates="materias")
    asignaciones: Mapped[List["AsignacionCarga"]] = relationship(back_populates="materia")


class AsignacionCarga(Base):
    __tablename__ = "asignaciones_carga"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    materia_id: Mapped[int] = mapped_column(ForeignKey("materias.id"), nullable=False)
    docente_titular_id: Mapped[int] = mapped_column(ForeignKey("docentes.id"), nullable=False)
    docente_temporal_id: Mapped[Optional[int]] = mapped_column(ForeignKey("docentes.id"), nullable=True)
    ciclo_escolar_id: Mapped[int] = mapped_column(ForeignKey("ciclos_escolares.id"), nullable=False)
    estado_asignacion: Mapped[EstadoAsignacionEnum] = mapped_column(
        Enum(EstadoAsignacionEnum), default=EstadoAsignacionEnum.NORMAL
    )

    materia: Mapped["Materia"] = relationship(back_populates="asignaciones")
    ciclo_escolar: Mapped["CicloEscolar"] = relationship(back_populates="asignaciones")
    docente_titular: Mapped["Docente"] = relationship(
        foreign_keys=[docente_titular_id],
        back_populates="asignaciones_titular",
    )
    docente_temporal: Mapped[Optional["Docente"]] = relationship(
        foreign_keys=[docente_temporal_id],
        back_populates="asignaciones_temporal",
    )