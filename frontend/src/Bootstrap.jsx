import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { setAuthToken } from "./services/api.js";

const Bootstrap = () => {
  useEffect(() => {
    const raw = localStorage.getItem("rtu_auth");
    if (!raw) {
      return;
    }
    try {
      const auth = JSON.parse(raw);
      if (auth?.accessToken) {
        setAuthToken(auth.accessToken);
      }
    } catch {
      localStorage.removeItem("rtu_auth");
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Bootstrap;
