import json
from sqlalchemy.orm import Session
from src.infrastructure.database.orm_models import ConfiguracionSistema

class ConfiguracionService:
    _cache = {}
    
    @classmethod
    def cargar_cache(cls, db: Session):
        configs = db.query(ConfiguracionSistema).all()
        cls._cache.clear()
        
        for c in configs:
            unidad_id = c.unidad_academica_id
            if unidad_id not in cls._cache:
                cls._cache[unidad_id] = {}
                
            if c.tipo_dato == 'bool':
                cls._cache[unidad_id][c.clave] = c.valor.lower() == 'true'
            elif c.tipo_dato == 'int':
                cls._cache[unidad_id][c.clave] = int(c.valor)
            elif c.tipo_dato == 'float':
                cls._cache[unidad_id][c.clave] = float(c.valor)
            elif c.tipo_dato == 'json':
                cls._cache[unidad_id][c.clave] = json.loads(c.valor)
            else:
                cls._cache[unidad_id][c.clave] = c.valor
        
    @classmethod
    def obtener(cls, clave: str, unidad_academica_id: int, default=None):
        if unidad_academica_id not in cls._cache:
            return default
        return cls._cache[unidad_academica_id].get(clave, default)
    
    @classmethod
    def actualizar(cls, db: Session, clave: str, unidad_academica_id: int, nuevo_valor):
        config = db.query(ConfiguracionSistema).filter_by(clave=clave, unidad_academica_id=unidad_academica_id).first()
        
        if config:
            config.valor = nuevo_valor
            db.commit()
            cls.cargar_cache(db)
                
                