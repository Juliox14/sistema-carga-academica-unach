from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional

class UsuarioRegistro(BaseModel):
    email_institucional: EmailStr = Field(..., description="Correo institucional único del usuario")
    password: str = Field(..., min_length=6, description="Contraseña del usuario (mínimo 6 caracteres)")
    clave_rol: str = Field(default="DOCENTE", description="Clave del rol a asignar (ej: DOCENTE, SECRETARIA_ACADEMICA)")

class UsuarioLogin(BaseModel):
    email_institucional: EmailStr = Field(..., description="Correo institucional del usuario")
    password: str = Field(..., description="Contraseña en texto plano")

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

    model_config = ConfigDict(from_attributes=True)
