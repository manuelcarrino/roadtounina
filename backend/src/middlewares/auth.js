const { verifyAccessToken } = require("../utils/jwt");

const requireAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    const error = new Error("Sessione scaduta, effettua di nuovo l'accesso.");
    error.status = 401;
    return next(error);
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId };
    return next();
  } catch (error) {
    // non cambiamo messaggi auth qui: la modifica richiesta è lato login/utente non esiste
    const authError = new Error("Sessione scaduta, effettua di nuovo l'accesso.");
    authError.status = 401;
    return next(authError);
  }
};

module.exports = { requireAuth };

