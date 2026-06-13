const authService = require("../services/authService");


/*  
Questo token serve a mantenere l'utente loggato per lunghi periodi. 
Impostato come "httpOnly" in questo modo il codice JavaScript del frontend (e potenziali attacchi XSS) non può leggerlo.  
*/

const setRefreshCookie = (res, refreshToken) => {
  const refreshMaxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 giorni
  const secure = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || "lax"; // Previene l'invio del cookie in richieste cross-site ( solo Same-Site per l'appunto)

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, 
    secure,
    sameSite,
    path: "/api/auth", // Il cookie viene inviato solo per le rotte di autenticazione
    maxAge: refreshMaxAgeMs,
  });
};


// Questo deve poter essere letto dal frontend, imposto httpOnly: false così che React possa prenderlo e inviarlo per le successive richieste.

const setCsrfCookie = (res, csrfToken) => {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || "lax";
  
  res.cookie("csrfToken", csrfToken, {
    httpOnly: false, 
    secure,
    sameSite,
    path: "/",
    maxAge: 60 * 60 * 1000, // 1 ora
  });
};

/*
Genera una stringa casuale e sicura di 32 byte usando la libreria crittografica di Node.js convertita poi
in base64url per essere compatibile con i cookie e gli header HTTP.
*/
const generateCsrf = () => {
  return require("crypto").randomBytes(32).toString("base64url");
};

// Gestisce la registrazione di un nuovo utente.

const register = async (req, res) => {

  const { email, password, username } = req.body;
  
  const result = await authService.register({ email, password, username });

  // Genera un nuovo token CSRF e imposta i cookie di sessione

  const csrfToken = generateCsrf();
  setCsrfCookie(res, csrfToken);
  setRefreshCookie(res, result.tokens.refreshToken);

  // 201 (Created) - invia i dati dell'utente al client
  res.status(201).json({
    user: result.user,
    tokens: { accessToken: result.tokens.accessToken },
    csrfToken,
  });
};

// Gestisce l'accesso di un utente.

const login = async (req, res) => {
  const { email, password } = req.body;
  

  const result = await authService.login({ email, password });

  const csrfToken = generateCsrf();
  setCsrfCookie(res, csrfToken);
  setRefreshCookie(res, result.tokens.refreshToken);

  // 200 (OK) - restituisce i permessi di accesso
  res.status(200).json({
    user: result.user,
    tokens: { accessToken: result.tokens.accessToken },
    csrfToken,
  });
};

// Rinnova l'Access Token (che scade velocemente) utilizzando il Refresh Token.

const refresh = async (req, res) => {
  
  // La verifica del vecchio token e la generazione del nuovo la fa il service

  const result = await authService.refresh({
    refreshToken: req.cookies?.refreshToken, // Legge il token dal cookie in arrivo
    userAgent: req.get("user-agent"),
    ip: req.ip,
  });

  // Emette un nuovo refresh token e scarta il vecchio per maggiore sicurezza

  setRefreshCookie(res, result.tokens.refreshToken);

  // Invia il nuovo access token al frontend

  res.status(200).json({
    tokens: { accessToken: result.tokens.accessToken },
  });
};

// Gestisce il logout

const logout = async (req, res) => {

  // Invalida il token sul database tramite il service
  await authService.logout({ refreshToken: req.cookies?.refreshToken });
  
  // Ordina al browser di cancellare fisicamente i cookie di sicurezza
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.clearCookie("csrfToken", { path: "/" });
  
  // 204 (No Content) - conferma il successo senza inviare dati
  res.status(204).send();
};


// Gestisce l'eliminazione definitiva dell'account dell'utente.

const deleteAccount = async (req, res) => {
  const { password } = req.body;
  
  // Richiede la password per conferma e passa l'ID dell'utente autenticato (estratto dai middleware)
  await authService.deleteAccount({ userId: req.user.id, password });
  
  res.status(204).send();
};

// Gestisce l'aggiornamento dei dati del profilo utente (email, username, password).

const updateAccount = async (req, res) => {
  const { email, username, password, newPassword } = req.body;
  
  // Delega le modifiche e i controlli di unicità al service
  const result = await authService.updateAccount({
    userId: req.user.id,
    email,
    username,
    password,     // Password attuale necessaria per autorizzare la modifica
    newPassword,  // Nuova password opzionale
  });
  
  // Restituisce l'oggetto utente aggiornato
  res.status(200).json({ user: result });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  deleteAccount,
  updateAccount,
};