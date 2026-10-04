from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Player(Base):
    __tablename__ = "players"
    __table_args__ = (UniqueConstraint("sport", "external_id", "season"),)

    id: Mapped[int] = mapped_column(primary_key=True)

    # identity (from API)
    sport: Mapped[str] = mapped_column(String(20), index=True)
    external_id: Mapped[str] = mapped_column(String(64))
    season: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String(120))

    # shared attributes
    weight_lbs: Mapped[float | None] = mapped_column(Float)
    height_in: Mapped[float | None] = mapped_column(Float)
    age: Mapped[int | None] = mapped_column(Integer)
    dominant_hand: Mapped[str | None] = mapped_column(String(10)) # don't have yet
    injuries: Mapped[list | None] = mapped_column(JSON) # don't have yet
    games_played: Mapped[int] = mapped_column(Integer)

    # cached raw API stats (so we never refetch)
    raw_stats: Mapped[dict | None] = mapped_column(JSON)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime)

    # computed analytics (so we never recompute)
    offense_score: Mapped[float | None] = mapped_column(Float)
    defense_score: Mapped[float | None] = mapped_column(Float)
    physical_score: Mapped[float | None] = mapped_column(Float)
    offense_pct: Mapped[float | None] = mapped_column(Float)
    defense_pct: Mapped[float | None] = mapped_column(Float)
    physical_pct: Mapped[float | None] = mapped_column(Float)
    x: Mapped[float | None] = mapped_column(Float)
    y: Mapped[float | None] = mapped_column(Float)
    z: Mapped[float | None] = mapped_column(Float)
    computed_at: Mapped[datetime | None] = mapped_column(DateTime)