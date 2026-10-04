import json
import os
import time
from datetime import date

import requests
from dotenv import load_dotenv

load_dotenv()

KEY = os.getenv("SPORTRADAR_KEY")
BASE = "https://api.sportradar.com/nba/trial/v8/en/players/{pid}/profile.json"
HEADERS = {"accept": "application/json", "x-api-key": KEY}
CACHE = "player_bio.json"
DELAY = 2.0
MAX_RETRIES = 4
SEASON_YEAR = 2025

STATS = [
    "minutes",
    "points",
    "effective_fg_pct",
    "assists",
    "defensive_rebounds",
    "steals",
    "blocks",
]

with open("top100NBA.json") as f:
    players = json.load(f)

try:
    with open(CACHE) as f:
        cache = json.load(f)
except FileNotFoundError:
    cache = {}


def calc_age(birthdate):
    if not birthdate:
        return None
    try:
        b = date.fromisoformat(birthdate)
    except ValueError:
        return None
    today = date.today()
    return today.year - b.year - ((today.month, today.day) < (b.month, b.day))


for n, p in enumerate(players, 1):
    pid = p["id"]
    if pid in cache:
        continue

    bio = None
    for attempt in range(MAX_RETRIES):
        r = requests.get(BASE.format(pid=pid), headers=HEADERS)
        if r.status_code == 200:
            break
        if r.status_code == 429:
            wait = 10 * (attempt + 1)
            print(f"  429 on {p['name']}, waiting {wait}s")
            time.sleep(wait)
            continue
        print(f"  {r.status_code} on {p['name']}, skipping")
        break
    else:
        print(f"  giving up on {p['name']}")

    if r.status_code == 200:
        d = r.json()
        reg = next(
            (s for s in d.get("seasons", []) if s.get("year") == SEASON_YEAR and s.get("type") == "REG"),
            None,
        )
        team_entry = reg["teams"][0] if reg and reg["teams"] else {}
        totals = team_entry.get("total", {})
        averages = team_entry.get("average", {})
        bio = {
            "weight_lbs": d.get("weight"),
            "height_in": d.get("height"),
            "age": calc_age(d.get("birthdate")),
            "position": d.get("primary_position") or d.get("position"),
            "jersey_number": d.get("jersey_number"),
            "team": team_entry.get("name") or (d.get("team") or {}).get("name"),
            "total": totals,
            "average": averages,
        }
    cache[pid] = bio

    with open(CACHE, "w") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)

    if n % 10 == 0 or n == len(players):
        print(f"{n}/{len(players)} fetched")
    time.sleep(DELAY)

out = []
for p in players:
    b = cache.get(p["id"])
    if not b:
        continue
    row = {
        "id": p["id"],
        "name": p.get("name") or f"{p.get('first_name','')} {p.get('last_name','')}".strip(),
        "sport": "basketball",
        "year": SEASON_YEAR,
        "weight_lbs": b.get("weight_lbs"),
        "height_in": b.get("height_in"),
        "age": b.get("age"),
        "dominant_hand": None,
        "injuries": None,
    }
    for s in STATS:
        row[s] = b["total"].get(s, b["average"].get(s))
    row["ppg"] = b["average"].get("points")
    row["mpg"] = b["average"].get("minutes")
    row["games_played"] = b["total"].get("games_played")
    out.append(row)

with open("nba_players.json", "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

print(f"wrote {len(out)}/{len(players)} players")
missing = [k for k in ["weight_lbs", "height_in", "age"] if any(r[k] is None for r in out)]
print("null fields:", missing or "none")
