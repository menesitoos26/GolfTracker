"""Registro, inicio de sesión y gestión del perfil."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import SesionBD, UsuarioActual
from app.models import User
from app.schemas import (
    ActualizarUsuario,
    LoginUsuario,
    RegistroUsuario,
    TokenRespuesta,
    UsuarioPublico,
)
from app.security import crear_access_token, hashear_password, verificar_password

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Mensaje genérico a propósito: no revelamos si el correo existe o no.
CREDENCIALES_ERRONEAS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Correo o contraseña incorrectos.",
)


def _normalizar_email(email: str) -> str:
    return email.strip().lower()


@router.post("/registro", response_model=TokenRespuesta, status_code=status.HTTP_201_CREATED)
def registrar(datos: RegistroUsuario, db: SesionBD) -> TokenRespuesta:
    email = _normalizar_email(datos.email)

    if db.scalars(select(User).where(User.email == email)).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese correo electrónico.",
        )

    usuario = User(
        name=datos.name,
        email=email,
        password_hash=hashear_password(datos.password),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return TokenRespuesta(
        access_token=crear_access_token(usuario.id),
        user=UsuarioPublico.model_validate(usuario),
    )


@router.post("/login", response_model=TokenRespuesta)
def login(datos: LoginUsuario, db: SesionBD) -> TokenRespuesta:
    usuario = db.scalars(
        select(User).where(User.email == _normalizar_email(datos.email))
    ).first()

    if usuario is None or not verificar_password(datos.password, usuario.password_hash):
        raise CREDENCIALES_ERRONEAS

    return TokenRespuesta(
        access_token=crear_access_token(usuario.id),
        user=UsuarioPublico.model_validate(usuario),
    )


@router.get("/me", response_model=UsuarioPublico)
def perfil(usuario: UsuarioActual) -> User:
    return usuario


@router.put("/me", response_model=UsuarioPublico)
def actualizar_perfil(datos: ActualizarUsuario, usuario: UsuarioActual, db: SesionBD) -> User:
    cambia_email = datos.email is not None and _normalizar_email(datos.email) != usuario.email
    cambia_password = bool(datos.password)

    # Cambiar credenciales exige confirmar la contraseña actual.
    if (cambia_email or cambia_password) and (
        not datos.current_password
        or not verificar_password(datos.current_password, usuario.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes indicar tu contraseña actual para cambiar el correo o la contraseña.",
        )

    if cambia_email:
        email = _normalizar_email(datos.email)  # type: ignore[arg-type]
        ocupado = db.scalars(
            select(User).where(User.email == email, User.id != usuario.id)
        ).first()
        if ocupado:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ese correo ya está registrado por otra persona.",
            )
        usuario.email = email

    if datos.name:
        usuario.name = datos.name

    if cambia_password:
        usuario.password_hash = hashear_password(datos.password)  # type: ignore[arg-type]

    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario
