const authService = require("../services/authService");

const setRefreshCookie = (res, refreshToken) => {
  const refreshMaxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7d fallback
  const secure = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || "lax";

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/api/auth",
    maxAge: refreshMaxAgeMs,
  });
};

const setCsrfCookie = (res, csrfToken) => {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || "lax";
  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure,
    sameSite,
    path: "/",
    maxAge: 60 * 60 * 1000, // 1h
  });
};

const generateCsrf = () => {
  return require("crypto").randomBytes(32).toString("base64url");
};

const register = async (req, res) => {
  const { email, password, username } = req.body;
  const result = await authService.register({ email, password, username });

  const csrfToken = generateCsrf();
  setCsrfCookie(res, csrfToken);
  setRefreshCookie(res, result.tokens.refreshToken);

  res.status(201).json({
    user: result.user,
    tokens: { accessToken: result.tokens.accessToken },
    csrfToken,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });

  const csrfToken = generateCsrf();
  setCsrfCookie(res, csrfToken);
  setRefreshCookie(res, result.tokens.refreshToken);

  res.status(200).json({
    user: result.user,
    tokens: { accessToken: result.tokens.accessToken },
    csrfToken,
  });
};

const refresh = async (req, res) => {
  const result = await authService.refresh({
    refreshToken: req.cookies?.refreshToken,
    userAgent: req.get("user-agent"),
    ip: req.ip,
  });

  // ruotiamo refresh cookie
  setRefreshCookie(res, result.tokens.refreshToken);

  res.status(200).json({
    tokens: { accessToken: result.tokens.accessToken },
  });
};


const logout = async (req, res) => {
  await authService.logout({ refreshToken: req.cookies?.refreshToken });
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.clearCookie("csrfToken", { path: "/" });
  res.status(204).send();
};

const deleteAccount = async (req, res) => {
  const { password } = req.body;
  await authService.deleteAccount({ userId: req.user.id, password });
  res.status(204).send();
};


const updateAccount = async (req, res) => {
  const { email, username, password, newPassword } = req.body;
  const result = await authService.updateAccount({
    userId: req.user.id,
    email,
    username,
    password,
    newPassword,
  });
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
