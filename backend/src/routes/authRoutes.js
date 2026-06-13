const express = require("express");
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/authController");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middlewares/auth");
const { requireCsrf } = require("../middlewares/csrf");

const router = express.Router();

// Configurazione del Rate Limiter per prevenire attacchi brute-force o spam

const authLimiter = rateLimit({
  windowMs: Number.parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || "60000", 10), // Durata finestra (default 1 min)
  limit: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || "20", 10),            // Max richieste per finestra (default 20)
  standardHeaders: true, 
  legacyHeaders: false,
});

// Applica il limiter a tutte le rotte definite in questo router
router.use(authLimiter);

// Rotte pubbliche: non richiedono autenticazione
router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));

// Rotte che richiedono protezione CSRF (per sicurezza su operazioni delicate/rinnovo token)
router.post("/refresh", requireCsrf, asyncHandler(authController.refresh));
router.post("/logout", requireCsrf, asyncHandler(authController.logout));

// Rotte protette: richiedono un token di autenticazione valido
router.post("/delete", requireAuth, asyncHandler(authController.deleteAccount));
router.post("/update", requireAuth, asyncHandler(authController.updateAccount));

module.exports = router;