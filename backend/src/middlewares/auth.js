const { verifyAccessToken } = require("../utils/jwt");

const requireAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    const error = new Error("Access token missing");
    error.status = 401;
    return next(error);
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId };
    return next();
  } catch (error) {
    error.status = 401;
    return next(error);
  }
};

module.exports = { requireAuth };
