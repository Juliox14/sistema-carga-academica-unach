import os
from uuid import uuid4
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv

from src.infrastructure.api.routers import actividades_router
from src.infrastructure.api.routers import apertura_router
from src.infrastructure.api.routers import areas_router
from src.infrastructure.api.routers import categorias_router
from src.infrastructure.api.routers import ciclos_router
from src.infrastructure.api.routers import docentes_router
from src.infrastructure.api.routers import materias_router
from src.infrastructure.api.routers import planes_estudios_router
from src.infrastructure.api.routers import programas_router
from src.infrastructure.api.routers import auth_router
from src.infrastructure.config.logging_config import setup_logging_collection
from src.infrastructure.adapters.output.logging import (
    ConsoleLoggerAdapter,
    MongoLoggerAdapter,
    CompositeLoggerAdapter,
)
from src.application.ports.output.logger_port import LoggerPort

load_dotenv()


# Logging Initialization
def _init_logging(app_instance) -> None:
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongo_db = os.getenv("MONGO_DB", "carga_academica")
    service_name = os.getenv("SERVICE_NAME", "sipad-api")
    log_to_console = os.getenv("LOG_TO_CONSOLE", "true").lower() == "true"

    try:
        mongo_client = MongoClient(mongo_uri)
        logs_collection = setup_logging_collection(mongo_client, mongo_db)

        adapters = []

        if log_to_console:
            adapters.append(ConsoleLoggerAdapter())

        adapters.append(MongoLoggerAdapter(logs_collection, service_name))

        composite_logger = CompositeLoggerAdapter(adapters)
        app_instance.state.logger = composite_logger
        app_instance.state.mongo_client = mongo_client

    except Exception as err:
        print(f"Error initializing logging: {err}")
        raise


# Lifespan context manager
@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    """Handle application lifespan events (startup and shutdown)."""
    # Startup
    _init_logging(app_instance)
    yield
    # Shutdown
    if hasattr(app_instance.state, "mongo_client"):
        app_instance.state.mongo_client.close()


app = FastAPI(title="API SIPAD - Carga Académica", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware for Trace ID
@app.middleware("http")
async def add_trace_id_middleware(request: Request, call_next):
    """Add or propagate X-Trace-Id header through request lifecycle."""
    trace_id = request.headers.get("X-Trace-Id", str(uuid4()))
    request.state.trace_id = trace_id

    response = await call_next(request)
    response.headers["X-Trace-Id"] = trace_id

    return response


# Deps
def get_logger() -> LoggerPort:
    return app.state.logger

# Routers
app.include_router(auth_router.router)
app.include_router(actividades_router.router)
app.include_router(apertura_router.router)
app.include_router(areas_router.router)
app.include_router(categorias_router.router)
app.include_router(ciclos_router.router)
app.include_router(docentes_router.router)
app.include_router(materias_router.router)
app.include_router(planes_estudios_router.router)
app.include_router(programas_router.router)


# Endpoints
@app.get("/")
def root(logger: LoggerPort = Depends(get_logger)):
    logger.info("GET / - root endpoint called")
    return {"mensaje": "API de Carga Académica funcionando correctamente"}