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


const targetPageDefault = process.env.TARGET_PAGE || "Universita degli Studi di Napoli Federico II";

/*
Normalizza una stringa per confronto robusto:
- insensibile a maiuscole/minuscole
- rimuove accenti
- normalizza spazi
*/
const normalizeForCompare = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

    

// Avvia una nuova partita per un utente.

const startNewGame = async (userId) => {

  // Verifica che l’utente esista

  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("Utente non trovato");
    error.status = 404;
    throw error;
  }

  // Sceglie una pagina iniziale casuale

  let initialPage = await getRandomPage();

  // Normalizza/risolve la target page (gestisce varianti/redirect)

  let normalizedTargetPage = normalizeTitle(targetPageDefault) || targetPageDefault;
  const resolvedTarget = await resolvePageTitle(normalizedTargetPage);
  if (resolvedTarget) {
    normalizedTargetPage = resolvedTarget;
  }
    

  // Crea un record Game in DB con stato iniziale in_progress

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



// Esegue una mossa (click) verso la nextPage

const addMove = async (userId, gameId, nextPage) => {

  // nextPage richiesta e gameId valido

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

  // nextPage deve essere un titolo Wikipedia valido e con vincoli di lunghezza

  const normalizedNextPage = validateWikiTitle(nextPage);
  if (!normalizedNextPage) {
    const error = new Error(
      `La pagina successiva non è valida (max ${maxTitleLength} caratteri, senza namespace)`
    );
    error.status = 400;
    throw error;
  }

  // la partita deve esistere ed appartenere all’utente

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  // impedisce cheat se il gioco è in pausa o terminato

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

  // nextPage deve essere effettivamente linkata dalla currentPage (da wikiService)

  const normalizedLinkedPages = new Set(
    (pageData.links || []).map(normalizeTitle)
  );

  if (!normalizedLinkedPages.has(normalizedNextPage)) {
    const error = new Error("La pagina successiva non è collegata dalla pagina corrente");
    error.status = 400;
    throw error;
  }

  // path e currentPage aggiornati

  game.path = [...game.path, normalizedNextPage];
  game.currentPage = normalizedNextPage;

  // clicks incrementati

  game.clicks += 1;

  game.lastActivityAt = new Date();

  // se la target viene raggiunta: status=completed, endedAt e durationSeconds calcolati

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





/* Annulla l'ultima mossa del giocatore
 (In pratica, rimuove l'ultimo elemento da `game.path`, aggiorna `currentPage`e riallinea i campi di stato nel DB)
*/
const undoMove = async (userId, gameId) => {
  // Normalizza/valida l'ID della partita per evitare query non corrette
  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  // Recupera la partita assicurandosi che appartenga all'utente autenticato
  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  // Consente l'annullamento solo se la partita è attiva

  if (game.status !== "in_progress") {
    const error = new Error("La partita non è attiva");
    error.status = 403;
    throw error;
  }

  /* Se il percorso ha un solo elemento (o non è valido), non c'è nulla da annullare.
    (questo evita di "tornare indietro" oltre la pagina iniziale)
  */
  if (!Array.isArray(game.path) || game.path.length <= 1) {
    return game;
  }

  // Rimuove l'ultima pagina visitata e torna alla precedente.

  game.path = game.path.slice(0, game.path.length - 1);
  game.currentPage = game.path[game.path.length - 1];


  // Aggiorna metriche e last activity, incrementando `clicks`

  game.clicks = (game.clicks || 0) + 1;
  game.lastActivityAt = new Date();

  // Riallinea lo stato di gioco: undo riporta la partita in corso

  game.status = "in_progress";
  game.endedAt = null;
  game.durationSeconds = null;
  game.pausedAt = null;

  await game.save();
  return game;
};

// N.B: Le partite in_progress inattive oltre una certa TTL verranno marcate come 'paused'.

// Recupera la partita attiva (o appena in pausa) per l'utente
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

  // Cerchiamo la partita attiva includendo lo stato "paused"
  return Game.findOne({
    where: { 
      userId, 
      status: { [Op.in]: ["in_progress", "paused"] } 
    },
    order: [["startedAt", "DESC"]],
  });
};



// Recupera l'HTML della pagina Wikipedia corrente per la partita specificata.

const getGameLinks = async (userId, gameId) => {

  // Validazione ID (difensiva) per evitare query con input non conforme.
  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  // Recupera la partita assicurandosi che appartenga all'utente autenticato.
  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  // Recupera i dati della pagina corrente da Wikipedia.
  let pageData;
  try {
    pageData = await getPageData(game.currentPage);
  } catch (err) {
    const error = new Error("Contenuto di Wikipedia non disponibile");
    error.status = 502;
    throw error;
  }

  // Risposta minimale per il frontend.
  return {
    gameId: game.id,
    currentPage: game.currentPage,
    html: pageData.html,
  };
};



// Abbandona la partita corrente eliminandola dal DB

// N.B: È permesso sia durante 'in_progress' sia durante 'paused'

const abandonGame = async (userId, gameId) => {
  // Validazione ID (difensiva)
  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  // Recupero partita e verifica proprietà utente
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




  // Lista delle partite completate dell'utente 

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

  // Stila la classifica per il gioco in base ai click minori per partita

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




// Ripristina una partita in pausa

const resumePausedGame = async (userId, gameId) => {

  // Valida che l'ID sia un numero valido

  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  // Verifica che la partita appartenga effettivamente all'utente richiedente

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  // Controlla che lo stato sia effettivamente "paused" (previene tentativi di resume su partite già attive o terminate)

  if (game.status !== "paused") {
    const error = new Error("La partita non è in pausa");
    error.status = 409; // Conflict: stato incompatibile con l'operazione
    throw error;
  }

  // Aggiornamento stato

  game.status = "in_progress";
  game.lastActivityAt = new Date(); // Aggiorna l'attività per prevenire timeout immediati
  game.pausedAt = null;            // Rimuove il timestamp di pausa

  await game.save();
  return game;
};


// Sospende una partita in corso

const pauseGame = async (userId, gameId) => {

  // Valida che l'ID sia un numero valido

  const parsedGameId = parseId(gameId);
  if (!validateId(parsedGameId)) {
    const error = new Error("L'ID della partita non è valido");
    error.status = 400;
    throw error;
  }

  // Verifica che la partita appartenga effettivamente all'utente richiedente

  const game = await Game.findOne({ where: { id: parsedGameId, userId } });
  if (!game) {
    const error = new Error("Partita non trovata");
    error.status = 404;
    throw error;
  }

  // Controlla che lo stato sia effettivamente "in_progress" (previene tentativi di resume su partite già in pausa o terminate)

  if (game.status !== "in_progress") {
    const error = new Error("La partita non è attiva");
    error.status = 409;
    throw error;
  }

  // Aggiornamento stato
  game.status = "paused";
  game.pausedAt = new Date();       // Salva il momento esatto della pausa
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
  listCompletedGames,
  getLeaderboard,
  undoMove,
  resumePausedGame,
  pauseGame,
};