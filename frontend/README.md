# ROADTOUNINA Frontend

## Perche' queste scelte
- React + Vite: build veloce.
- React Router: SPA con navigazione client-side.
- Axios centralizzato: gestione API e token in un unico punto.
- AuthContext: stato auth condiviso e persistito in localStorage.
- Design system in CSS: variabili e componenti coerenti senza dipendenze esterne.
- Root di Vite in `src/`: HTML vicino al codice applicativo.


## Cos'e' Vite
Vite e' il tool di sviluppo e build del frontend.
- In dev offre un server rapidissimo con hot reload.
- In build genera asset ottimizzati per la produzione.
- Qui gestisce `src/index.html` come entry e impacchetta l'app React.

## Cos'e' ESLint
ESLint e' il linting tool per JavaScript/React.
- Analizza il codice per trovare errori e pattern rischiosi.
- Aiuta a mantenere uno stile coerente nel progetto.
- Si esegue con `npm run lint` e usa `eslint.config.js`.


## Avvio rapido
1. Da `frontend/`: `npm install`
2. Avvia dev server: `npm run dev`
3. Apri la URL di Vite (default `http://localhost:5173`).


## Struttura e file

### Root
- `package.json`: script e dipendenze frontend.
- `package-lock.json`: lockfile npm.
- `vite.config.js`: root `src`, build in `dist`, public in `public/`.
- `eslint.config.js`: regole lint.
- `.gitignore`: file ignorati da Git.
- `README.md`: questa guida.
- `public/icons.svg`: sprite icone statiche.
- `public/favicon.svg`: favicon.

### src/
- `index.html`: entry HTML per Vite.
- `main.jsx`: bootstrap React, router e auth provider.
- `App.jsx`: routing principale dell'app.
- `App.css`: stili principali dell'app.
- `index.css`: variabili tema, base styles e font.

### src/components/
- `Layout.jsx`: shell con header, navigazione e footer.

### src/contexts/
- `AuthContext.jsx`: login/registrazione/logout, persistenza e refresh UI.

### src/services/
- `api.js`: client Axios, base URL e header Authorization.

### src/pages/
- `Home.jsx`: hero e pitch del progetto.
- `Play.jsx`: avvio partita, link list, mosse e stato partita.
- `Completed.jsx`: lista partite completate.
- `Leaderboard.jsx`: classifica utenti (richiede login).
- `Rules.jsx`: regole del gioco.
- `Account.jsx`: login/registrazione e gestione account.
- `NotFound.jsx`: pagina 404.

### src/assets/
- `hero.png`: immagine hero.
- `react.svg`: asset placeholder React.
- `vite.svg`: asset placeholder Vite.
