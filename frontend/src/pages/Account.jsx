import { useState } from "react";

import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

const Account = () => {
  const { auth, isAuthed, login, register, logout, updateAccount } = useAuth();
  const [mode, setMode] = useState("login");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("idle");
  const [deleteError, setDeleteError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("idle");
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    email: "",
    username: "",
    password: "",
    newPassword: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        if (form.password !== form.confirmPassword) {
          setStatus("error");
          setError("Le password non coincidono");
          return;
        }
        await register({
          email: form.email,
          password: form.password,
          username: form.username,
        });
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

  const handleEditChange = (event) => {
    setEditForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const openEditModal = () => {
    setEditForm({
      email: auth?.user?.email || "",
      username: auth?.user?.username || "",
      password: "",
      newPassword: "",
    });
    setEditError("");
    setEditStatus("idle");
    setEditOpen(true);
  };

  const handleEditAccount = async (event) => {
    event.preventDefault();
    setEditStatus("loading");
    setEditError("");

    try {
      await updateAccount(editForm);
      setEditStatus("success");
      setEditForm({ email: "", username: "", password: "", newPassword: "" });
      setEditOpen(false);
    } catch (err) {
      setEditStatus("error");
      setEditError(err?.response?.data?.message || "Aggiornamento non riuscito");
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    setDeleteStatus("loading");
    setDeleteError("");

    try {
      await api.post("/api/auth/delete", { password: deletePassword });
      await logout();
      setDeletePassword("");
      setDeleteOpen(false);
      setDeleteStatus("success");
    } catch (err) {
      setDeleteStatus("error");
      setDeleteError(err?.response?.data?.message || "Eliminazione non riuscita");
    }
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
              {auth?.user?.username?.slice(0, 2)?.toUpperCase() ||
                auth?.user?.email?.slice(0, 2)?.toUpperCase() ||
                "RT"}
            </div>
            <div className="account-meta">
              <h3>{auth?.user?.username || "Profilo"}</h3>
              <p className="muted">{auth?.user?.email}</p>
              <p className="muted">Autenticazione attiva</p>
            </div>
          </article>
          <article className="panel">
            <h3>Azioni rapide</h3>
            <p className="muted">Gestisci la tua sessione.</p>
            <div className="quick-actions">
              <button
                className="btn ghost"
                onClick={openEditModal}
                type="button"
              >
                Modifica
              </button>
              <button className="btn ghost" onClick={logout} type="button">
                Logout
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  setDeleteOpen(true);
                  setDeleteError("");
                }}
                type="button"
              >
                Elimina account
              </button>
            </div>
            {deleteOpen && (
              <div className="modal-backdrop" role="presentation">
                <div className="modal" role="dialog" aria-modal="true">
                  <div>
                    <h4>Conferma eliminazione</h4>
                    <p className="muted">
                      Inserisci la password per eliminare definitivamente il tuo account.
                    </p>
                  </div>
                  <form className="stack" onSubmit={handleDeleteAccount}>
                    <label>
                      Password
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(event) => setDeletePassword(event.target.value)}
                        required
                      />
                    </label>
                    {deleteError && <p className="notice error">{deleteError}</p>}
                    <div className="modal-actions">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => {
                          setDeleteOpen(false);
                          setDeletePassword("");
                          setDeleteError("");
                        }}
                      >
                        Annulla
                      </button>
                      <button
                        className="btn danger"
                        type="submit"
                        disabled={deleteStatus === "loading"}
                      >
                        {deleteStatus === "loading"
                          ? "Attendi..."
                          : "Conferma eliminazione"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {editOpen && (
              <div className="modal-backdrop" role="presentation">
                <div className="modal" role="dialog" aria-modal="true">
                  <div>
                    <h4>Modifica account</h4>
                    <p className="muted">Aggiorna i tuoi dati e conferma con la password.</p>
                  </div>
                  <form className="stack" onSubmit={handleEditAccount}>
                    <label>
                      Nome utente
                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleEditChange}
                        required
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        required
                      />
                    </label>
                    <label>
                      Nuova password (opzionale)
                      <input
                        type="password"
                        name="newPassword"
                        value={editForm.newPassword}
                        onChange={handleEditChange}
                      />
                    </label>
                    <label>
                      Password attuale
                      <input
                        type="password"
                        name="password"
                        value={editForm.password}
                        onChange={handleEditChange}
                        required
                      />
                    </label>
                    {editError && <p className="notice error">{editError}</p>}
                    <div className="modal-actions">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => setEditOpen(false)}
                      >
                        Annulla
                      </button>
                      <button
                        className="btn primary"
                        type="submit"
                        disabled={editStatus === "loading"}
                      >
                        {editStatus === "loading" ? "Attendi..." : "Salva modifiche"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </article>
          <article className="panel">
            <h3>Consigli</h3>
            <ul className="tips">
              <li>Gioca da qualsiasi device grazie al salvataggio server.</li>
              <li>Usa la ricerca link per ottimizzare i passaggi.</li>
              <li>Controlla la classifica per scalare posizioni.</li>
            </ul>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-head">
        <h2>{mode === "login" ? "Accedi" : "Crea account"}</h2>
        <p>Accedi per iniziare una nuova sfida.</p>
      </div>
      <div className="account-grid">
        <form className="form panel" onSubmit={handleSubmit}>
          <div>
            <h3>{mode === "login" ? "Bentornato" : "Pronto a partire"}</h3>
            <p className="muted">Inserisci le credenziali per continuare.</p>
          </div>
        {mode === "register" && (
          <label>
            Nome utente
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>
        )}
        <label>
          {mode === "login" ? "Email o nome utente" : "Email"}
          <input
            type={mode === "login" ? "text" : "email"}
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
        {mode === "register" && (
          <label>
            Conferma password
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </label>
        )}
        {error && <p className="notice error">{error}</p>}
        <button className="btn primary" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Attendi..." : mode === "login" ? "Accedi" : "Registrati"}
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
          <div className="account-side-head">
            <h3>Vantaggi account</h3>
            <span className="badge">PROFILATO</span>
          </div>
          <p className="muted">
            Tieni traccia del percorso e costruisci lo storico delle tue sfide.
          </p>
          <div className="account-mini-grid">
            <div className="mini-card">
              <p className="stat">Percorso salvato</p>
              <span className="muted">ogni click resta online</span>
            </div>
            <div className="mini-card">
              <p className="stat">Tempo live</p>
              <span className="muted">durata aggiornata</span>
            </div>
            <div className="mini-card">
              <p className="stat">Classifica</p>
              <span className="muted">salite piu' rapide</span>
            </div>
            <div className="mini-card">
              <p className="stat">Riprendi ovunque</p>
              <span className="muted">multi-dispositivo</span>
            </div>
          </div>
          <div className="account-stamps">
            <span>LIVE</span>
            <span>SYNC</span>
            <span>TRACK</span>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Account;
