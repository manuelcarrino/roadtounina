const bcrypt = require("bcrypt");

const User = require("../models/User");
const { validateEmail, validatePassword } = require("../utils/validators");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");

const normalizeEmail = (email) => email.trim().toLowerCase();

const register = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.status = 400;
    throw error;
  }

  if (!validateEmail(email)) {
    const error = new Error("Email is not valid");
    error.status = 400;
    throw error;
  }

  if (!validatePassword(password)) {
    const error = new Error("Password must be 8-128 characters");
    error.status = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    const error = new Error("Email already registered");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email: normalizedEmail, passwordHash });

  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await user.save();

  return {
    user: { id: user.id, email: user.email },
    tokens: { accessToken, refreshToken },
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.status = 400;
    throw error;
  }

  if (!validateEmail(email)) {
    const error = new Error("Email is not valid");
    error.status = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await user.save();

  return {
    user: { id: user.id, email: user.email },
    tokens: { accessToken, refreshToken },
  };
};

const refresh = async ({ refreshToken }) => {
  if (!refreshToken) {
    const error = new Error("Refresh token is required");
    error.status = 400;
    throw error;
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findByPk(payload.userId);
  if (!user || !user.refreshTokenHash) {
    const error = new Error("Invalid refresh token");
    error.status = 401;
    throw error;
  }

  const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!matches) {
    const error = new Error("Invalid refresh token");
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

module.exports = {
  register,
  login,
  refresh,
  logout,
};
