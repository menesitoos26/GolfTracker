"""Gestión de torneos y competiciones del jugador."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, update

from app.deps import SesionBD, UsuarioActual
from app.models import Round, Tournament
from app.schemas import ActualizarTorneo, CrearTorneo, TorneoPublico
from app.services import resumen_torneo

router = APIRouter(prefix="/torneos", tags=["Torneos"])

TORNEO_NO_ENCONTRADO = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND, detail="Torneo no encontrado."
)


def _cargar_torneo(db: SesionBD, torneo_id: int, user_id: int) -> Tournament:
    torneo = db.scalars(
        select(Tournament).where(Tournament.id == torneo_id, Tournament.user_id == user_id)
    ).first()
    if torneo is None:
        raise TORNEO_NO_ENCONTRADO
    return torneo


def _a_publico(db: SesionBD, torneo: Tournament) -> TorneoPublico:
    return TorneoPublico.model_validate(
        {
            **{
                campo: getattr(torneo, campo)
                for campo in (
                    "id",
                    "name",
                    "location",
                    "start_date",
                    "end_date",
                    "final_position",
                    "notes",
                )
            },
            **resumen_torneo(db, torneo),
        }
    )


@router.post("", response_model=TorneoPublico, status_code=status.HTTP_201_CREATED)
def crear_torneo(datos: CrearTorneo, usuario: UsuarioActual, db: SesionBD) -> TorneoPublico:
    torneo = Tournament(user_id=usuario.id, **datos.model_dump())
    db.add(torneo)
    db.commit()
    db.refresh(torneo)
    return _a_publico(db, torneo)


@router.get("", response_model=list[TorneoPublico])
def listar_torneos(usuario: UsuarioActual, db: SesionBD) -> list[TorneoPublico]:
    torneos = db.scalars(
        select(Tournament)
        .where(Tournament.user_id == usuario.id)
        .order_by(Tournament.start_date.desc(), Tournament.id.desc())
    ).all()
    return [_a_publico(db, t) for t in torneos]


@router.get("/{torneo_id}", response_model=TorneoPublico)
def detalle_torneo(torneo_id: int, usuario: UsuarioActual, db: SesionBD) -> TorneoPublico:
    return _a_publico(db, _cargar_torneo(db, torneo_id, usuario.id))


@router.put("/{torneo_id}", response_model=TorneoPublico)
def actualizar_torneo(
    torneo_id: int, datos: ActualizarTorneo, usuario: UsuarioActual, db: SesionBD
) -> TorneoPublico:
    torneo = _cargar_torneo(db, torneo_id, usuario.id)

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(torneo, campo, valor)

    if torneo.end_date and torneo.end_date < torneo.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de fin no puede ser anterior a la de inicio.",
        )

    db.add(torneo)
    db.commit()
    db.refresh(torneo)
    return _a_publico(db, torneo)


@router.delete("/{torneo_id}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_torneo(torneo_id: int, usuario: UsuarioActual, db: SesionBD) -> None:
    torneo = _cargar_torneo(db, torneo_id, usuario.id)

    # Las rondas no se borran: sólo dejan de pertenecer al torneo.
    db.execute(
        update(Round).where(Round.tournament_id == torneo.id).values(tournament_id=None)
    )
    db.delete(torneo)
    db.commit()
