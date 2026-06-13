const WIKI_ENDPOINT = "https://it.wikipedia.org/w/api.php";

// Cache locale per ridurre il carico verso Wikipedia

const linksCache = new Map();
const cacheTtlMs = 10 * 60 * 1000; // 10 minuti di validità

// Utility per gestire le pause tra i tentativi (Exponential Backoff)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



// Esegue una richiesta HTTP con tentativi automatici in caso di errore.
 
const fetchJsonWithRetry = async (url, { retries = 7, backoffMs = 400, timeout = 5000 } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      // Setup dell'AbortController per il timeout
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      // Esecuzione fetch passando il segnale di abort
      const response = await fetch(url, { signal: controller.signal });
      
      // Pulizia del timer se la richiesta è completata prima del timeout
      clearTimeout(id);

      if (!response.ok) {
        // Retry solo per errori di server (5xx) o rate limit (429)
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`Stato del servizio esterno ${response.status}`);
        }
        // Per errori 4xx (non 429), falliamo subito senza riprovare
        return { response, payload: null };
      }

      const payload = await response.json().catch(() => null);
      return { response, payload };
    } catch (err) {
      lastError = err;
      // Se abbiamo ancora tentativi, attendiamo prima di riprovare
      if (attempt < retries) {
        await sleep(backoffMs * (attempt + 1));
        continue;
      }
    }
  }
  // Se tutti i tentativi falliscono, solleva l'ultimo errore
  throw lastError;
};


  // Normalizzare titolo

const normalizeTitle = (title) => {

  // Pulisce i titoli delle pagine Wikipedia per renderli uniformi

  if (!title || typeof title !== "string") {
    return null;
  }

  // Rimuove spazi bianchi iniziali/finali e spazi multipli interni

  const normalized = title
    .trim()
    .replace(/_/g, " ")   // Converte gli underscore (_) in spazi
    .replace(/\s+/g, " ");

  // Filtra via titoli che contengono ":" o "#"

  if (normalized.includes(":") || normalized.includes("#")) {
    return null;
  }

  return normalized;
};

// Pagina randomica di WikiPedia

const getRandomPage = async () => {

  // Interroga l'API di Wikipedia per ottenere una pagina casuale

  const params = new URLSearchParams({
    action: "query",
    list: "random",
    rnnamespace: "0", // limita solo agli articoli enciclopedici, escludendo pagine utente/discussioni
    rnfilterredir: "nonredirects", // evita di atterrare su pagine di reindirizzamento
    rnminsize: "500",
    rnmaxsize: "100000",  // Filtra articoli troppo brevi o enormi, per mantenere il gioco bilanciato
    format: "json",
    origin: "*",
  });

  const { response, payload } = await fetchJsonWithRetry(
    `${WIKI_ENDPOINT}?${params.toString()}`
  );
  
  if (!response.ok) {
    throw new Error("Impossibile recuperare una pagina casuale");
  }

  const randomEntry = payload?.query?.random?.[0];
  if (!randomEntry?.title) {
    throw new Error("Pagina casuale non disponibile");
  }

  return normalizeTitle(randomEntry.title);
};

//  Verifica se un titolo esiste realmente su Wikipedia e ne ottiene la versione corretta (canonical)

const resolvePageTitle = async (pageTitle) => {
  const normalizedTitle = normalizeTitle(pageTitle);
  if (!normalizedTitle) {
    return null;
  }

  const params = new URLSearchParams({
    action: "query",
    titles: normalizedTitle,
    format: "json",
    origin: "*",
  });

  const { response, payload } = await fetchJsonWithRetry(
    `${WIKI_ENDPOINT}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Impossibile tradurre il titolo della pagina");
  }

  // L'API di Wikipedia restituisce le pagine in un oggetto con ID come chiave
  const pages = payload?.query?.pages || {};
  const page = Object.values(pages)[0];

  // Se la pagina è contrassegnata come 'missing', il titolo non è valido
  if (!page || page.missing) {
    return null;
  }

  return normalizeTitle(page.title);
};



// Recupera l'HTML renderizzato e la lista dei link validi di una pagina Wikipedia

const getPageData = async (pageTitle) => {
  const normalizedTitle = normalizeTitle(pageTitle);
  if (!normalizedTitle) {
    throw new Error("Il titolo della pagina non è valido");
  }

  // Controllo nella cache: se i dati esistono e non sono scaduti, li restituiamo subito (per evitare chiamate ripetute)

  const cacheKey = `data::${normalizedTitle}`;
  const cached = linksCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
    return cached.data;
  }

  // Configurazione dei parametri API per Wikipedia

  const params = new URLSearchParams({
    action: "parse",
    page: normalizedTitle,
    prop: "text|links", // Chiediamo sia il corpo (HTML) che i link contenuti
    format: "json",
    origin: "*",
    disableeditsection: "true", // Nasconde i link [modifica] per pulire l'HTML
  });

  // Chiamata con retry e timeout integrato (5000ms di default), se il server è lento o occupato, la richiesta viene abortita

  const { response, payload } = await fetchJsonWithRetry(
    `${WIKI_ENDPOINT}?${params.toString()}`
  );
  
  if (!response.ok) {
    throw new Error("Impossibile recuperare i dati della pagina");
  }

  // Estrazione dati dal payload JSON

  const html = payload?.parse?.text?.["*"] || "";
  const parseLinks = payload?.parse?.links || [];
  
  // Pulizia dei link: filtriamo solo quelli nel namespace 0 (voci enciclopediche) e rimuoviamo eventuali titoli non validi o speciali

  const links = parseLinks
    .filter((entry) => entry.ns === 0 && entry["*"])
    .map((entry) => normalizeTitle(entry["*"]))
    .filter(Boolean);

  const data = { html, links };
  
  // Salvataggio nella cache per le prossime richieste
  linksCache.set(cacheKey, { timestamp: Date.now(), data });
  return data;
};

// Interfaccia semplificata per ottenere solo i link validi.

const getPageLinks = async (pageTitle) => {

  // Utilizza getPageData internamente per sfruttare il sistema di cache

  const data = await getPageData(pageTitle);
  return data.links;
};

module.exports = {
  getRandomPage,
  getPageLinks,
  getPageData,
  normalizeTitle,
  resolvePageTitle,
};