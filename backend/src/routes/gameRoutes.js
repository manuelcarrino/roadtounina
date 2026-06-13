const express = require("express");
const rateLimit = require("express-rate-limit");

const gameController = require("../controllers/gameController");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

/* (Anti-Spam)
	Implementiamo un sistema di throttling (limitiamo le prestazioni) personalizzato basato su memoria.
	Questo impedisce all'utente di inviare troppe richieste di movimento in brevissimo tempo.
 */

const moveCooldownMs = Number.parseInt(process.env.GAME_MOVE_COOLDOWN_MS || "400", 10);
const lastMoveByUser = new Map(); // Memorizza il timestamp dell'ultimo click per utente

const enforceMoveCooldown = (req, _res, next) => {
    const userId = req.user?.id;
    if (!userId) return next();

    const now = Date.now();
    const lastMove = lastMoveByUser.get(userId) || 0;

    // Se la differenza di tempo è inferiore al cooldown, blocca la richiesta
    if (now - lastMove < moveCooldownMs) {
        const error = new Error("Stai cliccando troppo velocemente. Attendi un attimo.");
        error.status = 429; // Too Many Requests
        return next(error);
    }
    
    lastMoveByUser.set(userId, now);
    return next();
};


// Protegge il server da un numero eccessivo di chiamate API totali per utente/IP.

const gameLimiter = rateLimit({
    windowMs: Number.parseInt(process.env.GAME_RATE_LIMIT_WINDOW_MS || "60000", 10),
    limit: Number.parseInt(process.env.GAME_RATE_LIMIT_MAX || "30", 10),
    standardHeaders: true,
    legacyHeaders: false,
});



// Rotte pubbliche: non richiedono autenticazione
router.get("/completed", asyncHandler(gameController.listCompletedGames));

// Applica il rate limit globale a tutte le rotte sottostanti
router.use(gameLimiter);

// Avvio partita
router.post("/start", requireAuth, asyncHandler(gameController.startGame));

// Gestione stato partita (Resume/Pause/Abandon)
router.post("/:gameId/resume", requireAuth, asyncHandler(gameController.resumeGame));
router.post("/:gameId/pause", requireAuth, asyncHandler(gameController.pauseGame));
router.post("/:gameId/abandon", requireAuth, asyncHandler(gameController.abandonGame));

// Mosse di gioco
router.post("/:gameId/move", requireAuth, enforceMoveCooldown, asyncHandler(gameController.addMove));
router.post("/:gameId/undo", requireAuth, enforceMoveCooldown, asyncHandler(gameController.undoMove));

// Informazioni e recupero dati
router.get("/:gameId/links", requireAuth, asyncHandler(gameController.getGameLinks));
router.get("/me/active", requireAuth, asyncHandler(gameController.getActiveGame));
router.get("/leaderboard", requireAuth, asyncHandler(gameController.getLeaderboard));

module.exports = router;