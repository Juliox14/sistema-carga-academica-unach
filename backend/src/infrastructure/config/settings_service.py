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
            if c.tipo_dato == 'bool':
                cls._cache[c.clave] = c.valor.lower() == 'true'
            elif c.tipo_dato == 'int':
                cls._cache[c.clave] = int(c.valor)
            elif c.tipo_dato == 'float':
                cls._cache[c.clave] = float(c.valor)
            elif c.tipo_dato == 'json':
                cls._cache[c.clave] = json.loads(c.valor)
            else:
                cls._cache[c.clave] = c.valor
        
    @classmethod
    def obtener(cls, clave: str, default=None):
        return cls._cache.get(clave, default)
    
    @classmethod
    def actualizar(cls, db: Session, clave: str, nuevo_valor):
        config = db.query(ConfiguracionSistema).filter_by(clave=clave).first()
        
        if config:
            config.valor = nuevo_valor
            db.commit()
            cls.cargar_cache(db)
                
                