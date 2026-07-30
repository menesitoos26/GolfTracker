"""Hasheo de contraseñas y emisión/verificación de tokens JWT."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.config import settings

# bcrypt sólo procesa los primeros 72 bytes; a partir de la versión 4 lanza
# ValueError si se le pasa algo más largo, así que lo controlamos nosotros.
LONGITUD_MAXIMA_PASSWORD_BYTES = 72


def password_demasiado_largo(password: str) -> bool:
    return len(password.encode("utf-8")) > LONGITUD_MAXIMA_PASSWORD_BYTES


def hashear_password(password: str) -> str:
    if password_demasiado_largo(password):
        raise ValueError("La contraseña supera el límite de 72 bytes.")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_password(password: str, password_hash: str) -> bool:
    """Comprueba la contraseña sin dejar que un hash corrupto tire la API."""
    if password_demasiado_largo(password):
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def crear_access_token(user_id: int, expira_en: timedelta | None = None) -> str:
    ahora = datetime.now(UTC)
    expiracion = ahora + (expira_en or timedelta(minutes=settings.access_token_expire_minutes))
    payload = {
        "sub": str(user_id),
        "iat": int(ahora.timestamp()),
        "exp": int(expiracion.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decodificar_access_token(token: str) -> int | None:
    """Devuelve el id de usuario del token, o None si no es válido."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        sub = payload.get("sub")
        return int(sub) if sub is not None else None
    except (jwt.InvalidTokenError, ValueError, TypeError):
        return None
