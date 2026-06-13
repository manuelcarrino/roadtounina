import axios from "axios";

const apiBaseUrl = window.location.hostname === 'localhost' 
  ? "http://localhost:3001" 
  : "";

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});


export const setAuthToken = (token) => {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

const getCookie = (name) => {
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const c of cookies) {
    const [k, ...rest] = c.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
};

api.interceptors.request.use((config) => {
  // CSRF: invia header X-CSRF-Token dal cookie non-HttpOnly (csrfToken)
  const csrfToken = getCookie("csrfToken");
  if (csrfToken) {
    config.headers = config.headers || {};
    config.headers["x-csrf-token"] = csrfToken;
  }
  return config;
});


