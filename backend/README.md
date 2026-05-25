# ROADTOUNINA Backend

## Setup

### Backend

1. Create a `.env` file in `backend/` and update values.
2. Install deps: `npm install`
3. Start dev server: `npm run dev`

### Frontend

1. From the `frontend/` folder, install deps: `npm install`
2. Start dev server: `npm run dev`
3. Open the URL shown by Vite (default: `http://localhost:5173`)

## Health

- `GET /health` -> `{ status: "ok", uptime: <seconds> }`

## Backend Structure

- `index.js`: server bootstrap, DB sync, app start.
- `src/app.js`: Express app, middleware, routes, errors.
- `src/db.js`: Sequelize/SQLite connection.
- `src/models/`: Sequelize models and relations.
- `src/controllers/`: HTTP handlers.
- `src/services/`: business logic (auth, games, wikipedia).
- `src/routes/`: Express routers.
- `src/middlewares/`: auth and error handling.
- `src/utils/`: helpers (JWT, validators, async handler).

## Auth

- `POST /api/auth/register`
  - body: `{ "email": "user@example.com", "password": "yourpassword" }`
- `POST /api/auth/login`
  - body: `{ "email": "user@example.com", "password": "yourpassword" }`
- `POST /api/auth/refresh`
  - body: `{ "refreshToken": "..." }`
- `POST /api/auth/logout`
  - body: `{ "refreshToken": "..." }`

## Games

- `POST /api/games/start` (auth)
  - body: `{ "startPage": "Pagina opzionale" }`
- `POST /api/games/:gameId/move` (auth)
  - body: `{ "nextPage": "Pagina successiva" }`
- `POST /api/games/:gameId/abandon` (auth)
- `GET /api/games/me` (auth)
- `GET /api/games/me/active` (auth)
- `GET /api/games/leaderboard` (auth)
- `GET /api/games/completed`

## Notes

- `startPage` and `nextPage` are validated against Wikipedia IT.
- `nextPage` must be a link in the current page.
- Rate limits are applied globally, on auth, and on game endpoints.
- Titles must be main namespace (no `:`) and within max length.

## E2E Tests

Run: `npm run test:e2e`

The test runner starts the API on port 3002 with a separate SQLite database.
