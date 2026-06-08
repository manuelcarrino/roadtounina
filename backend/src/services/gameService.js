const { QueryTypes } = require("sequelize");

const Game = require("../models/Game");
const User = require("../models/User");
const { sequelize } = require("../db");
const {
  getRandomPage,
  normalizeTitle,
  resolvePageTitle,
  getPageData,
} = require("./wikiService");


const {
  normalizePageTitle,
  validateWikiTitle,
  parseId,
  validateId,
  maxTitleLength,
} = require("../utils/validators");

const targetPageDefault =
  process.env.TARGET_PAGE || "Universita degli Studi di Napoli Federico II";

const normalizeForCompare = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const startNewGame = async (userId, startPage) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  let initialPage = null;
  if (startPage) {
    initialPage = validateWikiTitle(startPage);
    if (!initialPage) {
      const error = new Error(
        `Start page is not valid (max ${maxTitleLength} chars, no namespace)`
      );
      error.status = 400;
      throw error;
    }

    const resolvedTitle = await resolvePageTitle(initialPage);
    if (!resolvedTitle) {
      const error = new Error("Start page does not exist on Wikipedia");
      error.status = 400;
      throw error;
    }

    initialPage = resolvedTitle;
  }

  if (!initialPage) {
    initialPage = await getRandomPage();
  }

  let normalizedTargetPage = normalizeTitle(targetPageDefault) || targetPageDefault;
  const resolvedTarget = await resolvePageTitle(normalizedTargetPage);
  if (resolvedTarget) {
    normalizedTargetPage = resolvedTarget;
  }
  const game = await Game.create({
    userId: user.id,
    startPage: initialPage,
    currentPage: initialPage,
    targetPage: normalizedTargetPage,
    path: [initialPage],
    clicks: 0,
    status: "in_progress",
    startedAt: new Date(),
  });

  return game;
};

const addMove = async (userId, gameId, nextPage) => {
  if (!nextPage) {
    const error = new Error("Next page is required");
    error.status = 400;
    throw error;
  }

  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("Game id is not valid");
    error.status = 400;
    throw error;
  }

  const normalizedNextPage = validateWikiTitle(nextPage);
  if (!normalizedNextPage) {
    const error = new Error(
      `Next page is not valid (max ${maxTitleLength} chars, no namespace)`
    );
    error.status = 400;
    throw error;
  }



  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Game not found");
    error.status = 404;
    throw error;
  }

  if (game.status !== "in_progress") {
    const error = new Error("Game is not active");
    error.status = 409;
    throw error;
  }

  // Recuperiamo links + html tramite getPageData (stessa fonte usata da /links)
  let pageData;
  try {
    pageData = await getPageData(game.currentPage);
  } catch (err) {
    const error = new Error("Wikipedia content unavailable");
    error.status = 502;
    throw error;
  }

  const normalizedLinkedPages = new Set(
    (pageData.links || []).map(normalizeTitle)
  );

  if (!normalizedLinkedPages.has(normalizedNextPage)) {
    const error = new Error("Next page is not linked from current page");
    error.status = 400;
    throw error;
  }


  // Indietro: non consideriamo la pagina precedente come una nuova “mossa” valida se non è linkata.
  // Però manteniamo coerente path/currentPage/clicks già gestiti dal client.
  game.path = [...game.path, normalizedNextPage];
  game.currentPage = normalizedNextPage;
  game.clicks += 1;


  if (normalizeForCompare(normalizedNextPage) === normalizeForCompare(game.targetPage)) {
    game.status = "completed";
    game.endedAt = new Date();
    game.durationSeconds = Math.max(
      0,
      Math.floor((game.endedAt - game.startedAt) / 1000)
    );
  }

  await game.save();
  return game;
};

const undoMove = async (userId, gameId) => {
  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("Game id is not valid");
    error.status = 400;
    throw error;
  }

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Game not found");
    error.status = 404;
    throw error;
  }

  if (game.status !== "in_progress") {
    const error = new Error("Game is not active");
    error.status = 409;
    throw error;
  }

  // path: [startPage, ...]; quindi l'ultimo elemento è la corrente
  if (!Array.isArray(game.path) || game.path.length <= 1) {
    return game;
  }

  // rimuove la pagina corrente, lascia la precedente
  game.path = game.path.slice(0, game.path.length - 1);
  game.currentPage = game.path[game.path.length - 1];


  // Indietro deve contare comunque come click
  game.clicks = (game.clicks || 0) + 1;

  game.status = "in_progress";
  game.endedAt = null;
  game.durationSeconds = null;

  await game.save();
  return game;
};

const getActiveGame = async (userId) => {
  return Game.findOne({
    where: { userId, status: "in_progress" },
    order: [["startedAt", "DESC"]],
  });
};


const getGameLinks = async (userId, gameId) => {
  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("Game id is not valid");
    error.status = 400;
    throw error;
  }

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Game not found");
    error.status = 404;
    throw error;
  }

  let pageData;
  try {
    // Recupera l'HTML (e i link) della pagina corrente
    pageData = await getPageData(game.currentPage);
  } catch (err) {
    const error = new Error("Wikipedia content unavailable");
    error.status = 502;
    throw error;
  }


  // Rispondiamo inviando l'HTML direttamente al frontend
  return {
    gameId: game.id,
    currentPage: game.currentPage,
    html: pageData.html,
  };
};

const abandonGame = async (userId, gameId) => {
  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("Game id is not valid");
    error.status = 400;
    throw error;
  }

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Game not found");
    error.status = 404;
    throw error;
  }

  if (game.status !== "in_progress") {
    const error = new Error("Game is not active");
    error.status = 409;
    throw error;
  }

  // Per evitare giochi “orfani”/in corso, eliminiamo direttamente il record
  // invece di marcarlo come failed.
  await Game.destroy({ where: { id: parsedGameId, userId } });

  return { id: parsedGameId, deleted: true };
};


const listUserGames = async (userId) => {
  return Game.findAll({ where: { userId }, order: [["startedAt", "DESC"]] });
};

const listCompletedGames = async () => {
  return Game.findAll({
    where: { status: "completed" },
    attributes: [
      "startPage",
      "targetPage",
      "path",
      "clicks",
      "durationSeconds",
      "startedAt",
      "endedAt",
    ],
    include: [{ model: User, attributes: ["username"] }],
    order: [["endedAt", "DESC"]],
  });
};

const getLeaderboard = async () => {
  const results = await sequelize.query(
    `
      SELECT
        games.userId AS userId,
        MIN(games.clicks) AS bestClicks,
        COUNT(*) AS completedCount,
        users.username AS username
      FROM games
      LEFT JOIN users ON users.id = games.userId
      WHERE games.status = 'completed'
      GROUP BY games.userId
      ORDER BY bestClicks ASC, completedCount DESC
      LIMIT 50
    `,
    { type: QueryTypes.SELECT }
  );

  return results;
};

module.exports = {
  startNewGame,
  addMove,
  getActiveGame,
  getGameLinks,
  abandonGame,
  listUserGames,
  listCompletedGames,
  getLeaderboard,
  undoMove,
};
