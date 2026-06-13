const { verifyAccessToken } = require("../utils/jwt");

/*
Intercetta le richieste in arrivo,  estrae l'access token (o JWT) dall'header HTTP.
Se valido estrae l'ID dell'utente per passarlo alle rotte successive.
*/

const requireAuth = (req, _res, next) => {
  
  // Estrae il token dall'header "Authorization", aspettandosi il formato standard "Bearer <token>".
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    const error = new Error("Sessione scaduta, effettua di nuovo l'accesso.");
    // 401 (Unauthorized) - Manca il token, accesso negato alla rotta
    error.status = 401; 
    return next(error);
  }

  try {
    // Verifica la validità del token JWT (o Access Token).
    const payload = verifyAccessToken(token);
    
    // Inserisce l'ID dell'utente estratto nell'oggetto della richiesta (req.user), per i controller successivi.
    req.user = { id: payload.userId };
    
    return next();
  } catch (error) {
    // 401 (Unauthorized) - Il token è invalido o scaduto
    const authError = new Error("Sessione scaduta, effettua di nuovo l'accesso.");
    authError.status = 401; 
    return next(authError);
  }
};

module.exports = { requireAuth };