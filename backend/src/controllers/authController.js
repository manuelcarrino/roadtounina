const authService = require("../services/authService");

const register = async (req, res) => {
  const { email, password, username } = req.body;
  const result = await authService.register({ email, password, username });
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
