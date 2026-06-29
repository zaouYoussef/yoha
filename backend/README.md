# YoHa API (Django)

API sécurisée pour la plateforme YoHa — comptes, restaurants, commandes, paiements.

## Démarrage rapide (dev)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_yoha
python manage.py runserver
```

- API : http://localhost:8000/api/v1/
- Docs : http://localhost:8000/api/docs/
- Health : http://localhost:8000/api/v1/health/

## Comptes démo (après seed)

| E-mail | Rôle | Mot de passe |
|--------|------|--------------|
| admin@yoha.ma | Gérant | DemoAdmin2025! |
| livreur@yoha.ma | Livreur | DemoCourier2025! |
| resto@yoha.ma | Restaurant | DemoResto2025! |
| client@yoha.ma | Client | DemoClient2025! |

## Production (Docker)

```bash
docker compose up -d
```

PostgreSQL + Redis + Gunicorn avec healthchecks et redémarrage automatique.

## Frontend Next.js

Le frontend (`YoHa/`) appelle cette API via `NEXT_PUBLIC_API_URL` (défaut : `http://127.0.0.1:8000/api/v1`).

```bash
# Terminal 1 — API
cd backend && python manage.py runserver

# Terminal 2 — Next.js
cd YoHa && npm run dev
```

CORS : autoriser `http://localhost:3002` dans `.env` (`DJANGO_CORS_ALLOWED_ORIGINS`).
