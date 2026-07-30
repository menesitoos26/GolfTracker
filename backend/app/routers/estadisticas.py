"""Panel de estadísticas agregadas del jugador."""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import SesionBD, UsuarioActual
from app.schemas import EstadisticasRespuesta
from app.services import calcular_estadisticas

router = APIRouter(prefix="/estadisticas", tags=["Estadísticas"])


@router.get("", response_model=EstadisticasRespuesta)
def estadisticas(usuario: UsuarioActual, db: SesionBD) -> EstadisticasRespuesta:
    return calcular_estadisticas(db, usuario)
