import { useEffect, useMemo, useState } from "react";

import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Play = () => {
  const { isAuthed } = useAuth();
  const [game, setGame] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [startPage, setStartPage] = useState("");
  const [links, setLinks] = useState([]);
  const [linksStatus, setLinksStatus] = useState("idle");
  const [linksError, setLinksError] = useState("");
  const [filter, setFilter] = useState("");
  const [linksMeta, setLinksMeta] = useState({ total: 0, filteredTotal: 0 });

  const canStart = isAuthed && status !== "loading";

  const loadActive = async () => {
    if (!isAuthed) {
      return;
    }

    try {
      const response = await api.get("/api/games/me/active");
      if (response.status === 204) {
        setGame(null);
        setLinks([]);
      } else {
        setGame(response.data);
      }
    } catch {
      setGame(null);
      setLinks([]);
    }
  };

  useEffect(() => {
    loadActive();
  }, [isAuthed]);

  const loadLinks = async (gameId, q = "") => {
    if (!gameId) {
      return;
    }
    setLinksStatus("loading");
    setLinksError("");
    try {
      const response = await api.get(`/api/games/${gameId}/links`, {
        params: { q, limit: 300 },
      });
      setLinks(response.data.links || []);
      setLinksMeta({
        total: response.data.total || 0,
        filteredTotal: response.data.filteredTotal || 0,
      });
      setLinksStatus("success");
    } catch (err) {
      setLinksStatus("error");
      setLinksError(err?.response?.data?.message || "Impossibile caricare i link");
    }
  };

  useEffect(() => {
    if (game?.id) {
      loadLinks(game.id, filter);
    }
  }, [game?.id]);

  useEffect(() => {
    if (game?.id) {
      const handler = setTimeout(() => {
        loadLinks(game.id, filter);
      }, 400);
      return () => clearTimeout(handler);
    }
    return undefined;
  }, [filter, game?.id]);

  const handleStart = async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await api.post("/api/games/start", {
        startPage: startPage || undefined,
      });
      setGame(response.data);
      setStartPage("");
      await loadLinks(response.data.id, filter);
    } catch (err) {
      setError(err?.response?.data?.message || "Impossibile avviare la partita");
    } finally {
      setStatus("idle");
    }
  };

  const handleMove = async (pageOverride) => {
    if (!game) {
      return;
    }
    const targetPage = pageOverride;
    if (!targetPage) {
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const response = await api.post(`/api/games/${game.id}/move`, {
        nextPage: targetPage,
      });
      setGame(response.data);
      await loadLinks(response.data.id, filter);
    } catch (err) {
      setError(err?.response?.data?.message || "Mossa non valida");
    } finally {
      setStatus("idle");
    }
  };

  const handleAbandon = async () => {
    if (!game) {
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const response = await api.post(`/api/games/${game.id}/abandon`);
      setGame(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Impossibile abbandonare");
    } finally {
      setStatus("idle");
    }
  };

  const pathPreview = useMemo(() => {
    if (!game?.path?.length) {
      return "Nessun percorso";
    }
    return game.path.join(" → ");
  }, [game]);

  const filteredLinks = useMemo(() => links, [links]);

  return (
    <section className="page play">
      <div className="page-head">
        <h2>Nuova sfida</h2>
        <p>Avvia una partita e controlla ogni passaggio.</p>
      </div>

      {game?.status === "completed" && (
        <div className="notice success">
          Complimenti! Hai raggiunto Federico II in {game.clicks} click e {game.durationSeconds}s.
        </div>
      )}

      {!isAuthed && (
        <div className="notice">Devi effettuare il login per giocare.</div>
      )}

      <div className="play-grid">
        <div className="play-left">
          <article className="panel">
            <h3>Avvio partita</h3>
            <p className="muted">Lascia vuoto per partenza casuale.</p>
            <div className="stack">
              <input
                type="text"
                placeholder="Pagina di partenza"
                value={startPage}
                onChange={(event) => setStartPage(event.target.value)}
                disabled={!canStart}
              />
              <button className="btn primary" onClick={handleStart} disabled={!canStart}>
                {game?.status === "completed" ? "Avvia una nuova partita" : "Avvia"}
              </button>
            </div>
          </article>
          <article className="panel">
            <h3>Stato partita</h3>
            <p className="muted">{game ? `Status: ${game.status}` : "Nessuna partita"}</p>
            <div className="path-box">{pathPreview}</div>
            <button
              className="btn ghost"
              onClick={handleAbandon}
              disabled={!game || status === "loading"}
            >
              Abbandona
            </button>
            {error && <p className="notice error">{error}</p>}
          </article>
        </div>

        <article className="panel link-panel">
          <div className="panel-head">
            <div>
              <h3>Link disponibili</h3>
              <p className="muted">Clicca un link per avanzare.</p>
            </div>
            <input
              className="filter"
              type="text"
              placeholder="Filtra link..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              disabled={!game}
            />
          </div>
          {linksStatus === "success" && (
            <p className="muted">
              Mostrati {filteredLinks.length} su {linksMeta.filteredTotal} (totale
              pagina {linksMeta.total}).
            </p>
          )}
          {linksStatus === "loading" && <p>Caricamento link...</p>}
          {linksStatus === "error" && <p className="notice error">{linksError}</p>}
          {linksStatus === "success" && (
            <div className="link-list">
              {filteredLinks.slice(0, 200).map((link) => (
                <button
                  key={link}
                  className="link-item"
                  type="button"
                  onClick={() => handleMove(link)}
                  disabled={status === "loading"}
                >
                  {link}
                </button>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
};

export default Play;
