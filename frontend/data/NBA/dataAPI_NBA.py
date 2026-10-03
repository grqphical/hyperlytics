import requests
import os
from dotenv import load_dotenv

load_dotenv() 

KEY= os.getenv("SPORTRADAR_KEY")

url = "https://api.sportradar.com/nba/trial/v8/en/seasons/2025/REG/leaders.json"

headers = {
    "accept": "application/json",
    "x-api-key": KEY
}

response = requests.get(url, headers=headers)

import json

d = response.json()

def top_player(category, type_="total"):
    for cat in d["categories"]:
        if cat["name"] == category and cat["type"] == type_:
            return cat["ranks"][0]
    return None

out = {}
for cat in d["categories"]:
    ranks = cat["ranks"]
    out[cat["type"] + ":" + cat["name"]] = [
        {
            "rank": r["rank"],
            "id": r["player"]["id"],
            "first_name": r["player"]["first_name"],
            "last_name": r["player"]["last_name"],
            "team": r["teams"][0]["name"] if r["teams"] else None,
            "score": r["score"],
            "average": r["average"],
            "total": r["total"],
        }
        for r in ranks
    ]

with open("leaders.json", "w") as f:
    json.dump(out, f, indent=2)

print(f"wrote {sum(len(v) for v in out.values())} entries across {len(out)} categories")