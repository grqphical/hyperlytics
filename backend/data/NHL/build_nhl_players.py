"""
Build frontend/data/NHL/nhl_players.json from skaters.csv.

All counting stats come from skaters.csv (no API for stats). The Sportradar
API is used only for fields absent from the CSV: id, weight, height,
birthdate (age) and dominant hand.
"""

import csv
import json
import os
import time
from datetime import date

import requests
from dotenv import load_dotenv

load_dotenv()

KEY = os.getenv("SPORTRADAR_KEY")
LEADERS_URL = "https://api.sportradar.com/nhl/trial/v7/en/seasons/2025/REG/leaders.json"
PROFILE_URL = "https://api.sportradar.com/nhl/trial/v7/en/players/{pid}/profile.json"
HEADERS = {"accept": "application/json", "x-api-key": KEY}

SEASON_YEAR = 2025
SITUATION = "all"
MIN_GAMES = 20
TARGET = 100
DELAY = 1.5
MAX_RETRIES = 4

CSV_FILE = "skaters.csv"
LEADERS_CACHE = "leaders.json"
BIO_CACHE = "player_bio.json"
OUTPUT = "nhl_players.json"

# skaters.csv column -> output field
CSV_STATS = {
    "shots": "I_F_shotsOnGoal",
    "goals": "I_F_goals",
    "shot_blocks": "shotsBlockedByPlayer",
    "hits": "I_F_hits",
    "takeaways": "I_F_takeaways",
}
ASSIST_COLS = ("I_F_primaryAssists", "I_F_secondaryAssists")

GOALIE_CATEGORIES = {
    "savepercentage",
    "wins",
    "shutouts",
    "goalsagainstaverage",
}


def to_int(value):
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return None


def calc_age(birthdate):
    if not birthdate:
        return None
    try:
        b = date.fromisoformat(birthdate)
    except ValueError:
        return None
    today = date.today()
    return today.year - b.year - ((today.month, today.day) < (b.month, b.day))


def load_json(path, fallback):
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return fallback


def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_with_retry(url):
    for attempt in range(MAX_RETRIES):
        r = requests.get(url, headers=HEADERS)
        if r.status_code == 200:
            return r
        if r.status_code == 429:
            wait = 10 * (attempt + 1)
            print(f"  429 rate limited, waiting {wait}s")
            time.sleep(wait)
            continue
        print(f"  {r.status_code} from Sportradar, skipping")
        return None
    return None


def load_candidates():
    """CSV is the source of truth: situation == all, games_played > 20, deduped."""
    rows = []
    with open(CSV_FILE) as f:
        for r in csv.DictReader(f):
            if r.get("situation") != SITUATION:
                continue
            if int(r.get("season") or 0) != SEASON_YEAR:
                continue
            if (to_int(r.get("games_played")) or 0) <= MIN_GAMES:
                continue
            rows.append(r)
    return rows


def load_id_map():
    """name + reference -> {uuid}. Reference matches skaters.csv playerId."""
    cached = load_json(LEADERS_CACHE, None)
    if cached is None:
        r = get_with_retry(LEADERS_URL)
        if r is None:
            raise SystemExit("could not fetch leaders.json; cannot resolve player ids")
        categories = r.json().get("categories", [])
        cached = {c["category"]: c.get("leaders", []) for c in categories}
        save_json(LEADERS_CACHE, cached)

    by_ref, by_name = {}, {}
    for category, leaders in cached.items():
        if category in GOALIE_CATEGORIES:
            continue
        for e in leaders:
            p = e.get("player") or {}
            pid, name = p.get("id"), p.get("full_name")
            if not pid:
                continue
            ref = p.get("reference")
            if ref:
                by_ref[str(ref)] = pid
            if name:
                by_name[name.strip()] = pid
    return by_ref, by_name


def build_stats(row):
    stats = {field: to_int(row.get(col)) for field, col in CSV_STATS.items()}
    assists = [to_int(row.get(c)) for c in ASSIST_COLS]
    assists = [a for a in assists if a is not None]
    stats["assists"] = sum(assists) if assists else None
    stats["games_played"] = to_int(row.get("games_played"))
    return stats


def fetch_bio(pid, cache):
    bio = {
        "weight_lbs": to_int(cache.get("weight")),
        "height_in": to_int(cache.get("height")),
        "age": calc_age(cache.get("birthdate")),
        "dominant_hand": cache.get("handedness"),
    }
    return bio


def fetch_profile(pid, cache):
    r = get_with_retry(PROFILE_URL.format(pid=pid))
    if r is None:
        return None
    d = r.json()
    raw = {
        "weight": d.get("weight"),
        "height": d.get("height"),
        "birthdate": d.get("birthdate"),
        "handedness": d.get("handedness"),
    }
    cache[pid] = raw
    return raw


def main():
    if not KEY:
        raise SystemExit("SPORTRADAR_KEY not found (expected in frontend/.env)")

    rows = load_candidates()
    by_ref, by_name = load_id_map()
    print(f"{len(rows)} CSV players pass situation/games filters; {len(by_ref)} ids resolvable")

    picked, seen = [], set()
    skipped_no_id = 0
    for r in rows:
        pid = by_ref.get(str(r.get("playerId"))) or by_name.get((r.get("name") or "").strip())
        if not pid:
            skipped_no_id += 1
            continue
        if pid in seen:
            continue
        seen.add(pid)
        stats = build_stats(r)
        if any(v is None for v in stats.values()):
            continue
        picked.append(
            {
                "id": pid,
                "name": r.get("name"),
                "points": stats["goals"] + stats["assists"],
                **stats,
            }
        )

    picked.sort(key=lambda p: -p["points"])
    selected = picked[:TARGET]
    print(f"{len(picked)} candidates with full stats, {skipped_no_id} skipped (no id)")

    cache = load_json(BIO_CACHE, {})
    out = []
    for n, p in enumerate(selected, 1):
        raw = cache.get(p["id"])
        if not raw:
            raw = fetch_profile(p["id"], cache)
            save_json(BIO_CACHE, cache)
            if raw is None:
                print(f"  no profile for {p['name']}, skipping")
                continue
            time.sleep(DELAY)
        if n % 10 == 0 or n == len(selected):
            print(f"  {n}/{len(selected)} bios ready")

        bio = fetch_bio(p["id"], raw)
        out.append(
            {
                "id": p["id"],
                "name": p["name"],
                "sport": "hockey",
                "year": SEASON_YEAR,
                "weight_lbs": bio["weight_lbs"],
                "height_in": bio["height_in"],
                "age": bio["age"],
                "dominant_hand": bio["dominant_hand"],
                "injuries": None,
                "goals": p["goals"],
                "assists": p["assists"],
                "shots": p["shots"],
                "shot_blocks": p["shot_blocks"],
                "hits": p["hits"],
                "takeaways": p["takeaways"],
                "games_played": p["games_played"],
            }
        )

    save_json(OUTPUT, out)

    ids = [r["id"] for r in out]
    print(f"wrote {len(out)} players to {OUTPUT}")
    print("duplicate ids:", len(ids) - len(set(ids)))
    print("min games_played:", min((r["games_played"] for r in out), default=None))
    for field in ("weight_lbs", "height_in", "age", "dominant_hand"):
        print(f"null {field}:", sum(1 for r in out if r[field] is None))


if __name__ == "__main__":
    main()
