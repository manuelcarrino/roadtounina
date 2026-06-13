/* 
Senza questo wrapper, sarei costretto a scrivere try/catch in ogni singola funzione dei controller 
perché Express non cattura automaticamente le eccezioni asincrone
*/

const asyncHandler = (handler) => (req, res, next) => {
  // Esegue l'handler e lo avvolge in una Promise.
  // Se la Promise fallisce (.catch), inoltra l'errore al gestore globale (next(err)).
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = { asyncHandler };