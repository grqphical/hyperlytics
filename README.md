# Non-Euclidean Sports Analytics (name pending)

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