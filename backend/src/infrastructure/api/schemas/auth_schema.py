from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional

class UsuarioRegistro(BaseModel):
    email_institucional: EmailStr = Field(..., description="Correo institucional único del usuario")
    password: str = Field(..., min_length=6, max_length=72, description="Contraseña del usuario (6-72 caracteres)")
    clave_rol: str = Field(default="DOCENTE", description="Clave del rol a asignar (ej: DOCENTE, SECRETARIA_ACADEMICA)")

class UsuarioLogin(BaseModel):
    email_institucional: EmailStr = Field(..., description="Correo institucional del usuario")
    password: str = Field(..., max_length=72, description="Contraseña en texto plano (máximo 72 caracteres)")

class Token(BaseModel):
    access_token: str
    token_type: str
    email: str
    rol: str

class UsuarioResponse(BaseModel):
    id: int
    email_institucional: EmailStr
    rol_id: int
    activo: bool
    rol_clave: Optional[str] = None
    rol_nombre: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class RolResponse(BaseModel):
    id: int
    nombre: str
    clave: str

    model_config = ConfigDict(from_attributes=True)

class CambiarRolRequest(BaseModel):
    clave_rol: str

class CambiarPasswordPropiaRequest(BaseModel):
    password_actual: str = Field(..., description="Contraseña actual del usuario")
    nueva_password: str = Field(..., min_length=6, max_length=72, description="Nueva contraseña (6-72 caracteres)")

class RestablecerPasswordRequest(BaseModel):
    nueva_password: str = Field(..., min_length=6, max_length=72, description="Nueva contraseña (6-72 caracteres)")
