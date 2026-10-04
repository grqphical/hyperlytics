import json

STATS = ["points", "effective_fg_pct", "assists", "defensive_rebounds", "steals", "blocks"]

with open("leaders.json") as f:
    data = json.load(f)

best = {}
for key, ranks in data.items():
    if not key.startswith("total:"):
        continue
    for r in ranks:
        cur = best.get(r["id"])
        if cur is None or r["total"]["points"] > cur["total"]["points"]:
            best[r["id"]] = r

top100 = sorted(best.values(), key=lambda r: -r["total"]["points"])[:100]

out = [
    {
        "rank": i,
        "id": r["id"],
        "name": f"{r['first_name']} {r['last_name']}",
        "team": r["team"],
        **{s: r["total"][s] for s in STATS},
    }
    for i, r in enumerate(top100, 1)
]

with open("top100NBA.json", "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

print(f"wrote {len(out)} players from {len(best)} candidates")
for p in out[:3]:
    print(p["rank"], p["name"], p["team"], p["points"], p["effective_fg_pct"])
