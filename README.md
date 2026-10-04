# Hyperlytics
A non-euclidean sports data visualization web app. It compares NBA and NHL players across three primary categories:
- Offense
- Defense
- Physicality

Each of these categories take stats from the individual sports and combines them into a percentile, comparing that players skills to the rest
of the players in our dataset. We then take these percentages and plot them as points on a 3D, non-Euclidean space using a Poincaré Ball. You
also are able to compare players stats directly head-to-head, allowing for more in-depth analysis.

## Demo
https://github.com/user-attachments/assets/4f7eef9e-72da-4323-bde6-1c2b9e4d7a93

## To Launch
First time:
```bash
python3 -m venv .venv              
source .venv/bin/activate          # Windows: .venv\Scripts\activate
cd backend
pip install -r requirements.txt
cp .env.example .env

rm data/sports.db
python -m app.scripts.seed
python -m app.scripts.compute
```

To launch the backend:
```bash
uvicorn app.main:app --reload
```

To launch the frontend:
```bash
cd frontend
npm install # first-time only
npm run dev
```

## License
hyperlytics is licensed under the MIT License
