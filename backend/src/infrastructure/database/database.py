import os
import sys
import re
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env")

# 1. Obtener la URL de la base de datos de variable de entorno o construirla
db_url_env = os.getenv("DATABASE_URL")

connect_args = {}

if db_url_env:
    # Si viene desde Render/Aiven, formatear para PyMySQL y SSL
    if db_url_env.startswith("mysql://"):
        db_url_env = db_url_env.replace("mysql://", "mysql+pymysql://", 1)
    
    # Remover parámetros incompatibles como ssl-mode
    db_url_env = re.sub(r'[?&]ssl-mode=[^&]+', '', db_url_env)
    SQLALCHEMY_DATABASE_URL = db_url_env
    
    # Si es una conexión remota (como Aiven cloud), habilitar SSL
    if "aivencloud.com" in db_url_env or "ssl" in db_url_env.lower():
        connect_args = {"ssl": {}}
else:
    db_user = os.getenv("DB_USER", "dev_user")
    db_password = os.getenv("DB_PASSWORD", "dev_password")
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "carga_academica")
    db_port = os.getenv("DB_PORT", "3306")
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()