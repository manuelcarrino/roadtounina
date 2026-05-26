import { useEffect, useMemo, useRef, useState } from "react";

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
  const [cooldown, setCooldown] = useState(false);
  const leftRef = useRef(null);
  const linkPanelRef = useRef(null);

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
    if (!isAuthed) {
      setGame(null);
      setLinks([]);
      setLinksMeta({ total: 0, filteredTotal: 0 });
      setLinksStatus("idle");
      setLinksError("");
      setError("");
      setFilter("");
      return;
    }
    loadActive();
  }, [isAuthed]);

  const loadLinks = async (gameId) => {
    if (!gameId) {
      return;
    }
    setLinksStatus("loading");
    setLinksError("");
    try {
      const response = await api.get(`/api/games/${gameId}/links`, {
        params: { limit: 400 },
      });
      setLinks(response.data.links || []);
      setLinksMeta({
        total: response.data.total || 0,
        filteredTotal: response.data.total || 0,
      });
      setLinksStatus("success");
    } catch (err) {
      setLinksStatus("error");
      setLinksError(err?.response?.data?.message || "Impossibile caricare i link");
    }
  };

  useEffect(() => {
    if (game?.id && game?.status !== "completed") {
      loadLinks(game.id);
    }
  }, [game?.id]);

  useEffect(() => {
    const updatePanelHeight = () => {
      if (!leftRef.current || !linkPanelRef.current) {
        return;
      }
      const leftHeight = leftRef.current.getBoundingClientRect().height;
      linkPanelRef.current.style.maxHeight = `${leftHeight}px`;
    };

    updatePanelHeight();
    window.addEventListener("resize", updatePanelHeight);
    return () => {
      window.removeEventListener("resize", updatePanelHeight);
    };
  }, [game?.status, links.length]);

  const handleStart = async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await api.post("/api/games/start", {
        startPage: startPage || undefined,
      });
      setGame(response.data);
      setStartPage("");
      setFilter("");
      await loadLinks(response.data.id);
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
    if (cooldown) {
      return;
    }
    const targetPage = pageOverride;
    if (!targetPage) {
      return;
    }
    setCooldown(true);
    setStatus("loading");
    setError("");
    try {
      const response = await api.post(`/api/games/${game.id}/move`, {
        nextPage: targetPage,
      });
      setGame(response.data);
      setFilter("");
      if (response.data.status === "completed") {
        setLinks([]);
        setLinksMeta({ total: 0, filteredTotal: 0 });
        setLinksStatus("idle");
        setLinksError("");
        return;
      }
      await loadLinks(response.data.id);
    } catch (err) {
      setError(err?.response?.data?.message || "Mossa non valida");
    } finally {
      setStatus("idle");
      setTimeout(() => setCooldown(false), 400);
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

  const filteredLinks = useMemo(() => {
    if (!filter.trim()) {
      return links;
    }
    const q = filter.trim().toLowerCase();
    return links.filter((link) => link.toLowerCase().includes(q));
  }, [filter, links]);

  const statusLabel = (value) => {
    switch (value) {
      case "in_progress":
        return "In corso";
      case "completed":
        return "Completata";
      case "failed":
        return "Abbandonata";
      default:
        return value || "-";
    }
  };

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
        <div className="play-left" ref={leftRef}>
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
            <p className="muted">
              {game ? `Stato: ${statusLabel(game.status)}` : "Nessuna partita"}
            </p>
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

        <article className="panel link-panel" ref={linkPanelRef}>
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
