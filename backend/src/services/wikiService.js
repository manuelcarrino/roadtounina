const WIKI_ENDPOINT = "https://it.wikipedia.org/w/api.php";

const linksCache = new Map();
const cacheTtlMs = 10 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJsonWithRetry = async (url, { retries = 7, backoffMs = 400 } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // 429 = rate limit. Anche 4xx/5xx qui vengono gestiti tramite retry se previsto.
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`Upstream status ${response.status}`);
        }
        // errori 4xx non gestiti esplicitamente: falliamo subito
        return { response, payload: null };
      }

      const payload = await response.json().catch(() => null);
      return { response, payload };
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(backoffMs * (attempt + 1));
        continue;
      }
    }
  }
  throw lastError;
};

const normalizeTitle = (title) => {
  if (!title || typeof title !== "string") {
    return null;
  }

  const normalized = title
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

  if (normalized.includes(":") || normalized.includes("#")) {
    return null;
  }

  return normalized;
};

const getRandomPage = async () => {
  const params = new URLSearchParams({
    action: "query",
    list: "random",
    rnnamespace: "0",
    rnfilterredir: "nonredirects",
    rnminsize: "500",
    rnmaxsize: "100000",
    format: "json",
    origin: "*",
  });


  const { response, payload } = await fetchJsonWithRetry(
    `${WIKI_ENDPOINT}?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch random page");
  }
  const randomEntry = payload?.query?.random?.[0];
  if (!randomEntry?.title) {
    throw new Error("Random page not available");
  }

  return normalizeTitle(randomEntry.title);
};

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
    throw new Error("Failed to resolve page title");
  }
  const pages = payload?.query?.pages || {};
  const page = Object.values(pages)[0];

  if (!page || page.missing) {
    return null;
  }

  return normalizeTitle(page.title);
};

// NUOVA FUNZIONE: Estrae sia l'HTML che la struttura dei link validi
const getPageData = async (pageTitle) => {
  const normalizedTitle = normalizeTitle(pageTitle);
  if (!normalizedTitle) {
    throw new Error("Page title is not valid");
  }
  const cacheKey = `data::${normalizedTitle}`;
  const cached = linksCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
    return cached.data;
  }

  const params = new URLSearchParams({
    action: "parse",
    page: normalizedTitle,
    prop: "text|links", // Chiede sia l'HTML che l'elenco dei link associati
    format: "json",
    origin: "*",
    disableeditsection: "true", // Rimuove i fastidiosi bottoni "[modifica]" dall'HTML
  });

  const { response, payload } = await fetchJsonWithRetry(
    `${WIKI_ENDPOINT}?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch page data");
  }

  const html = payload?.parse?.text?.["*"] || "";
  const parseLinks = payload?.parse?.links || [];
  
  const links = parseLinks
    .filter((entry) => entry.ns === 0 && entry["*"])
    .map((entry) => normalizeTitle(entry["*"]))
    .filter(Boolean);

  const data = { html, links };
  linksCache.set(cacheKey, { timestamp: Date.now(), data });
  return data;
};

// Mantiene la compatibilità con addMove senza rompere nulla
const getPageLinks = async (pageTitle) => {
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