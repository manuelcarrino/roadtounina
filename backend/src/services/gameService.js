const { QueryTypes } = require("sequelize");
const { Op } = require("sequelize");

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
    const error = new Error("Utente non trovato");
    error.status = 404;
    throw error;
  }

  let initialPage = null;
  if (startPage) {
    initialPage = validateWikiTitle(startPage);
    if (!initialPage) {
      const error = new Error(
        `La pagina di partenza non è valida (max ${maxTitleLength} caratteri, senza namespace)`
      );
      error.status = 400;
      throw error;
    }

    const resolvedTitle = await resolvePageTitle(initialPage);
    if (!resolvedTitle) {
      const error = new Error("La pagina di partenza non esiste su Wikipedia");
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
    lastActivityAt: new Date(),
    pausedAt: null,
  });

  return game;
};

const addMove = async (userId, gameId, nextPage) => {
  if (!nextPage) {
    const error = new Error("La pagina successiva è richiesta");
    error.status = 400;
    throw error;
  }

  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  const normalizedNextPage = validateWikiTitle(nextPage);
  if (!normalizedNextPage) {
    const error = new Error(
      `La pagina successiva non è valida (max ${maxTitleLength} caratteri, senza namespace)`
    );
    error.status = 400;
    throw error;
  }

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  // CONTROLLO DI SICUREZZA: Impedisce cheat se il gioco è in pausa o terminato
  if (game.status !== "in_progress") {
    const error = new Error("Azione non permessa: la partita è in pausa o terminata.");
    error.status = 403;
    throw error;
  }

  let pageData;
  try {
    pageData = await getPageData(game.currentPage);
  } catch (err) {
    const error = new Error("Contenuto di Wikipedia non disponibile");
    error.status = 502;
    throw error;
  }

  const normalizedLinkedPages = new Set(
    (pageData.links || []).map(normalizeTitle)
  );

  if (!normalizedLinkedPages.has(normalizedNextPage)) {
    const error = new Error("La pagina successiva non è collegata dalla pagina corrente");
    error.status = 400;
    throw error;
  }

  game.path = [...game.path, normalizedNextPage];
  game.currentPage = normalizedNextPage;
  game.clicks += 1;
  game.lastActivityAt = new Date();

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
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  if (game.status !== "in_progress") {
    const error = new Error("La partita non è attiva");
    error.status = 403;
    throw error;
  }

  if (!Array.isArray(game.path) || game.path.length <= 1) {
    return game;
  }

  game.path = game.path.slice(0, game.path.length - 1);
  game.currentPage = game.path[game.path.length - 1];

  game.clicks = (game.clicks || 0) + 1;
  game.lastActivityAt = new Date();

  game.status = "in_progress";
  game.endedAt = null;
  game.durationSeconds = null;
  game.pausedAt = null;

  await game.save();
  return game;
};

const getActiveGame = async (userId) => {
  const now = Date.now();
  const ttlMs = Number.parseInt(process.env.GAME_INACTIVITY_TTL_MS || "900000", 10);

  await Game.update(
    { status: "paused", pausedAt: new Date() },
    {
      where: {
        userId,
        status: "in_progress",
        lastActivityAt: {
          [Op.lt]: new Date(now - ttlMs),
        },
      },
    }
  );

  // MODIFICA CHIAVE: Cerchiamo la partita attiva includendo lo stato "paused"
  return Game.findOne({
    where: { 
      userId, 
      status: { [Op.in]: ["in_progress", "paused"] } 
    },
    order: [["startedAt", "DESC"]],
  });
};

const getGameLinks = async (userId, gameId) => {
  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  let pageData;
  try {
    pageData = await getPageData(game.currentPage);
  } catch (err) {
    const error = new Error("Contenuto di Wikipedia non disponibile");
    error.status = 502;
    throw error;
  }

  return {
    gameId: game.id,
    currentPage: game.currentPage,
    html: pageData.html,
  };
};

const abandonGame = async (userId, gameId) => {
  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  // Consentiamo di abbandonare sia giochi in corso che in pausa
  if (game.status !== "in_progress" && game.status !== "paused") {
    const error = new Error("La partita non è attiva");
    error.status = 409;
    throw error;
  }

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

const resumePausedGame = async (userId, gameId) => {
  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  if (game.status !== "paused") {
    const error = new Error("La partita non è in pausa");
    error.status = 409;
    throw error;
  }

  game.status = "in_progress";
  game.lastActivityAt = new Date();
  game.pausedAt = null;

  await game.save();
  return game;
};

const pauseGame = async (userId, gameId) => {
  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  if (game.status !== "in_progress") {
    const error = new Error("La partita non è attiva");
    error.status = 409;
    throw error;
  }

  game.status = "paused";
  game.pausedAt = new Date();
  game.lastActivityAt = new Date();

  await game.save();
  return game;
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
  resumePausedGame,
  pauseGame,
};