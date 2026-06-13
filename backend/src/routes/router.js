const express = require("express");

// Import dei moduli di routing per i diversi domini dell'applicazione

const authRoutes = require("./authRoutes");
const gameRoutes = require("./gameRoutes");

// Creazione di un'istanza del router di Express
const router = express.Router();

/* (Routing principale)
    Ogni richiesta che arriva al backend
    viene smistata qui in base al prefisso dell'URL.
*/

// Rotte per l'autenticazione (es. /api/auth/login, /api/auth/register)
router.use("/auth", authRoutes);

// Rotte per la logica di gioco (es. /api/games/start, /api/games/leaderboard)
router.use("/games", gameRoutes);

module.exports = router;