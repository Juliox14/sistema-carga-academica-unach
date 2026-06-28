from fastapi import FastAPI
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


app = FastAPI(title="API SIPAD - Carga Académica")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers (Aquí tenemos que ir poniendo los routers de las distintas entidades de la bd)
app.include_router(actividades_router.router)
app.include_router(apertura_router.router)
app.include_router(areas_router.router)
app.include_router(asignaciones_router.router)
app.include_router(categorias_router.router)
app.include_router(ciclos_router.router)
app.include_router(configuracion_router.router)
app.include_router(docentes_router.router)
app.include_router(materias_router.router)
app.include_router(planes_estudios_router.router)
app.include_router(programas_router.router)

@app.get("/")
def root():
    return {"mensaje": "API de Carga Académica funcionando correctamente"}
