const csrfCookieName = process.env.CSRF_COOKIE_NAME || "csrfToken";

/*
Il server imposta un cookie leggibile dal frontend (NON HttpOnly), e il frontend deve allegarlo ad ogni richiesta.
Il server verifica semplicemente che i due valori coincidano. 
Se un sito malevolo prova a fare una richiesta a nome dell'utente, non potrà leggere il cookie per 
impostare l'header, facendo fallire il controllo.
*/

const requireCsrf = (req, res, next) => {
  // Estrae il token inviato dal frontend tramite l'header personalizzato
  const headerToken = req.headers["x-csrf-token"];
  
  // Estrae il token inviato automaticamente dal browser tramite i cookie
  const cookieToken = req.cookies?.[csrfCookieName];

  // Se manca uno dei due token o se i valori non corrispondono, la richiesta viene bloccata
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    // 403 (Forbidden) - La richiesta non è autorizzata per fallimento della verifica CSRF
    return res.status(403).json({
      message: "CSRF token non valido",
      status: 403,
    });
  }

  return next();
};

module.exports = { requireCsrf, csrfCookieName };