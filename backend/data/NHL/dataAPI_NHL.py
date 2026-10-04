import json
import os

import requests
from dotenv import load_dotenv

load_dotenv()

KEY = os.getenv("SPORTRADAR_KEY")

url = "https://api.sportradar.com/nhl/trial/v7/en/seasons/2025/REG/leaders.json"

headers = {
    "accept": "application/json",
    "x-api-key": KEY,
}

response = requests.get(url, headers=headers)
response.raise_for_status()

d = response.json()

META = {"rank", "player", "team", "games_played"}

out = {}
for cat in d["categories"]:
    out[cat["category"]] = [
        {
            "rank": e["rank"],
            "id": e["player"]["id"],
            "sr_id": e["player"]["sr_id"],
            "full_name": e["player"]["full_name"],
            "jersey_number": e["player"].get("jersey_number"),
            "team": (e.get("team") or {}).get("name"),
            "team_abbr": (e.get("team") or {}).get("alias"),
            "games_played": e.get("games_played"),
            **{k: v for k, v in e.items() if k not in META},
        }
        for e in cat["leaders"]
    ]

with open("leaders.json", "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

print(f"wrote {sum(len(v) for v in out.values())} entries across {len(out)} categories")
