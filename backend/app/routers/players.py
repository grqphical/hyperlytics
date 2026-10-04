from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Player

router = APIRouter(prefix="/players", tags=["players"])


class PlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sport: str
    name: str
    age: int | None
    weight_lbs: float | None
    height_in: float | None
    dominant_hand: str | None
    offense_pct: float | None
    defense_pct: float | None
    physical_pct: float | None
    games_played: int | None
    x: float | None
    y: float | None
    z: float | None


@router.get("", response_model=list[PlayerOut])
def list_players(
    sport: Literal["basketball", "hockey"],
    season: int | None = None,
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
):
    stmt = select(Player).where(Player.sport == sport)
    if season is not None:
        stmt = stmt.where(Player.season == season)
    return db.scalars(stmt.limit(limit)).all()