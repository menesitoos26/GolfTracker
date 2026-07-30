"""Tests del cálculo de hándicap (WHS)."""

from __future__ import annotations

from app.handicap import (
    MINIMO_RONDAS_PARA_HANDICAP,
    RondaParaHandicap,
    calcular_diferencial,
    calcular_handicap,
    golpes_ajustados,
)


def ronda(golpes_por_hoyo: list[int], par: int = 4, **extra) -> RondaParaHandicap:
    hoyos = tuple((par, g) for g in golpes_por_hoyo)
    return RondaParaHandicap(
        holes_played=len(golpes_por_hoyo),
        total_par=par * len(golpes_por_hoyo),
        hoyos=hoyos,
        **extra,
    )


def test_golpes_ajustados_limita_el_desastre_a_par_mas_cinco():
    # Un 15 en un par 4 cuenta como 9 (4 + 5).
    assert golpes_ajustados(((4, 15), (4, 4))) == 9 + 4


def test_diferencial_neutro_es_golpes_menos_par():
    assert calcular_diferencial(ronda([5] * 18)) == 18.0


def test_diferencial_de_nueve_hoyos_se_escala_a_dieciocho():
    # +9 en 9 hoyos equivale a +18 en 18.
    assert calcular_diferencial(ronda([5] * 9)) == 18.0


def test_diferencial_usa_valoracion_y_slope_si_se_indican():
    # (113/130) * (90 - 71) = 16.5
    resultado = calcular_diferencial(
        ronda([5] * 18, course_rating=71.0, slope_rating=130)
    )
    assert resultado == 16.5


def test_sin_rondas_suficientes_no_hay_handicap():
    rondas = [ronda([5] * 18)] * (MINIMO_RONDAS_PARA_HANDICAP - 1)
    assert calcular_handicap(rondas) is None


def test_con_tres_rondas_toma_la_mejor_y_resta_dos():
    rondas = [ronda([5] * 18), ronda([6] * 18), ronda([7] * 18)]  # +18, +36, +54
    assert calcular_handicap(rondas) == 16.0  # 18 - 2


def test_con_cinco_rondas_toma_la_mejor_sin_ajuste():
    rondas = [ronda([5] * 18), *[ronda([7] * 18)] * 4]
    assert calcular_handicap(rondas) == 18.0


def test_con_veinte_rondas_promedia_las_ocho_mejores():
    # 8 rondas a +10 y 12 rondas a +40 -> media de las 8 mejores = 10
    buenas = [ronda([5] * 18, par=4)] * 8  # +18 cada una
    malas = [ronda([8] * 18, par=4)] * 12  # +72 cada una
    assert calcular_handicap(buenas + malas) == 18.0


def test_solo_se_usan_las_veinte_rondas_mas_recientes():
    recientes = [ronda([8] * 18)] * 20  # todas malas
    antiguas = [ronda([4] * 18)] * 5  # excelentes, pero fuera de ventana
    resultado = calcular_handicap(recientes + antiguas)
    assert resultado == 54.0  # tope máximo


def test_el_handicap_nunca_supera_cincuenta_y_cuatro():
    rondas = [ronda([12] * 18)] * 20
    assert calcular_handicap(rondas) == 54.0


def test_ronda_vacia_se_ignora():
    assert calcular_diferencial(RondaParaHandicap(0, 0, ())) is None
