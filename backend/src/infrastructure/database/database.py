import os
import sys
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env")

db_route = os.getenv("DB_USER", "dev_user")
db_user = os.getenv("DB_USER", "dev_user")
db_password = os.getenv("DB_PASSWORD", "dev_password")
db_name = os.getenv("DB_NAME", "carga_academica")
db_port = os.getenv("DB_PORT", "3306")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{db_user}:{db_password}@{db_route}:{db_port}/{db_name}"


engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()