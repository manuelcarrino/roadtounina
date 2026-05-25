const jwt = require("jsonwebtoken");

const accessSecret = process.env.JWT_ACCESS_SECRET || "change-me-access";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "change-me-refresh";
const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
const refreshTtl = process.env.JWT_REFRESH_TTL || "7d";

const signAccessToken = ({ userId }) =>
  jwt.sign({ userId }, accessSecret, { expiresIn: accessTtl });

const signRefreshToken = ({ userId }) =>
  jwt.sign({ userId }, refreshSecret, { expiresIn: refreshTtl });

const verifyAccessToken = (token) => jwt.verify(token, accessSecret);

const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
