"""Cálculo del hándicap siguiendo el World Handicap System (WHS).

Se implementa la versión aplicable a un jugador que todavía no tiene hándicap
oficial, que es el caso de uso real de esta aplicación:

1. Cada ronda produce un *diferencial*:
       diferencial = (113 / slope) * (golpes ajustados - valoración del campo)
   Si el jugador no conoce la valoración/slope del campo se usan los valores
   neutros (valoración = par jugado, slope = 113), con lo que el diferencial
   queda en "golpes - par", que es lo que entiende un amateur.

2. Los golpes de cada hoyo se limitan a `par + 5`, que es el tope que marca el
   WHS para jugadores sin hándicap establecido (evita que un hoyo desastroso
   distorsione todo el cálculo).

3. Las rondas de 9 hoyos se escalan a 18 para poder mezclarlas.

4. El índice es la media de los N mejores diferenciales de las 20 rondas más
   recientes, según la tabla oficial del WHS.
"""

from __future__ import annotations

from dataclasses import dataclass

SLOPE_NEUTRO = 113
MAXIMO_RONDAS_CONSIDERADAS = 20
MINIMO_RONDAS_PARA_HANDICAP = 3
HANDICAP_MAXIMO = 54.0
GOLPES_EXTRA_MAXIMOS_POR_HOYO = 5

# (nº de diferenciales disponibles) -> (cuántos se promedian, ajuste a aplicar)
TABLA_WHS: dict[int, tuple[int, float]] = {
    3: (1, -2.0),
    4: (1, -1.0),
    5: (1, 0.0),
    6: (2, -1.0),
    7: (2, 0.0),
    8: (2, 0.0),
    9: (3, 0.0),
    10: (3, 0.0),
    11: (4, 0.0),
    12: (4, 0.0),
    13: (5, 0.0),
    14: (5, 0.0),
    15: (6, 0.0),
    16: (6, 0.0),
    17: (7, 0.0),
    18: (7, 0.0),
    19: (8, 0.0),
    20: (8, 0.0),
}


@dataclass(frozen=True)
class RondaParaHandicap:
    """Datos mínimos de una ronda necesarios para calcular su diferencial."""

    holes_played: int
    total_par: int
    # Pares y golpes hoyo a hoyo, para poder aplicar el tope por hoyo.
    hoyos: tuple[tuple[int, int], ...]  # (par, golpes)
    course_rating: float | None = None
    slope_rating: int | None = None


def golpes_ajustados(hoyos: tuple[tuple[int, int], ...]) -> int:
    """Suma los golpes aplicando el tope de par + 5 por hoyo."""
    return sum(min(golpes, par + GOLPES_EXTRA_MAXIMOS_POR_HOYO) for par, golpes in hoyos)


def calcular_diferencial(ronda: RondaParaHandicap) -> float | None:
    """Diferencial de una ronda, normalizado a 18 hoyos."""
    if ronda.holes_played <= 0 or not ronda.hoyos:
        return None

    valoracion = (
        float(ronda.course_rating) if ronda.course_rating is not None else float(ronda.total_par)
    )
    slope = int(ronda.slope_rating) if ronda.slope_rating else SLOPE_NEUTRO
    if slope <= 0:
        slope = SLOPE_NEUTRO

    diferencial = (SLOPE_NEUTRO / slope) * (golpes_ajustados(ronda.hoyos) - valoracion)

    # Escalamos a 18 hoyos: una ronda de 9 vale la mitad que una de 18.
    if ronda.holes_played < 18:
        diferencial *= 18 / ronda.holes_played

    return round(diferencial, 1)


def calcular_handicap(rondas: list[RondaParaHandicap]) -> float | None:
    """Índice de hándicap a partir de las rondas ordenadas de más reciente a más antigua.

    Devuelve None si aún no hay rondas suficientes (mínimo 3).
    """
    diferenciales = [
        d for d in (calcular_diferencial(r) for r in rondas[:MAXIMO_RONDAS_CONSIDERADAS])
        if d is not None
    ]

    if len(diferenciales) < MINIMO_RONDAS_PARA_HANDICAP:
        return None

    cuantos, ajuste = TABLA_WHS[min(len(diferenciales), MAXIMO_RONDAS_CONSIDERADAS)]
    mejores = sorted(diferenciales)[:cuantos]
    indice = sum(mejores) / len(mejores) + ajuste

    return round(min(indice, HANDICAP_MAXIMO), 1)
