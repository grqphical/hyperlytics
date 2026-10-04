import json
from datetime import datetime, timezone
from pathlib import Path

from app.database import Base, SessionLocal, engine
from app.models import Player

DATA_FILES = [
    Path("data/NBA/nba_players.json"),
    Path("data/NHL/nhl_players.json"),
]

# Keys that map to real columns. Everything else goes into raw_stats.
IDENTITY_KEYS = {
    "id", "name", "sport", "year",
    "weight_lbs", "height_in", "age", "dominant_hand", "injuries",
}


def parse_player(raw: dict) -> dict:
    return {
        "sport": raw["sport"].lower(),
        "season": raw["year"],
        "external_id": str(raw["id"]),
        "name": raw["name"],
        "weight_lbs": raw.get("weight_lbs"),
        "height_in": raw.get("height_in"),
        "age": raw.get("age"),
        "dominant_hand": raw.get("dominant_hand"),
        "injuries": raw.get("injuries"),
        "raw_stats": {k: v for k, v in raw.items() if k not in IDENTITY_KEYS},
        "fetched_at": datetime.now(timezone.utc),
    }


def seed():
    Base.metadata.create_all(engine)
    total = 0

    with SessionLocal() as db:
        for path in DATA_FILES:
            if not path.exists():
                print(f"Skipping {path} (not found)")
                continue

            players = json.loads(path.read_text(encoding="utf-8"))
            for raw in players:
                fields = parse_player(raw)
                existing = (
                    db.query(Player)
                    .filter_by(
                        sport=fields["sport"],
                        external_id=fields["external_id"],
                        season=fields["season"],
                    )
                    .first()
                )
                if existing:                       # rerun-safe: update, don't duplicate
                    for key, value in fields.items():
                        setattr(existing, key, value)
                else:
                    db.add(Player(**fields))
            print(f"{path.name}: {len(players)} players")
            total += len(players)

        db.commit()
    print(f"Done. {total} players loaded.")


if __name__ == "__main__":
    seed()