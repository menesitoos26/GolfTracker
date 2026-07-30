"""Punto de entrada de la API de Golf Tracker."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database import crear_tablas, engine
from app.routers import auth, campos, estadisticas, rondas, torneos

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)
logger = logging.getLogger("golftracker")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # En SQLite (desarrollo/tests) creamos el esquema al vuelo. En MySQL el
    # esquema lo gestiona docker/init.sql, así que no tocamos nada.
    if settings.database_url.startswith("sqlite"):
        crear_tablas()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API para registrar rondas de golf, torneos y estadísticas.",
    lifespan=lifespan,
    # La documentación interactiva sólo se expone fuera de producción.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(SQLAlchemyError)
async def error_base_datos(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Nunca devolvemos al cliente el detalle interno de un fallo de BD."""
    logger.exception("Error de base de datos en %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "La base de datos no está disponible. Inténtalo de nuevo."},
    )


@app.get("/", tags=["Estado"])
def raiz() -> dict[str, str]:
    return {"servicio": settings.app_name, "version": settings.app_version, "estado": "ok"}


@app.get("/health", tags=["Estado"])
def health() -> JSONResponse:
    """Health check real: comprueba que la base de datos responde."""
    try:
        with engine.connect() as conexion:
            conexion.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("Health check fallido: la base de datos no responde")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "database": "down"},
        )
    return JSONResponse(content={"status": "ok", "database": "up"})


app.include_router(auth.router)
app.include_router(campos.router)
app.include_router(rondas.router)
app.include_router(torneos.router)
app.include_router(estadisticas.router)
