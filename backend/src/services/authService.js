const bcrypt = require("bcrypt");

// Modelli DB
const User = require("../models/User");
const Game = require("../models/Game");
const { sequelize } = require("../db");

// Validatori (email/username/password) presenti in validators.js
const {
  validateEmail,
  validatePassword,
  validateUsername,
} = require("../utils/validators");

// JWT: access token (brevi) e refresh token (lunghi)
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

// Normalizzazione input (riduce mismatch per spazi/case)
const normalizeEmail = (email) => email.trim().toLowerCase();
const normalizeUsername = (username) => username.trim().toLowerCase();



// Registra un nuovo utente

const register = async ({ email, password, username }) => {

  // Validazione campi obbligatori
  if (!email || !password || !username) {
    const error = new Error("Email, username e password sono obbligatori");
    error.status = 400;
    throw error;
  }


  if (!validateEmail(email)) {
    const error = new Error("Email non valida");
    error.status = 400;
    throw error;
  }

  if (!validatePassword(password)) {
    const error = new Error("La password deve avere 8-128 caratteri");
    error.status = 400;
    throw error;
  }

  if (!validateUsername(username)) {
    const error = new Error(
      "Il nome utente deve avere 3-24 caratteri (lettere, numeri, underscore)"
    );
    error.status = 400;
    throw error;
  }

  // Normalizza email/username

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);


  // Controlla unicità (email e username)

  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    const error = new Error("Email gia' registrata");
    error.status = 409;
    throw error;
  }

  const existingUsername = await User.findOne({ where: { username: normalizedUsername } });
  if (existingUsername) {
    const error = new Error("Nome utente gia' in uso");
    error.status = 409;
    throw error;
  }

  // Hasha password e refresh token prima di salvarli

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: normalizedEmail,
    username: normalizedUsername,
    passwordHash,
  });

  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await user.save();


  return {
    user: { id: user.id, email: user.email, username: user.username },
    tokens: { accessToken, refreshToken },
  };
};


// Login utente

const login = async ({ email, password }) => {
  // Validazione campi obbligatori
  if (!email || !password) {
    const error = new Error("Email o nome utente e password sono obbligatori");
    error.status = 400;
    throw error;
  }

  // Comprende se l'input è una email oppure uno username
  const identifier = email.trim();
  const isEmail = identifier.includes("@");

  // Se sembra una email, validiamola comunque
  if (isEmail && !validateEmail(identifier)) {
    const error = new Error("Email non valida");
    error.status = 400;
    throw error;
  }

  // Normalizza input, trova l'utente e valida la password

  const normalizedEmail = isEmail ? normalizeEmail(identifier) : null;
  const normalizedUsername = !isEmail ? normalizeUsername(identifier) : null;
  const user = await User.findOne({
    where: isEmail ? { email: normalizedEmail } : { username: normalizedUsername },
  });
  if (!user) {
    const error = new Error("Credenziali non valide");
    error.status = 401;
    throw error;
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    const error = new Error("Credenziali non valide");
    error.status = 401;
    throw error;
  }

  // Genera un nuovo access token e un nuovo refresh token

  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await user.save();


  // Aggiorna l'hash del refresh token salvato in DB

  return {
    user: { id: user.id, email: user.email, username: user.username },
    tokens: { accessToken, refreshToken },
  };
};


// Rinnova l'access token tramite il refresh token

