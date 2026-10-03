import json
import os
import time
from datetime import date

import requests
from dotenv import load_dotenv

load_dotenv()

KEY = os.getenv("SPORTRADAR_KEY")
BASE = "https://api.sportradar.com/nhl/trial/v7/en/players/{pid}/profile.json"
HEADERS = {"accept": "application/json", "x-api-key": KEY}
CACHE = "player_bio.json"
DELAY = 2.0
MAX_RETRIES = 4
SEASON_YEAR = 2025

SKATER_STATS = ["goals", "assists", "shots"]
DEFENSE_STATS = ["shot_blocks", "hits", "takeaways"]

with open("top100NHL.json") as f:
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
            (
                s
                for s in d.get("seasons", [])
                if s.get("year") == SEASON_YEAR and s.get("type") == "REG"
            ),
            None,
        )

        total = {}
        average = {}
        if reg and reg.get("teams"):
            st = reg["teams"][0].get("statistics", {})
            total = st.get("total", {}) or {}
            average = st.get("average", {}) or {}

        team = d.get("team") or {}
        bio = {
            "weight_lbs": d.get("weight"),
            "height_in": d.get("height"),
            "age": calc_age(d.get("birthdate")),
            "dominant_hand": d.get("handedness"),
            "position": d.get("primary_position") or d.get("position"),
            "jersey_number": d.get("jersey_number"),
            "team": team.get("name"),
            "team_abbr": team.get("alias"),
            "total": total,
            "average": average,
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
    t = b["total"]
    avg = b["average"]
    row = {
        "id": p["id"],
        "name": p.get("name") or b.get("name"),
        "sport": "hockey",
        "year": SEASON_YEAR,
        "weight_lbs": b.get("weight_lbs"),
        "height_in": b.get("height_in"),
        "age": b.get("age"),
        "dominant_hand": b.get("dominant_hand"),
        "injuries": None,
    }
    for s in SKATER_STATS:
        row[s] = t.get(s, p.get(s))
    for s in DEFENSE_STATS:
        row[s] = t.get({"shot_blocks": "blocked_shots"}.get(s, s), p.get(s))
    row["games_played"] = t.get("games_played", p.get("games_played"))
    row["gpg"] = avg.get("goals", p.get("goals"))
    row["spg"] = avg.get("shots", p.get("shots"))
    out.append(row)

with open("nhl_players.json", "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

print(f"wrote {len(out)}/{len(players)} players")
missing = [
    k
    for k in ["weight_lbs", "height_in", "age", "goals", "assists", "shots",
              "shot_blocks", "hits", "takeaways"]
    if any(r[k] is None for r in out)
]
print("null fields:", missing or "none")
