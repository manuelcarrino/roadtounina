const jwt = require("jsonwebtoken");

// Configurazione secrets e durate (TTL - Time To Live)

const accessSecret = process.env.JWT_ACCESS_SECRET || "change-me-access";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "change-me-refresh";
const accessTtl = process.env.JWT_ACCESS_TTL || "15m"; // Scade dopo 15 minuti (sicurezza alta)
const refreshTtl = process.env.JWT_REFRESH_TTL || "7d"; // Scade dopo 7 giorni (comodità utente)

// Crea un token a breve termine che viene inviato nell'header Authorization per ogni singola richiesta API.

const signAccessToken = ({ userId }) =>
  jwt.sign({ userId }, accessSecret, { expiresIn: accessTtl });


// Crea un token a lungo termine, serve solo per richiedere un nuovo Access Token quando quello attuale è scaduto.

const signRefreshToken = ({ userId }) =>
  jwt.sign({ userId }, refreshSecret, { expiresIn: refreshTtl });


// Le funzioni di verifica lanciano un'eccezione se il token è scaduto o manipolato
const verifyAccessToken = (token) => jwt.verify(token, accessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};