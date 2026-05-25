const authService = require("../services/authService");

const register = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.register({ email, password });
  res.status(201).json(result);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.status(200).json(result);
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh({ refreshToken });
  res.status(200).json(result);
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout({ refreshToken });
  res.status(204).send();
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
