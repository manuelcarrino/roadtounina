const gameService = require("../services/gameService");

// Gestisce l'avvio di una nuova partita.

const startGame = async (req, res, next) => {
  try {
    const result = await gameService.startNewGame(req.user.id);
    res.status(201).json(result);
  } catch (error) {
    next(error); // Passa l'errore al tuo errorHandler globale
  }
};

// Gestisce l'aggiunta di una nuova mossa (click su un link di Wikipedia).

const addMove = async (req, res) => {
  const { gameId } = req.params;
  const { nextPage } = req.body;
  
  const result = await gameService.addMove(req.user.id, gameId, nextPage);
  
  // 200 (OK) - restituisce lo stato aggiornato della partita
  res.status(200).json(result);
};





//Recupera la partita attualmente in corso (o in pausa) per l'utente.

const getActiveGame = async (req, res) => {
  const result = await gameService.getActiveGame(req.user.id);
  
  if (!result) {

    // 204 (No Content) - nessuna partita attiva o in pausa trovata
    return res.status(204).send();
  }

  // 200 (OK) - restituisce i dati della partita trovata
  return res.status(200).json(result);
};

// Riprende una partita che era stata precedentemente messa in pausa.

const resumeGame = async (req, res) => {
  const { gameId } = req.params;
  
  const result = await gameService.resumePausedGame(req.user.id, gameId);
  
  // 200 (OK) - restituisce la partita con lo stato ripristinato a "in_progress"
  res.status(200).json(result);
};

// Recupera l'HTML e i dati della pagina Wikipedia corrente per una determinata partita.

const getGameLinks = async (req, res) => {
  const { gameId } = req.params;
  
  const result = await gameService.getGameLinks(req.user.id, gameId);
  
  // 200 (OK) - restituisce l'HTML e le informazioni della pagina attuale
  res.status(200).json(result);
};


// Recupera l'elenco globale di tutte le partite completate con successo da tutti gli utenti.

const listCompletedGames = async (_req, res) => {
  const result = await gameService.listCompletedGames();
  
  // 200 (OK) - restituisce l'array delle partite terminate
  res.status(200).json(result);
};


// Calcola e restituisce la classifica generale (Leaderboard) basata sul minor numero di click.

const getLeaderboard = async (_req, res) => {
  const result = await gameService.getLeaderboard();
  
  // 200 (OK) - array contenente le statistiche e i punteggi migliori
  res.status(200).json(result);
};


// Abbandona (ed elimina dal database) la partita corrente.

const abandonGame = async (req, res) => {
  const { gameId } = req.params;

  const result = await gameService.abandonGame(req.user.id, gameId);
  
  // 200 (OK) - conferma l'eliminazione con l'oggetto { deleted: true }
  res.status(200).json(result);
};

// Mette in pausa la partita corrente (utile in caso di disconnessione o cambio scheda).

const pauseGame = async (req, res) => {
  const { gameId } = req.params;
  
  const result = await gameService.pauseGame(req.user.id, gameId);
  
  // 200 (OK) - restituisce lo stato aggiornato a "paused"
  res.status(200).json(result);
};

// Annulla l'ultima mossa, riportando il giocatore alla pagina Wikipedia visitata precedentemente.

const undoMove = async (req, res) => {
  const { gameId } = req.params;
  
  const result = await gameService.undoMove(req.user.id, gameId);
  
  // 200 (OK) - restituisce la partita con il percorso (path) e la pagina corrente aggiornati
  res.status(200).json(result);
};

module.exports = {
  startGame,
  addMove,
  undoMove,
  getActiveGame,
  resumeGame,
  pauseGame,
  getGameLinks,
  listCompletedGames,
  getLeaderboard,
  abandonGame,
};