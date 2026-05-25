import { createContext, useContext, useMemo, useState } from "react";

import { api, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

const getStoredAuth = () => {
  const raw = localStorage.getItem("rtu_auth");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => getStoredAuth());

  const persistAuth = (nextAuth) => {
    setAuth(nextAuth);
    if (!nextAuth) {
      localStorage.removeItem("rtu_auth");
      setAuthToken(null);
      return;
    }

    localStorage.setItem("rtu_auth", JSON.stringify(nextAuth));
    setAuthToken(nextAuth.accessToken);
  };

  const register = async (payload) => {
    const response = await api.post("/api/auth/register", payload);
    persistAuth({
      user: response.data.user,
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
    });
    return response.data;
  };

  const login = async (payload) => {
    const response = await api.post("/api/auth/login", payload);
    persistAuth({
      user: response.data.user,
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
    });
    return response.data;
  };

  const logout = async () => {
    const refreshToken = auth?.refreshToken;
    if (refreshToken) {
      await api.post("/api/auth/logout", { refreshToken });
    }
    persistAuth(null);
  };

  const value = useMemo(
    () => ({
      auth,
      isAuthed: Boolean(auth?.accessToken),
      register,
      login,
      logout,
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
