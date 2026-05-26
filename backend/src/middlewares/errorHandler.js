const notFoundHandler = (_req, _res, next) => {
  const error = new Error("Risorsa non trovata");
  error.status = 404;
  next(error);
};

const errorHandler = (err, _req, res, _next) => {
  const status = err.status || (err.message === "Not allowed by CORS" ? 403 : 500);
  const fallbackMessages = {
    400: "Richiesta non valida",
    401: "Sessione scaduta. Effettua di nuovo l'accesso.",
    403: "Operazione non consentita",
    404: "Risorsa non trovata",
    409: "Operazione non valida",
    429: "Troppe richieste. Attendi un attimo.",
    500: "Errore interno. Riprova più tardi.",
    502: "Servizio esterno non disponibile. Riprova tra poco.",
  };
  const messageMap = {
    "Internal server error": fallbackMessages[500],
    "Route not found": fallbackMessages[404],
    "Not allowed by CORS": fallbackMessages[403],
    "Page title is not valid": "Pagina non valida",
    "Page does not exist": "Pagina non disponibile",
    "Failed to fetch random page": fallbackMessages[502],
    "Failed to resolve page title": fallbackMessages[502],
    "Failed to fetch page links": fallbackMessages[502],
  };
  const rawMessage = err.message || "";
  const message = messageMap[rawMessage] ||
    (rawMessage.startsWith("Upstream status") ? fallbackMessages[502] : rawMessage) ||
    fallbackMessages[status] ||
    "Errore imprevisto";
  const payload = { message, status };
  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
