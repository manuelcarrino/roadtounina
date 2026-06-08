const gameService = require("../services/gameService");

const startGame = async (req, res) => {
  const { startPage } = req.body;
  const result = await gameService.startNewGame(req.user.id, startPage);
  res.status(201).json(result);
};

const addMove = async (req, res) => {
  const { gameId } = req.params;
  const { nextPage } = req.body;
  const result = await gameService.addMove(req.user.id, gameId, nextPage);
  res.status(200).json(result);
};

const listMyGames = async (req, res) => {
  const result = await gameService.listUserGames(req.user.id);
  res.status(200).json(result);
};

const getActiveGame = async (req, res) => {
  const result = await gameService.getActiveGame(req.user.id);
  if (!result) {
    return res.status(204).send();
  }

  return res.status(200).json(result);
};

const getGameLinks = async (req, res) => {
  const { gameId } = req.params;
  const result = await gameService.getGameLinks(req.user.id, gameId);
  res.status(200).json(result);
};


const listCompletedGames = async (_req, res) => {
  const result = await gameService.listCompletedGames();
  res.status(200).json(result);
};

const getLeaderboard = async (_req, res) => {
  const result = await gameService.getLeaderboard();
  res.status(200).json(result);
};

const abandonGame = async (req, res) => {
  const { gameId } = req.params;
  const result = await gameService.abandonGame(req.user.id, gameId);
  res.status(200).json(result);
};

const undoMove = async (req, res) => {
  const { gameId } = req.params;
  const result = await gameService.undoMove(req.user.id, gameId);
  res.status(200).json(result);
};

module.exports = {
  startGame,
  addMove,
  undoMove,
  getActiveGame,
  getGameLinks,
  listMyGames,
  listCompletedGames,
  getLeaderboard,
  abandonGame,
};
