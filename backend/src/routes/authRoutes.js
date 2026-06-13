const express = require("express");
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/authController");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");

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
router.post("/refresh", requireCsrf, asyncHandler(authController.refresh));
router.post("/logout", requireCsrf, asyncHandler(authController.logout));

router.post("/delete", requireAuth, asyncHandler(authController.deleteAccount));
router.post("/update", requireAuth, asyncHandler(authController.updateAccount));

module.exports = router;

