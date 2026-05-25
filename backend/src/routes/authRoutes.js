const express = require("express");
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/authController");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

const authLimiter = rateLimit({
	windowMs: Number.parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || "60000", 10),
	limit: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || "20", 10),
	standardHeaders: true,
	legacyHeaders: false,
});

router.use(authLimiter);

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));

module.exports = router;
