"""Tests del panel de estadísticas."""

from __future__ import annotations

from datetime import date, timedelta


def test_estadisticas_sin_rondas(client, usuario_registrado):
    datos = client.get("/estadisticas", headers=usuario_registrado["headers"]).json()

    assert datos["resumen"]["total_rondas"] == 0
    assert datos["resumen"]["handicap"] is None
    assert datos["reparto"]["total_hoyos"] == 0
    assert datos["evolucion"] == []


def test_reparto_clasifica_cada_hoyo(client, usuario_registrado):
    hoyos = [
        {"hole_number": 1, "par": 5, "strokes": 3},  # eagle (-2)
        {"hole_number": 2, "par": 4, "strokes": 3},  # birdie (-1)
        {"hole_number": 3, "par": 4, "strokes": 4},  # par
        {"hole_number": 4, "par": 4, "strokes": 5},  # bogey (+1)
        {"hole_number": 5, "par": 3, "strokes": 5},  # doble (+2)
        {"hole_number": 6, "par": 3, "strokes": 7},  # triple o más (+4)
    ]
    client.post(
        "/rondas",
        json={"course": {"name": "Club Test"}, "holes": hoyos},
        headers=usuario_registrado["headers"],
    )

    reparto = client.get("/estadisticas", headers=usuario_registrado["headers"]).json()["reparto"]

    assert reparto == {
        "eagles": 1,
        "birdies": 1,
        "pares": 1,
        "bogeys": 1,
        "dobles": 1,
        "triples_o_mas": 1,
        "total_hoyos": 6,
    }


def test_media_por_tipo_de_par(client, usuario_registrado):
    hoyos = [
        {"hole_number": 1, "par": 3, "strokes": 4},
        {"hole_number": 2, "par": 3, "strokes": 4},
        {"hole_number": 3, "par": 5, "strokes": 5},
    ]
    client.post(
        "/rondas",
        json={"course": {"name": "Club Test"}, "holes": hoyos},
        headers=usuario_registrado["headers"],
    )

    por_par = client.get("/estadisticas", headers=usuario_registrado["headers"]).json()["por_par"]
    por_par = {p["par"]: p for p in por_par}

    assert por_par[3]["hoyos_jugados"] == 2
    assert por_par[3]["media_golpes"] == 4.0
    assert por_par[3]["media_sobre_par"] == 1.0
    assert por_par[5]["media_sobre_par"] == 0.0


def test_porcentajes_de_calles_y_greenes(client, usuario_registrado):
    def hoyo(numero, par, calle, green):
        return {
            "hole_number": numero,
            "par": par,
            "strokes": par + 1,
            "fairway_hit": calle,
            "green_in_regulation": green,
        }

    hoyos = [
        hoyo(1, 3, False, True),  # el par 3 no cuenta para el % de calles
        hoyo(2, 4, True, True),
        hoyo(3, 4, False, False),
        hoyo(4, 5, True, False),
    ]
    client.post(
        "/rondas",
        json={"course": {"name": "Club Test"}, "holes": hoyos},
        headers=usuario_registrado["headers"],
    )

    resumen = client.get("/estadisticas", headers=usuario_registrado["headers"]).json()["resumen"]

    assert resumen["porcentaje_calles"] == 66.7  # 2 de 3 hoyos de par 4/5
    assert resumen["porcentaje_greenes"] == 50.0  # 2 de 4


def test_medias_normalizadas_a_dieciocho_hoyos(client, usuario_registrado):
    headers = usuario_registrado["headers"]

    # Ronda de 9 hoyos con +9 -> equivale a +18 en 18 hoyos.
    client.post(
        "/rondas",
        json={
            "course": {"name": "Club 9"},
            "holes": [{"hole_number": i + 1, "par": 4, "strokes": 5} for i in range(9)],
        },
        headers=headers,
    )

    resumen = client.get("/estadisticas", headers=headers).json()["resumen"]
    assert resumen["media_sobre_par_18"] == 18.0
    assert resumen["media_golpes_18"] == 90.0
    assert resumen["mejor_ronda_sobre_par"] == 9  # sin normalizar, tal cual se jugó


def test_evolucion_ordenada_de_antigua_a_reciente(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    for dias in (10, 5, 0):
        client.post(
            "/rondas",
            json={
                "course": {"name": "Club Test"},
                "holes": [{"hole_number": i + 1, "par": 4, "strokes": 4} for i in range(9)],
                "played_on": (date.today() - timedelta(days=dias)).isoformat(),
            },
            headers=headers,
        )

    evolucion = client.get("/estadisticas", headers=headers).json()["evolucion"]
    fechas = [p["played_on"] for p in evolucion]

    assert len(evolucion) == 3
    assert fechas == sorted(fechas)


def test_las_estadisticas_solo_incluyen_rondas_propias(client, usuario_registrado):
    otro = client.post(
        "/auth/registro",
        json={"name": "Beto", "email": "beto@example.com", "password": "Password123"},
    ).json()
    headers_otro = {"Authorization": f"Bearer {otro['access_token']}"}

    client.post(
        "/rondas",
        json={
            "course": {"name": "Club Ajeno"},
            "holes": [{"hole_number": 1, "par": 4, "strokes": 9}],
        },
        headers=headers_otro,
    )

    resumen = client.get("/estadisticas", headers=usuario_registrado["headers"]).json()["resumen"]
    assert resumen["total_rondas"] == 0


def test_handicap_aparece_tras_tres_rondas(client, usuario_registrado):
    headers = usuario_registrado["headers"]

    for i in range(3):
        client.post(
            "/rondas",
            json={
                "course": {"name": "Club Test"},
                "holes": [{"hole_number": h + 1, "par": 4, "strokes": 5} for h in range(18)],
                "played_on": (date.today() - timedelta(days=i)).isoformat(),
            },
            headers=headers,
        )

    perfil = client.get("/auth/me", headers=headers).json()
    assert perfil["handicap"] == 16.0  # (+18 mejor diferencial) - 2 de ajuste


def test_borrar_una_ronda_recalcula_el_handicap(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    ids = []

    for i in range(3):
        respuesta = client.post(
            "/rondas",
            json={
                "course": {"name": "Club Test"},
                "holes": [{"hole_number": h + 1, "par": 4, "strokes": 5} for h in range(18)],
                "played_on": (date.today() - timedelta(days=i)).isoformat(),
            },
            headers=headers,
        )
        ids.append(respuesta.json()["ronda"]["id"])

    assert client.get("/auth/me", headers=headers).json()["handicap"] == 16.0

    client.delete(f"/rondas/{ids[0]}", headers=headers)
    # Con sólo 2 rondas ya no hay hándicap calculable.
    assert client.get("/auth/me", headers=headers).json()["handicap"] is None
