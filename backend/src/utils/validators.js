const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const usernameRegex = /^[a-zA-Z0-9_]{3,24}$/;
const maxTitleLength = Number.parseInt(
  process.env.PAGE_TITLE_MAX_LEN || "120",
  10
);

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const validateEmail = (email) => isNonEmptyString(email) && emailRegex.test(email.trim());

const validateUsername = (username) =>
  isNonEmptyString(username) && usernameRegex.test(username.trim());

const validatePassword = (password) => {
  if (typeof password !== "string") {
    return false;
  }

  const trimmed = password.trim();
  return trimmed.length >= 8 && trimmed.length <= 128;
};

const normalizePageTitle = (value) => {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

  if (normalized.length > maxTitleLength) {
    return null;
  }

  return normalized;
};

const isMainNamespaceTitle = (value) => {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const trimmed = value.trim();
  return !trimmed.includes(":") && !trimmed.includes("#");
};

const validateWikiTitle = (value) => {
  const normalized = normalizePageTitle(value);
  if (!normalized) {
    return null;
  }

  if (!isMainNamespaceTitle(normalized)) {
    return null;
  }

  return normalized;
};

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const validateId = (value) => Number.isInteger(value) && value > 0;

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword,
  normalizePageTitle,
  validateWikiTitle,
  isMainNamespaceTitle,
  parseId,
  validateId,
  maxTitleLength,
};
