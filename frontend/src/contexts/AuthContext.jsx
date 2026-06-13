import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

  const persistAuth = useCallback((nextAuth) => {
    setAuth(nextAuth);
    if (!nextAuth) {
      localStorage.removeItem("rtu_auth");
      setAuthToken(null);
      return;
    }

    localStorage.setItem("rtu_auth", JSON.stringify(nextAuth));
    setAuthToken(nextAuth.accessToken);
  }, []);

  const register = useCallback(async (payload) => {
    const response = await api.post("/api/auth/register", payload);
    persistAuth({
      user: response.data.user,
      accessToken: response.data.tokens.accessToken,
    });

    return response.data;
  }, [persistAuth]);

  const login = useCallback(async (payload) => {
    const response = await api.post("/api/auth/login", payload);
    persistAuth({
      user: response.data.user,
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
    });
    return response.data;
  }, [persistAuth]);

  const logout = useCallback(async () => {
    // Notifichiamo il server: quando l’utente fa logout, la partita corrente va in paused.
    try {
      const me = await api.get("/api/games/me/active");
      if (me?.data?.id) {
        // Mettiamo in pausa (non abbandoniamo)
        await api.post(`/api/games/${me.data.id}/pause`);
      }
    } catch {
      // noop (nessuna partita o errore di rete): procediamo comunque con il logout
    }

    try {
      await api.post("/api/auth/logout");
    } catch {
      // noop: even if refresh cookie already expired
    }

    persistAuth(null);
  }, [persistAuth]);



  const updateAccount = useCallback(async (payload) => {
    const response = await api.post("/api/auth/update", payload);
    if (response?.data?.user) {
      persistAuth({
        user: response.data.user,
        accessToken: auth?.accessToken,
      });

    }
    return response.data;
  }, [auth?.accessToken, persistAuth]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || "";
        const isAuthEndpoint = url.startsWith("/api/auth/");
        if (status === 401 && auth?.accessToken && !isAuthEndpoint) {
          persistAuth(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [auth?.accessToken, persistAuth]);

  const value = useMemo(
    () => ({
      auth,
      isAuthed: Boolean(auth?.accessToken),
      register,
      login,
      logout,
      updateAccount,
    }),
    [auth, register, login, logout, updateAccount]
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
