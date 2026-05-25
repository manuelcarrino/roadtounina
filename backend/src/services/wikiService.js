const WIKI_ENDPOINT = "https://it.wikipedia.org/w/api.php";

const linksCache = new Map();
const cacheTtlMs = 10 * 60 * 1000;

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

  const response = await fetch(`${WIKI_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch random page");
  }

  const payload = await response.json();
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

  const response = await fetch(`${WIKI_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to resolve page title");
  }

  const payload = await response.json();
  const pages = payload?.query?.pages || {};
  const page = Object.values(pages)[0];

  if (!page || page.missing) {
    return null;
  }

  return normalizeTitle(page.title);
};

const getPageLinks = async (pageTitle, maxLinks = 2000) => {
  const normalizedTitle = normalizeTitle(pageTitle);
  if (!normalizedTitle) {
    throw new Error("Page title is not valid");
  }
  const cacheKey = `${normalizedTitle}::${maxLinks}`;
  const cached = linksCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
    return cached.links;
  }
  let links = [];
  let plContinue = null;

  do {
    const params = new URLSearchParams({
      action: "query",
      prop: "links",
      titles: normalizedTitle,
      plnamespace: "0",
      pllimit: "max",
      format: "json",
      origin: "*",
    });

    if (plContinue) {
      params.set("plcontinue", plContinue);
    }

    const response = await fetch(`${WIKI_ENDPOINT}?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch page links");
    }

    const payload = await response.json();
    const pages = payload?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (!page || page.missing) {
      throw new Error("Page does not exist");
    }

    const pageLinks = Array.isArray(page?.links) ? page.links : [];

    links = links.concat(pageLinks.map((entry) => normalizeTitle(entry.title)));
    plContinue = payload?.continue?.plcontinue || null;
  } while (plContinue && links.length < maxLinks);
  const result = links.slice(0, maxLinks);
  linksCache.set(cacheKey, { timestamp: Date.now(), links: result });
  return result;
};

module.exports = {
  getRandomPage,
  getPageLinks,
  normalizeTitle,
  resolvePageTitle,
};
