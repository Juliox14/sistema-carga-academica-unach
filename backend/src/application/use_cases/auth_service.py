from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import Usuario, Rol
from src.infrastructure.security import hash_password, verify_password
from src.infrastructure.api.schemas.auth_schema import UsuarioRegistro, UsuarioLogin

def seed_default_roles(db: Session):
    """
    Crea los roles por defecto si la tabla de roles está vacía.
    Esto ayuda a evitar errores de claves foráneas en bases de datos vacías.
    """
    roles_existentes = db.query(Rol).first()
    if not roles_existentes:
        default_roles = [
            Rol(id=1, nombre="Secretaría Académica", clave="SECRETARIA_ACADEMICA"),
            Rol(id=2, nombre="Docente", clave="DOCENTE")
        ]
        db.add_all(default_roles)
        db.commit()

def registrar_usuario(db: Session, registro: UsuarioRegistro) -> Usuario:
    """
    Registra un nuevo usuario en el sistema.
    Valida correos duplicados y realiza el hash de la contraseña.
    """
    # 1. Asegurar la existencia de roles por defecto
    seed_default_roles(db)

    # 2. Validar correo institucional único
    usuario_existente = db.query(Usuario).filter(
        Usuario.email_institucional == registro.email_institucional
    ).first()
    
    if usuario_existente:
        raise ValueError("El correo institucional ya está registrado")

    # 3. Buscar el rol solicitado (por defecto DOCENTE si no se especifica)
    clave_rol_buscado = registro.clave_rol.upper()
    rol = db.query(Rol).filter(Rol.clave == clave_rol_buscado).first()
    if not rol:
        raise ValueError(f"El rol especificado '{registro.clave_rol}' no es válido o no existe")

    # 4. Encriptar contraseña y crear usuario
    hashed_pw = hash_password(registro.password)
    nuevo_usuario = Usuario(
        email_institucional=registro.email_institucional,
        password_hash=hashed_pw,
        rol_id=rol.id,
        activo=True
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    # Asignar rol_clave para facilitar la visualización en la respuesta
    nuevo_usuario.rol_clave = rol.clave
    return nuevo_usuario

def autenticar_usuario(db: Session, login: UsuarioLogin) -> Usuario:
    """
    Verifica las credenciales de un usuario.
    Retorna el usuario si son válidas, de lo contrario lanza ValueError.
    """
    usuario = db.query(Usuario).filter(
        Usuario.email_institucional == login.email_institucional
    ).first()
    
    if not usuario:
        raise ValueError("Credenciales incorrectas")
        
    if not verify_password(login.password, usuario.password_hash):
        raise ValueError("Credenciales incorrectas")
        
    if not usuario.activo:
        raise ValueError("El usuario está inactivo")
        
    # Añadir dinámicamente la clave del rol
    usuario.rol_clave = usuario.rol.clave if usuario.rol else None
    return usuario
