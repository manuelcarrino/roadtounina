const express = require("express");
const rateLimit = require("express-rate-limit");

const gameController = require("../controllers/gameController");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

const moveCooldownMs = Number.parseInt(process.env.GAME_MOVE_COOLDOWN_MS || "400", 10);
const lastMoveByUser = new Map();

const enforceMoveCooldown = (req, _res, next) => {
	const userId = req.user?.id;
	if (!userId) {
		return next();
	}
	const now = Date.now();
	const lastMove = lastMoveByUser.get(userId) || 0;
	if (now - lastMove < moveCooldownMs) {
		const error = new Error("Stai cliccando troppo velocemente. Attendi un attimo.");
		error.status = 429;
		return next(error);
	}
	lastMoveByUser.set(userId, now);
	return next();
};


const gameLimiter = rateLimit({
	windowMs: Number.parseInt(process.env.GAME_RATE_LIMIT_WINDOW_MS || "60000", 10),
	limit: Number.parseInt(process.env.GAME_RATE_LIMIT_MAX || "30", 10),
	standardHeaders: true,
	legacyHeaders: false,
});

router.get("/completed", asyncHandler(gameController.listCompletedGames));

router.use(gameLimiter);

router.post("/start", requireAuth, asyncHandler(gameController.startGame));

router.post("/:gameId/resume", requireAuth, asyncHandler(gameController.resumeGame));

router.post("/:gameId/pause",requireAuth,asyncHandler(gameController.pauseGame));

router.post("/:gameId/move",requireAuth,enforceMoveCooldown,asyncHandler(gameController.addMove));

router.post("/:gameId/abandon", requireAuth, asyncHandler(gameController.abandonGame));

router.post("/:gameId/undo", requireAuth, enforceMoveCooldown, asyncHandler(gameController.undoMove));

router.get("/:gameId/links", requireAuth, asyncHandler(gameController.getGameLinks));

router.get("/me", requireAuth, asyncHandler(gameController.listMyGames));

router.get("/me/active", requireAuth, asyncHandler(gameController.getActiveGame));

router.get("/leaderboard", requireAuth, asyncHandler(gameController.getLeaderboard));

module.exports = router;
