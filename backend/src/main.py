from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from src.infrastructure.api.routers import actividades_router
from src.infrastructure.api.routers import apertura_router
from src.infrastructure.api.routers import areas_router
from src.infrastructure.api.routers import asignaciones_router
from src.infrastructure.api.routers import categorias_router
from src.infrastructure.api.routers import ciclos_router
from src.infrastructure.api.routers import configuracion_router
from src.infrastructure.api.routers import docentes_router
from src.infrastructure.api.routers import materias_router
from src.infrastructure.api.routers import planes_estudios_router
from src.infrastructure.api.routers import programas_router
from src.infrastructure.api.routers import auth_router
from src.infrastructure.api.routers import oficios_router
from src.infrastructure.api.routers import horarios_router, preferencias_router
from src.infrastructure.api.routers import estatus_router
from src.infrastructure.security import require_roles

app = FastAPI(title="API SIPAD - Carga Académica")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Roles permitidos para los catálogos base
CATALOG_ROLES = ["SUPER_ADMIN", "SECRETARIA_ACADEMICA", "CAPTURISTA"]

# Routers (Aquí tenemos que ir poniendo los routers de las distintas entidades de la bd)
app.include_router(actividades_router.router, dependencies=[Depends(require_roles(CATALOG_ROLES))])
app.include_router(apertura_router.router, dependencies=[Depends(require_roles(CATALOG_ROLES))])
app.include_router(areas_router.router, dependencies=[Depends(require_roles(CATALOG_ROLES))])
app.include_router(asignaciones_router.router, dependencies=[Depends(require_roles(CATALOG_ROLES))])
app.include_router(auth_router.router)
app.include_router(oficios_router.router)
app.include_router(categorias_router.router, dependencies=[Depends(require_roles(CATALOG_ROLES))])
app.include_router(ciclos_router.router, dependencies=[Depends(require_roles(CATALOG_ROLES))])
app.include_router(configuracion_router.router, dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA"]))])
app.include_router(docentes_router.router, dependencies=[Depends(require_roles(CATALOG_ROLES))])
app.include_router(materias_router.router, dependencies=[Depends(require_roles(CATALOG_ROLES))])
app.include_router(planes_estudios_router.router, dependencies=[Depends(require_roles(CATALOG_ROLES))])
app.include_router(programas_router.router, dependencies=[Depends(require_roles(CATALOG_ROLES))])
app.include_router(horarios_router.router)
app.include_router(preferencias_router.router)
app.include_router(estatus_router.router, dependencies=[Depends(require_roles(["SUPER_ADMIN", "SECRETARIA_ACADEMICA", "CAPTURISTA"]))])

@app.get("/")
def root():
    return {"mensaje": "API de Carga Académica funcionando correctamente"}
