"""Tests del registro de rondas y del aislamiento entre usuarios."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from tests.conftest import tarjeta


@pytest.fixture
def otro_usuario(client):
    respuesta = client.post(
        "/auth/registro",
        json={"name": "Beto Rival", "email": "beto@example.com", "password": "Password123"},
    )
    datos = respuesta.json()
    return {"headers": {"Authorization": f"Bearer {datos['access_token']}"}}


def crear_ronda(client, headers, golpes=None, **extra):
    cuerpo = {
        "course": {"name": "Club de Campo", "city": "Madrid", "country": "España"},
        "holes": tarjeta(golpes or [4, 5, 3, 4, 4, 6, 3, 4, 5]),
        **extra,
    }
    return client.post("/rondas", json=cuerpo, headers=headers)


def test_crear_ronda_calcula_totales_en_el_servidor(client, usuario_registrado):
    respuesta = crear_ronda(client, usuario_registrado["headers"])

    assert respuesta.status_code == 201, respuesta.text
    ronda = respuesta.json()["ronda"]
    assert ronda["holes_played"] == 9
    assert ronda["total_par"] == 36
    assert ronda["total_strokes"] == 38
    assert ronda["diferencia_par"] == 2
    assert ronda["course"]["name"] == "Club de Campo"


def test_crear_ronda_requiere_autenticacion(client):
    respuesta = client.post(
        "/rondas",
        json={"course": {"name": "Club de Campo"}, "holes": tarjeta([4, 4, 4])},
    )
    assert respuesta.status_code == 401


def test_no_se_puede_registrar_una_ronda_en_el_futuro(client, usuario_registrado):
    manana = (date.today() + timedelta(days=1)).isoformat()
    respuesta = crear_ronda(client, usuario_registrado["headers"], played_on=manana)
    assert respuesta.status_code == 422


def test_rechaza_hoyos_repetidos(client, usuario_registrado):
    hoyos = [
        {"hole_number": 1, "par": 4, "strokes": 4},
        {"hole_number": 1, "par": 4, "strokes": 5},
    ]
    respuesta = client.post(
        "/rondas",
        json={"course": {"name": "Club X"}, "holes": hoyos},
        headers=usuario_registrado["headers"],
    )
    assert respuesta.status_code == 422


def test_rechaza_putts_mayores_que_golpes(client, usuario_registrado):
    hoyos = [{"hole_number": 1, "par": 4, "strokes": 3, "putts": 4}]
    respuesta = client.post(
        "/rondas",
        json={"course": {"name": "Club X"}, "holes": hoyos},
        headers=usuario_registrado["headers"],
    )
    assert respuesta.status_code == 422


def test_rechaza_tarjeta_vacia(client, usuario_registrado):
    respuesta = client.post(
        "/rondas",
        json={"course": {"name": "Club X"}, "holes": []},
        headers=usuario_registrado["headers"],
    )
    assert respuesta.status_code == 422


def test_el_campo_se_reutiliza_y_no_se_duplica(client, usuario_registrado):
    primera = crear_ronda(client, usuario_registrado["headers"], golpes=[4] * 9)
    segunda = crear_ronda(client, usuario_registrado["headers"], golpes=[5] * 18)

    assert primera.json()["ronda"]["course"]["id"] == segunda.json()["ronda"]["course"]["id"]


def test_listado_paginado_y_ordenado(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    for dias in range(3):
        crear_ronda(
            client, headers, played_on=(date.today() - timedelta(days=dias)).isoformat()
        )

    respuesta = client.get("/rondas?limit=2", headers=headers)
    datos = respuesta.json()

    assert datos["total"] == 3
    assert len(datos["items"]) == 2
    # Más reciente primero
    assert datos["items"][0]["played_on"] > datos["items"][1]["played_on"]


def test_un_usuario_no_ve_las_rondas_de_otro(client, usuario_registrado, otro_usuario):
    crear_ronda(client, usuario_registrado["headers"])

    respuesta = client.get("/rondas", headers=otro_usuario["headers"])
    assert respuesta.json()["total"] == 0


def test_un_usuario_no_puede_leer_la_ronda_de_otro(client, usuario_registrado, otro_usuario):
    ronda_id = crear_ronda(client, usuario_registrado["headers"]).json()["ronda"]["id"]

    respuesta = client.get(f"/rondas/{ronda_id}", headers=otro_usuario["headers"])
    assert respuesta.status_code == 404


def test_un_usuario_no_puede_borrar_la_ronda_de_otro(client, usuario_registrado, otro_usuario):
    ronda_id = crear_ronda(client, usuario_registrado["headers"]).json()["ronda"]["id"]

    borrado = client.delete(f"/rondas/{ronda_id}", headers=otro_usuario["headers"])
    assert borrado.status_code == 404

    # Y la ronda sigue existiendo para su dueño.
    propia = client.get(f"/rondas/{ronda_id}", headers=usuario_registrado["headers"])
    assert propia.status_code == 200


def test_borrar_ronda_propia(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    ronda_id = crear_ronda(client, headers).json()["ronda"]["id"]

    assert client.delete(f"/rondas/{ronda_id}", headers=headers).status_code == 204
    assert client.get(f"/rondas/{ronda_id}", headers=headers).status_code == 404


def test_detalle_incluye_la_tarjeta_completa(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    ronda_id = crear_ronda(client, headers).json()["ronda"]["id"]

    detalle = client.get(f"/rondas/{ronda_id}", headers=headers).json()
    assert len(detalle["holes"]) == 9
    assert detalle["holes"][0]["hole_number"] == 1


def test_ultima_ronda_sin_rondas_devuelve_null(client, usuario_registrado):
    respuesta = client.get("/rondas/ultima", headers=usuario_registrado["headers"])
    assert respuesta.status_code == 200
    assert respuesta.json() is None


def test_ultima_ronda_devuelve_la_mas_reciente(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    crear_ronda(client, headers, played_on=(date.today() - timedelta(days=5)).isoformat())
    crear_ronda(client, headers, golpes=[3] * 9, played_on=date.today().isoformat())

    ultima = client.get("/rondas/ultima", headers=headers).json()
    assert ultima["total_strokes"] == 27


def test_total_putts_solo_si_estan_todos(client, usuario_registrado):
    headers = usuario_registrado["headers"]

    completos = [
        {"hole_number": i + 1, "par": 4, "strokes": 4, "putts": 2} for i in range(9)
    ]
    respuesta = client.post(
        "/rondas", json={"course": {"name": "Club Putts"}, "holes": completos}, headers=headers
    )
    assert respuesta.json()["ronda"]["total_putts"] == 18

    parciales = [{"hole_number": i + 1, "par": 4, "strokes": 4} for i in range(9)]
    parciales[0]["putts"] = 2
    respuesta = client.post(
        "/rondas", json={"course": {"name": "Club Sin Putts"}, "holes": parciales}, headers=headers
    )
    assert respuesta.json()["ronda"]["total_putts"] is None
