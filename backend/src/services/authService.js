const bcrypt = require("bcrypt");

const User = require("../models/User");
const Game = require("../models/Game");
const { sequelize } = require("../db");
const { validateEmail, validatePassword, validateUsername } = require("../utils/validators");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");

const normalizeEmail = (email) => email.trim().toLowerCase();

const normalizeUsername = (username) => username.trim().toLowerCase();

const register = async ({ email, password, username }) => {
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

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
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

const login = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Email o nome utente e password sono obbligatori");
    error.status = 400;
    throw error;
  }

  const identifier = email.trim();
  const isEmail = identifier.includes("@");
  if (isEmail && !validateEmail(identifier)) {
    const error = new Error("Email non valida");
    error.status = 400;
    throw error;
  }

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

  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await user.save();

  return {
    user: { id: user.id, email: user.email, username: user.username },
    tokens: { accessToken, refreshToken },
  };
};

const refresh = async ({ refreshToken }) => {
  if (!refreshToken) {
    const error = new Error("Il refresh token e' obbligatorio");
    error.status = 400;
    throw error;
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findByPk(payload.userId);
  if (!user || !user.refreshTokenHash) {
    const error = new Error("Refresh token non valido");
    error.status = 401;
    throw error;
  }

  const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!matches) {
    const error = new Error("Refresh token non valido");
    error.status = 401;
    throw error;
  }

  const accessToken = signAccessToken({ userId: user.id });
  const nextRefreshToken = signRefreshToken({ userId: user.id });
  user.refreshTokenHash = await bcrypt.hash(nextRefreshToken, 12);
  await user.save();

  return {
    tokens: { accessToken, refreshToken: nextRefreshToken },
  };
};

const logout = async ({ refreshToken }) => {
  if (!refreshToken) {
    return;
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    return;
  }

  const user = await User.findByPk(payload.userId);
  if (!user) {
    return;
  }

  user.refreshTokenHash = null;
  await user.save();
};


const deleteAccount = async ({ userId, password }) => {
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

  await sequelize.transaction(async (transaction) => {
    await Game.destroy({ where: { userId }, transaction });
    await user.destroy({ transaction });
  });
};

const updateAccount = async ({ userId, email, username, password, newPassword }) => {
  if (!password) {
    const error = new Error("La password attuale e' obbligatoria");
    error.status = 400;
    throw error;
  }

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
