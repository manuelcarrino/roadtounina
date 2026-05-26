import axios from "axios";

const apiBaseUrl = window.location.hostname === 'localhost' 
  ? "http://localhost:3001" 
  : "";

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

export const setAuthToken = (token) => {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

