# Backend

FastAPI + SQLite API that serves player analytics for the frontend.

## Setup

Run these from the `backend/` folder:

```bash
python3 -m venv .venv              # first time only
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # first time only
```

## Load the data

Put `basketball.json` and `baseball.json` in `data/`, then seed the database:

```bash
python -m app.scripts.seed
```

## Analyze the data'

```bash
python -m app.scripts.compute
```

Safe to rerun: existing players are updated, not duplicated.

## Run the server

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | Health check |
| GET | `/players?sport=basketball` | Players with percentiles and coordinates |