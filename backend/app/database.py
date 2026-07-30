"""Motor de base de datos y sesión de SQLAlchemy."""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

_es_sqlite = settings.database_url.startswith("sqlite")

engine = create_engine(
    settings.database_url,
    # SQLite necesita esto para poder usarse desde los hilos de FastAPI.
    connect_args={"check_same_thread": False} if _es_sqlite else {},
    # Evita el clásico "MySQL server has gone away" con conexiones caducadas.
    pool_pre_ping=not _es_sqlite,
    pool_recycle=3600 if not _es_sqlite else -1,
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Clase base de todos los modelos ORM."""


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: abre una sesión y la cierra siempre."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def crear_tablas() -> None:
    """Crea las tablas que falten (útil en local y en tests)."""
    from app import models  # noqa: F401  (registra los modelos en el metadata)

    Base.metadata.create_all(bind=engine)
