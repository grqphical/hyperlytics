from datetime import datetime, timezone
from typing import NamedTuple

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Player


class Stat(NamedTuple):
    key: str                        # key inside raw_stats
    per_36: bool = False            # season total -> per-36-minute rate
    higher_is_better: bool = True   # False for stats like errors


class SportConfig(NamedTuple):
    minutes_key: str
    min_minutes: float              # drop low-minute players (noisy rates)
    offense: list[Stat]
    defense: list[Stat]


SPORTS = {
    "basketball": SportConfig(
        minutes_key="minutes",
        min_minutes=500,
        offense=[Stat("points", per_36=True), Stat("effective_fg_pct"), Stat("assists", per_36=True)],
        defense=[
            Stat("defensive_rebounds", per_36=True),
            Stat("steals", per_36=True),
            Stat("blocks", per_36=True),
        ],
    ),
    # "baseball": add once we have the baseball keys
}


# ---------- math helpers ----------

def zscore(s: pd.Series) -> pd.Series:
    """How many standard deviations each value is from the sport average."""
    std = s.std(ddof=0)
    if pd.isna(std) or std == 0:
        return s * 0.0
    return (s - s.mean()) / std


def percentile(s: pd.Series) -> pd.Series:
    """0-100 rank among players. NaNs stay NaN."""
    return s.rank(pct=True) * 100


def composite_score(df: pd.DataFrame, stats: list[Stat], minutes: pd.Series) -> pd.Series:
    """Z-score each stat, flip the sign where lower is better, then average them."""
    zs = []
    for stat in stats:
        values = pd.to_numeric(df[stat.key], errors="coerce")
        if stat.per_36:
            values = values / minutes * 36
        z = zscore(values)
        zs.append(z if stat.higher_is_better else -z)
    return pd.concat(zs, axis=1).mean(axis=1)


# ---------- load / save ----------

def load_players(db: Session, sport: str, season: int):
    """Load one sport + season into a DataFrame (index = player id)."""
    players = list(
        db.scalars(select(Player).where(Player.sport == sport, Player.season == season))
    )
    if not players:
        return players, pd.DataFrame()

    index = [p.id for p in players]
    stats = pd.json_normalize([p.raw_stats or {} for p in players])  # flattens nested keys too
    stats.index = index
    body = pd.DataFrame(
        {
            "height_in": [p.height_in for p in players],
            "weight_lbs": [p.weight_lbs for p in players],
        },
        index=index,
    )
    return players, body.join(stats)


def _clean(value):
    return None if pd.isna(value) else float(value)


def save_results(db: Session, players: list[Player], out: pd.DataFrame) -> None:
    """Write computed columns back to the players table."""
    now = datetime.now(timezone.utc)
    for p in players:
        row = out.loc[p.id]
        for col in out.columns:
            setattr(p, col, _clean(row[col]))
        p.computed_at = now
    db.commit()


# ---------- main entry points ----------

def compute_sport(db: Session, sport: str, season: int) -> int:
    cfg = SPORTS[sport]
    players, df = load_players(db, sport, season)
    if df.empty:
        return 0

    minutes = pd.to_numeric(df[cfg.minutes_key], errors="coerce")
    qualified = df[minutes >= cfg.min_minutes]

    out = pd.DataFrame(index=df.index)

    # X and Y: only players with enough minutes
    out["offense_score"] = composite_score(qualified, cfg.offense, minutes[qualified.index])
    out["defense_score"] = composite_score(qualified, cfg.defense, minutes[qualified.index])

    # Z: physical anomaly = average of height and weight z-scores (all players)
    height = pd.to_numeric(df["height_in"], errors="coerce")
    weight = pd.to_numeric(df["weight_lbs"], errors="coerce")
    out["physical_score"] = pd.concat([zscore(height), zscore(weight)], axis=1).mean(axis=1)

    for name in ("offense", "defense", "physical"):
        out[f"{name}_pct"] = percentile(out[f"{name}_score"])

    save_results(db, players, out)
    return len(players)


def compute_all() -> None:
    with SessionLocal() as db:
        pairs = db.execute(select(Player.sport, Player.season).distinct()).all()
        for sport, season in pairs:
            if sport not in SPORTS:
                print(f"Skipping {sport} {season}: no config yet")
                continue
            n = compute_sport(db, sport, season)
            print(f"{sport} {season}: computed {n} players")