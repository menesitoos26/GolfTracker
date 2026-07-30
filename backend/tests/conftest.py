"""Configuración común de los tests: base de datos SQLite en memoria por test."""

from __future__ import annotations

import os

os.environ.setdefault("JWT_SECRET_KEY", "clave-de-pruebas-larga-y-suficiente-para-hs256")
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("ENVIRONMENT", "test")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # una única conexión compartida = BD en memoria estable
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    sesion = TestingSession()
    try:
        yield sesion
    finally:
        sesion.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as cliente:
        yield cliente
    app.dependency_overrides.clear()


@pytest.fixture
def usuario_registrado(client):
    """Crea un usuario y devuelve sus datos junto con la cabecera de autenticación."""
    respuesta = client.post(
        "/auth/registro",
        json={"name": "Ana Golfista", "email": "ana@example.com", "password": "Password123"},
    )
    assert respuesta.status_code == 201, respuesta.text
    datos = respuesta.json()
    return {
        "token": datos["access_token"],
        "user": datos["user"],
        "headers": {"Authorization": f"Bearer {datos['access_token']}"},
    }


def tarjeta(golpes_por_hoyo: list[int], pares: list[int] | None = None) -> list[dict]:
    """Construye una tarjeta de hoyos lista para enviar a la API."""
    pares = pares or [4] * len(golpes_por_hoyo)
    return [
        {"hole_number": i + 1, "par": pares[i], "strokes": golpes_por_hoyo[i]}
        for i in range(len(golpes_por_hoyo))
    ]
