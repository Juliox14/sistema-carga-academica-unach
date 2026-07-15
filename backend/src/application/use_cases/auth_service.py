from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import Usuario, Rol, Docente
from src.infrastructure.security import hash_password, verify_password
from src.infrastructure.api.schemas.auth_schema import UsuarioRegistro, UsuarioLogin
import secrets

def seed_default_roles(db: Session):
    """
    Crea los roles por defecto si la tabla de roles está vacía o faltan roles clave.
    """
    roles_requeridos = {
        1: ("Super Administrador", "SUPER_ADMIN"),
        2: ("Secretaría Académica", "SECRETARIA_ACADEMICA"),
        3: ("Capturista", "CAPTURISTA"),
        4: ("Docente", "DOCENTE")
    }
    
    for r_id, (nombre, clave) in roles_requeridos.items():
        rol_existente = db.query(Rol).filter(Rol.id == r_id).first()
        if not rol_existente:
            nuevo_rol = Rol(id=r_id, nombre=nombre, clave=clave)
            db.add(nuevo_rol)
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
    password_usada = registro.password
    if not password_usada:
        password_usada = f"UNACH-{secrets.token_hex(3).upper()}"

    hashed_pw = hash_password(password_usada)
    nuevo_usuario = Usuario(
        email_institucional=registro.email_institucional,
        password_hash=hashed_pw,
        rol_id=rol.id,
        activo=True,
        requiere_cambio_password=True # Creado por Admin requiere cambio obligatorio
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    # 5. Si es rol DOCENTE y se provee docente_id, vincularlo
    if clave_rol_buscado == "DOCENTE" and registro.docente_id:
        docente = db.query(Docente).filter(Docente.id == registro.docente_id).first()
        if not docente:
            raise ValueError("El docente especificado no existe")
        if docente.usuario_id is not None:
            raise ValueError("El docente ya está vinculado a un usuario")
        docente.usuario_id = nuevo_usuario.id
        db.commit()
        db.refresh(nuevo_usuario)
    
    # Asignar rol_clave y rol_nombre para facilitar la visualización en la respuesta
    nuevo_usuario.rol_clave = rol.clave
    nuevo_usuario.rol_nombre = rol.nombre
    nuevo_usuario.nombre = f"{nuevo_usuario.docente.nombre} {nuevo_usuario.docente.apellidos}" if nuevo_usuario.docente else None
    return nuevo_usuario, password_usada


def obtener_docentes_sin_usuario(db: Session):
    """
    Retorna la lista de docentes activos que no tienen un usuario vinculado.
    """
    return db.query(Docente).filter(Docente.usuario_id == None).all()


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
    usuario.rol_nombre = usuario.rol.nombre if usuario.rol else None
    usuario.nombre = f"{usuario.docente.nombre} {usuario.docente.apellidos}" if usuario.docente else None
    return usuario


def obtener_usuarios(db: Session):
    """
    Retorna todos los usuarios con sus claves y nombres de roles.
    """
    usuarios = db.query(Usuario).all()
    for u in usuarios:
        u.rol_clave = u.rol.clave if u.rol else None
        u.rol_nombre = u.rol.nombre if u.rol else None
        u.nombre = f"{u.docente.nombre} {u.docente.apellidos}" if u.docente else None
    return usuarios


def obtener_roles(db: Session):
    """
    Retorna todos los roles del sistema.
    """
    return db.query(Rol).all()


def cambiar_estado_usuario(db: Session, usuario_id: int):
    """
    Alterna el estado activo de un usuario.
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise ValueError("El usuario no existe")
    usuario.activo = not usuario.activo
    db.commit()
    db.refresh(usuario)
    usuario.rol_clave = usuario.rol.clave if usuario.rol else None
    usuario.rol_nombre = usuario.rol.nombre if usuario.rol else None
    return usuario


def cambiar_rol_usuario(db: Session, usuario_id: int, clave_rol: str):
    """
    Modifica el rol asignado a un usuario.
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise ValueError("El usuario no existe")
    rol = db.query(Rol).filter(Rol.clave == clave_rol.upper()).first()
    if not rol:
        raise ValueError(f"El rol especificado '{clave_rol}' no es válido")
    usuario.rol_id = rol.id
    db.commit()
    db.refresh(usuario)
    usuario.rol_clave = rol.clave
    usuario.rol_nombre = rol.nombre
    return usuario


def eliminar_usuario(db: Session, usuario_id: int):
    """
    Elimina físicamente un usuario de la base de datos.
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise ValueError("El usuario no existe")
    db.delete(usuario)
    db.commit()


def restablecer_password(db: Session, usuario_id: int, nueva_password: str):
    """
    Cambia la contraseña de un usuario (acción ejecutada por el SUPER_ADMIN).
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise ValueError("El usuario no existe")
    usuario.password_hash = hash_password(nueva_password)
    db.commit()
    db.refresh(usuario)
    usuario.rol_clave = usuario.rol.clave if usuario.rol else None
    usuario.rol_nombre = usuario.rol.nombre if usuario.rol else None
    return usuario


def cambiar_password_propia(db: Session, usuario_id: int, password_actual: str, nueva_password: str):
    """
    Cambia la contraseña del usuario actual tras validar la contraseña actual.
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise ValueError("El usuario no existe")
    if not verify_password(password_actual, usuario.password_hash):
        raise ValueError("La contraseña actual es incorrecta")
    usuario.password_hash = hash_password(nueva_password)
    usuario.requiere_cambio_password = False
    db.commit()
    db.refresh(usuario)
    usuario.rol_clave = usuario.rol.clave if usuario.rol else None
    usuario.rol_nombre = usuario.rol.nombre if usuario.rol else None
    return usuario


