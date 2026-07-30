"""Tests de torneos y de su relación con las rondas."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from tests.conftest import tarjeta


@pytest.fixture
def otro_usuario(client):
    datos = client.post(
        "/auth/registro",
        json={"name": "Beto Rival", "email": "beto@example.com", "password": "Password123"},
    ).json()
    return {"headers": {"Authorization": f"Bearer {datos['access_token']}"}}


def crear_torneo(client, headers, **extra):
    cuerpo = {
        "name": "Copa de Primavera",
        "location": "Club de Campo",
        "start_date": date.today().isoformat(),
        **extra,
    }
    return client.post("/torneos", json=cuerpo, headers=headers)


def test_crear_y_listar_torneo(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    respuesta = crear_torneo(client, headers)

    assert respuesta.status_code == 201, respuesta.text
    assert respuesta.json()["rondas_jugadas"] == 0

    listado = client.get("/torneos", headers=headers).json()
    assert len(listado) == 1
    assert listado[0]["name"] == "Copa de Primavera"


def test_torneo_rechaza_fecha_fin_anterior(client, usuario_registrado):
    ayer = (date.today() - timedelta(days=3)).isoformat()
    respuesta = crear_torneo(client, usuario_registrado["headers"], end_date=ayer)
    assert respuesta.status_code == 422


def test_el_torneo_agrega_los_totales_de_sus_rondas(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    torneo_id = crear_torneo(client, headers).json()["id"]

    for golpes in ([4] * 18, [5] * 18):
        client.post(
            "/rondas",
            json={
                "course": {"name": "Club de Campo"},
                "holes": tarjeta(golpes),
                "tournament_id": torneo_id,
            },
            headers=headers,
        )

    detalle = client.get(f"/torneos/{torneo_id}", headers=headers).json()
    assert detalle["rondas_jugadas"] == 2
    assert detalle["total_golpes"] == 72 + 90
    assert detalle["total_par"] == 72 * 2
    assert detalle["diferencia_par"] == 18


def test_no_se_puede_asignar_una_ronda_al_torneo_de_otro(client, usuario_registrado, otro_usuario):
    torneo_ajeno = crear_torneo(client, otro_usuario["headers"]).json()["id"]

    respuesta = client.post(
        "/rondas",
        json={
            "course": {"name": "Club de Campo"},
            "holes": tarjeta([4] * 9),
            "tournament_id": torneo_ajeno,
        },
        headers=usuario_registrado["headers"],
    )
    assert respuesta.status_code == 404


def test_un_usuario_no_ve_los_torneos_de_otro(client, usuario_registrado, otro_usuario):
    crear_torneo(client, usuario_registrado["headers"])
    assert client.get("/torneos", headers=otro_usuario["headers"]).json() == []


def test_borrar_torneo_conserva_las_rondas(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    torneo_id = crear_torneo(client, headers).json()["id"]

    ronda_id = client.post(
        "/rondas",
        json={
            "course": {"name": "Club de Campo"},
            "holes": tarjeta([4] * 9),
            "tournament_id": torneo_id,
        },
        headers=headers,
    ).json()["ronda"]["id"]

    assert client.delete(f"/torneos/{torneo_id}", headers=headers).status_code == 204

    ronda = client.get(f"/rondas/{ronda_id}", headers=headers).json()
    assert ronda["tournament"] is None


def test_filtrar_rondas_por_torneo(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    torneo_id = crear_torneo(client, headers).json()["id"]

    client.post(
        "/rondas",
        json={
            "course": {"name": "Club A"},
            "holes": tarjeta([4] * 9),
            "tournament_id": torneo_id,
        },
        headers=headers,
    )
    client.post(
        "/rondas",
        json={"course": {"name": "Club B"}, "holes": tarjeta([4] * 9)},
        headers=headers,
    )

    assert client.get("/rondas", headers=headers).json()["total"] == 2
    assert client.get(f"/rondas?tournament_id={torneo_id}", headers=headers).json()["total"] == 1


def test_desasignar_torneo_de_una_ronda(client, usuario_registrado):
    headers = usuario_registrado["headers"]
    torneo_id = crear_torneo(client, headers).json()["id"]
    ronda_id = client.post(
        "/rondas",
        json={
            "course": {"name": "Club A"},
            "holes": tarjeta([4] * 9),
            "tournament_id": torneo_id,
        },
        headers=headers,
    ).json()["ronda"]["id"]

    respuesta = client.patch(
        f"/rondas/{ronda_id}", json={"quitar_torneo": True}, headers=headers
    )
    assert respuesta.status_code == 200
    assert respuesta.json()["tournament"] is None
