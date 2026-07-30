"""Tests de registro, login y perfil."""

from __future__ import annotations


def test_registro_devuelve_token_y_usuario(client):
    respuesta = client.post(
        "/auth/registro",
        json={"name": "Ana Golfista", "email": "Ana@Example.com", "password": "Password123"},
    )

    assert respuesta.status_code == 201
    datos = respuesta.json()
    assert datos["access_token"]
    assert datos["user"]["email"] == "ana@example.com"  # se normaliza a minúsculas
    assert "password" not in datos["user"]
    assert "password_hash" not in datos["user"]


def test_registro_rechaza_email_duplicado(client, usuario_registrado):
    respuesta = client.post(
        "/auth/registro",
        json={"name": "Otra Persona", "email": "ana@example.com", "password": "Password123"},
    )
    assert respuesta.status_code == 409


def test_registro_rechaza_password_corta(client):
    respuesta = client.post(
        "/auth/registro",
        json={"name": "Ana", "email": "corta@example.com", "password": "123"},
    )
    assert respuesta.status_code == 422


def test_registro_rechaza_email_invalido(client):
    respuesta = client.post(
        "/auth/registro",
        json={"name": "Ana", "email": "esto-no-es-un-email", "password": "Password123"},
    )
    assert respuesta.status_code == 422


def test_login_correcto(client, usuario_registrado):
    respuesta = client.post(
        "/auth/login", json={"email": "ana@example.com", "password": "Password123"}
    )
    assert respuesta.status_code == 200
    assert respuesta.json()["access_token"]


def test_login_password_incorrecta(client, usuario_registrado):
    respuesta = client.post(
        "/auth/login", json={"email": "ana@example.com", "password": "otraCosa123"}
    )
    assert respuesta.status_code == 401
    # El mensaje no debe delatar si el correo existe.
    assert respuesta.json()["detail"] == "Correo o contraseña incorrectos."


def test_login_usuario_inexistente_da_el_mismo_error(client):
    respuesta = client.post(
        "/auth/login", json={"email": "nadie@example.com", "password": "Password123"}
    )
    assert respuesta.status_code == 401
    assert respuesta.json()["detail"] == "Correo o contraseña incorrectos."


def test_me_requiere_token(client):
    assert client.get("/auth/me").status_code == 401


def test_me_rechaza_token_invalido(client):
    respuesta = client.get("/auth/me", headers={"Authorization": "Bearer token-falso"})
    assert respuesta.status_code == 401


def test_me_devuelve_el_perfil(client, usuario_registrado):
    respuesta = client.get("/auth/me", headers=usuario_registrado["headers"])
    assert respuesta.status_code == 200
    assert respuesta.json()["email"] == "ana@example.com"


def test_cambiar_nombre_no_pide_password(client, usuario_registrado):
    respuesta = client.put(
        "/auth/me", json={"name": "Ana Actualizada"}, headers=usuario_registrado["headers"]
    )
    assert respuesta.status_code == 200
    assert respuesta.json()["name"] == "Ana Actualizada"


def test_cambiar_password_exige_la_actual(client, usuario_registrado):
    respuesta = client.put(
        "/auth/me", json={"password": "NuevaPassword123"}, headers=usuario_registrado["headers"]
    )
    assert respuesta.status_code == 400


def test_cambiar_password_con_la_actual_correcta(client, usuario_registrado):
    respuesta = client.put(
        "/auth/me",
        json={"password": "NuevaPassword123", "current_password": "Password123"},
        headers=usuario_registrado["headers"],
    )
    assert respuesta.status_code == 200

    assert (
        client.post(
            "/auth/login", json={"email": "ana@example.com", "password": "NuevaPassword123"}
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/auth/login", json={"email": "ana@example.com", "password": "Password123"}
        ).status_code
        == 401
    )


def test_no_se_puede_robar_el_email_de_otro(client, usuario_registrado):
    client.post(
        "/auth/registro",
        json={"name": "Beto", "email": "beto@example.com", "password": "Password123"},
    )
    respuesta = client.put(
        "/auth/me",
        json={"email": "beto@example.com", "current_password": "Password123"},
        headers=usuario_registrado["headers"],
    )
    assert respuesta.status_code == 409
