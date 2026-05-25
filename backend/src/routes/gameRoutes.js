const express = require("express");
const rateLimit = require("express-rate-limit");

const gameController = require("../controllers/gameController");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

const gameLimiter = rateLimit({
	windowMs: Number.parseInt(process.env.GAME_RATE_LIMIT_WINDOW_MS || "60000", 10),
	limit: Number.parseInt(process.env.GAME_RATE_LIMIT_MAX || "30", 10),
	standardHeaders: true,
	legacyHeaders: false,
});

router.get("/completed", asyncHandler(gameController.listCompletedGames));

router.use(gameLimiter);

router.post("/start", requireAuth, asyncHandler(gameController.startGame));
router.post("/:gameId/move", requireAuth, asyncHandler(gameController.addMove));
router.post("/:gameId/abandon", requireAuth, asyncHandler(gameController.abandonGame));
router.get("/:gameId/links", requireAuth, asyncHandler(gameController.getGameLinks));
router.get("/me", requireAuth, asyncHandler(gameController.listMyGames));
router.get("/me/active", requireAuth, asyncHandler(gameController.getActiveGame));
router.get("/leaderboard", requireAuth, asyncHandler(gameController.getLeaderboard));

module.exports = router;
