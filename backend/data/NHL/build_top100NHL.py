import json

SEASON_YEAR = 2025

SKATER_STATS = ["points", "goals", "assists", "games_played"]
DEFENSE_STATS = ["plus_minus", "hits", "penalty_minutes", "blocked_shots", "takeaways"]
GOALIE_STATS = ["save_pct", "wins", "shutouts", "goals_against"]

GOALIE_CATEGORIES = {"savepercentage", "wins", "shutouts", "goalsagainstaverage"}

SKATERS = 80
DEFENDERS = 10
GOALIES = 10

with open("leaders.json") as f:
    data = json.load(f)

pool = {}
scoring = {}
defensive = {}
goalie = {}

for category, ranks in data.items():
    for e in ranks:
        pid = e["id"]
        pool.setdefault(pid, e)
        if category in GOALIE_CATEGORIES:
            goalie.setdefault(pid, {}).update(
                {k: v for k, v in e.items() if k not in ("rank", "id", "sr_id", "full_name", "jersey_number", "team", "team_abbr", "games_played")}
            )
            continue
        for k, v in e.items():
            if k in ("rank", "id", "sr_id", "full_name", "jersey_number", "team", "team_abbr"):
                continue
            if k == "points":
                scoring.setdefault(pid, {})["points"] = v
            if k in ("goals", "assists", "games_played"):
                scoring.setdefault(pid, {})[k] = v
            if k in ("plus_minus", "hits", "penalty_minutes", "shorthanded_goals", "blocked_att"):
                defensive.setdefault(pid, {})[k] = v

skaters = [p for pid, p in pool.items() if pid not in goalie]
skaters.sort(key=lambda p: -(scoring.get(p["id"], {}).get("points") or 0))

print(f"{len(pool)} unique players: {len(skaters)} skaters, {len(goalie)} goalies")

# Top skaters by points (guarantees elite offensive talent)
selected = list(skaters[:SKATERS])
seen = {p["id"] for p in selected}

# Guarantee defensive standouts: best plus_minus / hits / PIM not already in
DEFENSE_KEYS = ["plus_minus", "hits", "penalty_minutes"]
defense_pool = sorted(
    (p for pid, p in pool.items() if pid not in goalie),
    key=lambda p: -sum((defensive.get(p["id"], {}).get(k) or 0) for k in DEFENSE_KEYS),
)
for p in defense_pool:
    if sum(1 for x in selected if x["id"] not in goalie) >= SKATERS + DEFENDERS:
        break
    if p["id"] not in seen:
        selected.append(p)
        seen.add(p["id"])

# Guarantee top goalies (elite defence, zero points)
goalies = sorted(
    (p for pid, p in pool.items() if pid in goalie),
    key=lambda p: -(goalie.get(p["id"], {}).get("save_pct") or 0),
)
for p in goalies:
    if sum(1 for x in selected if x["id"] in goalie) >= GOALIES:
        break
    if p["id"] not in seen:
        selected.append(p)
        seen.add(p["id"])

# Backfill skaters if goalies/defense ran short
for p in skaters:
    if len(selected) >= 100:
        break
    if p["id"] not in seen:
        selected.append(p)
        seen.add(p["id"])

out = []
for i, p in enumerate(selected[:100], 1):
    pid = p["id"]
    row = {
        "rank": i,
        "id": pid,
        "name": p["full_name"],
        "sport": "hockey",
        "year": SEASON_YEAR,
        "jersey_number": p.get("jersey_number"),
        "team": p.get("team"),
        "team_abbr": p.get("team_abbr"),
        "role": "goalie" if pid in goalie else "skater",
    }
    s = scoring.get(pid, {})
    d = defensive.get(pid, {})
    g = goalie.get(pid, {})
    for k in SKATER_STATS:
        row[k] = s.get(k, g.get(k))
    for k in DEFENSE_STATS:
        row[k] = d.get(k)
    for k in GOALIE_STATS:
        row[k] = g.get(k)
    out.append(row)

with open("top100NHL.json", "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

print(f"wrote {len(out)} players")
print("goalies:", sum(1 for r in out if r["role"] == "goalie"))
for r in out[:3]:
    print(r["rank"], r["name"], r["team_abbr"], r["points"], r["plus_minus"], r["role"])
