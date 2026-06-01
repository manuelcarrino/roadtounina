# ROADTOUNINA Backend

## Perche' queste scelte
- Express + Sequelize: API semplice da mantenere, con modelli chiari e query sicure.
- SQLite file-based: avvio immediato senza server esterno, perfetto per sviluppo e demo.
- Controller sottili e servizi separati: logica di dominio isolata e testabile.
- JWT access/refresh: access token breve, refresh token lungo, con hash in DB per sicurezza.
- Rate limiting e cooldown mosse: protezione da abuso e click spam.
- Wikipedia API: normalizzazione titoli, cache temporanea e retry su errori upstream.
- Serve del frontend built: in produzione l'app React puo' essere servita dallo stesso server.

## Avvio rapido
1. Crea `.env` in `backend/` (vedi variabili sotto).
2. Installa dipendenze: `npm install`
3. Avvia in dev: `npm run dev`

## Health
- `GET /health` -> `{ status: "ok", uptime: <seconds> }`

## Variabili d'ambiente principali
- `PORT`: porta API (default 3001).
- `SQLITE_PATH`: percorso DB SQLite.
- `DB_SYNC`: `alter` per sync non distruttivo.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`.
- `FRONTEND_ORIGIN`: origini CORS consentite (comma-separated).
- `RATE_LIMIT_*`, `GAME_RATE_LIMIT_*`, `AUTH_RATE_LIMIT_*`.
- `TARGET_PAGE`, `PAGE_TITLE_MAX_LEN`.

## Struttura e file

### Root
- `package.json`: script e dipendenze del backend.
- `package-lock.json`: lockfile npm.
- `playwright.config.js`: configurazione e2e (avvio server e DB test).
- `README.md`: questa guida.
- `data/`: DB SQLite generato a runtime (es. `roadtounina.sqlite`).
- `test-results/`: output dei test e2e.
- `tests/e2e/auth.spec.js`: test flusso auth.
- `tests/e2e/games.spec.js`: test flusso giochi.
- `tests/e2e/moves.spec.js`: test mosse e link.

### src/
- `server.js`: entrypoint, connessione DB e start server.
- `app.js`: Express app, middleware globali, routing, static frontend.
- `db.js`: setup Sequelize + SQLite.

### src/controllers/
- `authController.js`: handler HTTP per registrazione/login/refresh/logout/account.
- `gameController.js`: handler HTTP per start/move/links/leaderboard.

### src/services/
- `authService.js`: logica auth, hash password e refresh token.
- `gameService.js`: regole di gioco, validazioni, leaderboard.
- `wikiService.js`: chiamate Wikipedia, cache link, retry.

### src/models/
- `User.js`: modello utente (email, username, hash password).
- `Game.js`: modello partita (path, stato, tempi).
- `index.js`: associazioni tra modelli.

### src/routes/
- `router.js`: router principale `/api`.
- `authRoutes.js`: rotte `/api/auth` con rate limit.
- `gameRoutes.js`: rotte `/api/games`, cooldown mosse.

### src/middlewares/
- `auth.js`: verifica JWT access token.
- `errorHandler.js`: mapping errori e fallback.

### src/utils/
- `asyncHandler.js`: wrapper async per Express.
- `jwt.js`: firma/verifica token.
- `validators.js`: validazioni input e titoli Wikipedia.

## E2E Tests
- Avvio: `npm run test:e2e`
- Usa un DB SQLite separato e avvia il server su porta 3002.
