"""Búsqueda de campos de golf.

La clave de la API externa vive aquí, en el servidor. Antes se enviaba dentro
del bundle de React, con lo que cualquiera podía leerla desde el navegador.
"""

from __future__ import annotations

import logging
import time

import httpx
from fastapi import APIRouter, Query
from sqlalchemy import select

from app.config import settings
from app.deps import SesionBD, UsuarioActual
from app.models import Course, Round
from app.schemas import CampoPublico

router = APIRouter(prefix="/campos", tags=["Campos"])
logger = logging.getLogger(__name__)

TIEMPO_CACHE_SEGUNDOS = 60 * 60
_cache: dict[str, tuple[float, list[dict]]] = {}


class SugerenciaCampo(CampoPublico):
    id: int = 0


def _de_cache(clave: str) -> list[dict] | None:
    entrada = _cache.get(clave)
    if entrada and time.monotonic() - entrada[0] < TIEMPO_CACHE_SEGUNDOS:
        return entrada[1]
    return None


async def _buscar_en_api_externa(busqueda: str) -> list[dict]:
    """Consulta la API pública de campos. Devuelve [] si falla o no hay clave."""
    if not settings.golf_course_api_key:
        return []

    clave_cache = busqueda.lower()
    if (cacheado := _de_cache(clave_cache)) is not None:
        return cacheado

    try:
        async with httpx.AsyncClient(timeout=6.0) as cliente:
            respuesta = await cliente.get(
                f"{settings.golf_course_api_url}/search",
                params={"search_query": busqueda},
                headers={"Authorization": f"Key {settings.golf_course_api_key}"},
            )
            respuesta.raise_for_status()
            datos = respuesta.json()
    except (httpx.HTTPError, ValueError) as error:
        # Un fallo de la API externa no debe romper el registro de rondas.
        logger.warning("No se pudo consultar la API de campos: %s", error)
        return []

    resultados: list[dict] = []
    vistos: set[str] = set()

    for campo in datos.get("courses", []) or []:
        nombre = (campo.get("club_name") or campo.get("course_name") or "").strip()
        if not nombre or nombre.lower() in vistos:
            continue
        vistos.add(nombre.lower())
        ubicacion = campo.get("location") or {}
        resultados.append(
            {
                "id": 0,
                "name": nombre,
                "city": (ubicacion.get("city") or "").strip() or None,
                "country": (ubicacion.get("country") or "").strip() or None,
            }
        )

    resultados = resultados[:20]
    _cache[clave_cache] = (time.monotonic(), resultados)
    return resultados


@router.get("", response_model=list[SugerenciaCampo])
async def buscar_campos(
    usuario: UsuarioActual,
    db: SesionBD,
    q: str = Query(default="", max_length=100, description="Texto a buscar"),
) -> list[dict]:
    """Devuelve primero los campos donde el jugador ya ha jugado y luego los de la API."""
    busqueda = q.strip()

    consulta = (
        select(Course)
        .join(Round, Round.course_id == Course.id)
        .where(Round.user_id == usuario.id)
        .distinct()
        .order_by(Course.name)
    )
    if busqueda:
        consulta = consulta.where(Course.name.ilike(f"%{busqueda}%"))

    propios = [
        {"id": c.id, "name": c.name, "city": c.city, "country": c.country}
        for c in db.scalars(consulta).all()
    ]

    if len(busqueda) < 3:
        return propios

    nombres_propios = {c["name"].lower() for c in propios}
    externos = [
        c for c in await _buscar_en_api_externa(busqueda)
        if c["name"].lower() not in nombres_propios
    ]

    return propios + externos