const refresh = async ({ refreshToken }) => {
  // Validazione ingresso
  if (!refreshToken) {
    const error = new Error("Il refresh token e' obbligatorio");
    error.status = 400;
    throw error;
  }

  // Decodifica e verifica il refresh token
  const payload = verifyRefreshToken(refreshToken);


  // Controlla che l'utente esista e che l'hash del refresh token sia presente
  const user = await User.findByPk(payload.userId);
  if (!user || !user.refreshTokenHash) {
    const error = new Error("Refresh token non valido");
    error.status = 401;
    throw error;
  }

  // Confronta il refresh token ricevuto con l'hash salvato in DB

  const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!matches) {
    const error = new Error("Refresh token non valido");
    error.status = 401;
    throw error;
  }

  // Rilascia un nuovo access token e un nuovo refresh token

  const accessToken = signAccessToken({ userId: user.id });
  const nextRefreshToken = signRefreshToken({ userId: user.id });
  user.refreshTokenHash = await bcrypt.hash(nextRefreshToken, 12);
  await user.save();

  return {
    tokens: { accessToken, refreshToken: nextRefreshToken },
  };
};


// Esegue il logout

const logout = async ({ refreshToken }) => {
  // Se non c'è token, consideriamo già “loggato fuori”
  if (!refreshToken) {
    return;
  }

  let payload;
  try {
    // Verifica firma/scadenza del refresh token
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    // Token non valido: risposta “silenziosa” (nessuna info all'attaccante)
    return;
  }

  // Se valido, invalida lo stesso sul DB azzerando l'hash

  const user = await User.findByPk(payload.userId);
  if (!user) {
    return;
  }

  // Invalida refresh token cancellando l'hash
  user.refreshTokenHash = null;
  await user.save();
};



// Elimina definitivamente l'account.

const deleteAccount = async ({ userId, password }) => {
  // Password necessaria per confermare l'azione
  if (!password) {
    const error = new Error("La password e' obbligatoria");
    error.status = 400;
    throw error;
  }


  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("Utente non trovato");
    error.status = 404;
    throw error;
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    const error = new Error("Credenziali non valide");
    error.status = 401;
    throw error;
  }

  // Elimina anche i record dei giochi associati (in transazione).

  await sequelize.transaction(async (transaction) => {
    await Game.destroy({ where: { userId }, transaction });
    await user.destroy({ transaction });
  });
};

// Aggiorna i dati del profilo utente.

const updateAccount = async ({ userId, email, username, password, newPassword }) => {
  // Password attuale necessaria per autorizzare le modifiche
  if (!password) {
    const error = new Error("La password attuale e' obbligatoria");
    error.status = 400;
    throw error;
  }

  // Permette aggiornamenti parziali: email, username, nuova password

  if (!email && !username && !newPassword) {
    const error = new Error("Nessuna modifica da salvare");
    error.status = 400;
    throw error;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("Utente non trovato");
    error.status = 404;
    throw error;
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    const error = new Error("Credenziali non valide");
    error.status = 401;
    throw error;
  }

  if (email) {
    if (!validateEmail(email)) {
      const error = new Error("Email non valida");
      error.status = 400;
      throw error;
    }
    const normalizedEmail = normalizeEmail(email);
    const existingEmail = await User.findOne({ where: { email: normalizedEmail } });
    if (existingEmail && existingEmail.id !== user.id) {
      const error = new Error("Email gia' registrata");
      error.status = 409;
      throw error;
    }
    user.email = normalizedEmail;
  }

  if (username) {
    if (!validateUsername(username)) {
      const error = new Error(
        "Il nome utente deve avere 3-24 caratteri (lettere, numeri, underscore)"
      );
      error.status = 400;
      throw error;
    }
    const normalizedUsername = normalizeUsername(username);
    const existingUsername = await User.findOne({ where: { username: normalizedUsername } });
    if (existingUsername && existingUsername.id !== user.id) {
      const error = new Error("Nome utente gia' in uso");
      error.status = 409;
      throw error;
    }
    user.username = normalizedUsername;
  }


  // Se la password viene cambiata, resetta anche l'hash del refresh token per forzare riconnessione.

  if (newPassword) {
    if (!validatePassword(newPassword)) {
      const error = new Error("La password deve avere 8-128 caratteri");
      error.status = 400;
      throw error;
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.refreshTokenHash = null;
  }

  await user.save();

  return { id: user.id, email: user.email, username: user.username };
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  deleteAccount,
  updateAccount,
};

