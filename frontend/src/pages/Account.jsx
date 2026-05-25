import { useState } from "react";

import { useAuth } from "../contexts/AuthContext";

const Account = () => {
  const { auth, isAuthed, login, register, logout } = useAuth();
  const [mode, setMode] = useState("login");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      if (mode === "login") {
        await login(form);
      } else {
        await register(form);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err?.response?.data?.message || "Operazione non riuscita");
    }
  };

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  if (isAuthed) {
    return (
      <section className="page">
        <div className="page-head">
          <h2>Account</h2>
          <p>Il tuo profilo e' pronto per la prossima sfida.</p>
        </div>
        <div className="account-grid">
          <article className="panel account-card">
            <div className="account-avatar">
              {auth?.user?.email?.slice(0, 2)?.toUpperCase() || "RT"}
            </div>
            <div>
              <h3>{auth?.user?.email}</h3>
              <p className="muted">Autenticazione attiva</p>
            </div>
          </article>
          <article className="panel">
            <h3>Azioni rapide</h3>
            <p className="muted">Gestisci la tua sessione.</p>
            <button className="btn ghost" onClick={logout} type="button">
              Logout
            </button>
          </article>
          <article className="panel">
            <h3>Consigli</h3>
            <ul className="tips">
              <li>Gioca da qualsiasi device grazie al salvataggio server.</li>
              <li>Usa la ricerca link per ottimizzare i passaggi.</li>
              <li>Controlla la leaderboard per scalare posizioni.</li>
            </ul>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-head">
        <h2>{mode === "login" ? "Login" : "Crea account"}</h2>
        <p>Accedi per iniziare una nuova sfida.</p>
      </div>
      <div className="account-grid">
        <form className="form panel" onSubmit={handleSubmit}>
          <div>
            <h3>{mode === "login" ? "Bentornato" : "Pronto a partire"}</h3>
            <p className="muted">Inserisci le credenziali per continuare.</p>
          </div>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        {error && <p className="notice error">{error}</p>}
        <button className="btn primary" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Attendi..." : mode === "login" ? "Login" : "Registrati"}
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Crea un account" : "Ho gia' un account"}
        </button>
        </form>
        <article className="panel account-side">
          <h3>Perche' creare un account?</h3>
          <p className="muted">
            Salvi il percorso, il tempo e i click. La tua classifica rimane sempre
            sincronizzata.
          </p>
          <div className="account-highlights">
            <div>
              <p className="stat">Multi-device</p>
              <span className="muted">Riprendi ovunque.</span>
            </div>
            <div>
              <p className="stat">Ranking</p>
              <span className="muted">Scala la leaderboard.</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Account;
