import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../App.css";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import Spinner from "../components/Spinner";


const Play = () => {
  const { isAuthed } = useAuth();
  const [game, setGame] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [startPage, setStartPage] = useState("");
  const [html, setHtml] = useState(""); // Cambiato da links a html
  const [linksStatus, setLinksStatus] = useState("idle");
  const [linksError, setLinksError] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const leftRef = useRef(null);
  const linkPanelRef = useRef(null);

  // Stack per tasto “Indietro” (conta come click sulla pagina precedente)
  const historyRef = useRef([]);


  const canStart = isAuthed && status !== "loading";

  // re-render timer while partita è in corso
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!game || game.status !== "in_progress") return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [game?.id, game?.status]);


  const loadActive = useCallback(async () => {
    if (!isAuthed) {
      return;
    }

    try {
      const response = await api.get("/api/games/me/active");
      if (response.status === 204) {
        setGame(null);
        setHtml("");
      } else {
        setGame(response.data);
      }
    } catch {
      setGame(null);
      setHtml("");
    }
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) {
      setGame(null);
      setHtml("");
      setLinksStatus("idle");
      setLinksError("");
      setError("");
      return;
    }
    loadActive();
  }, [isAuthed, loadActive]);

  const loadPageContent = useCallback(async (gameId) => {
    if (!gameId) {
      return;
    }
    setLinksStatus("loading");
    setLinksError("");
    try {
      const response = await api.get(`/api/games/${gameId}/links`);
      setHtml(response.data.html || "");
      setLinksStatus("success");
    } catch (err) {
      setLinksStatus("error");
      setLinksError(err?.response?.data?.message || "Impossibile caricare la pagina");
    }
  }, []);

  // mantiene lo storico locale per il tasto “Indietro”
  useEffect(() => {
    if (!game?.id) {
      historyRef.current = [];
      return;
    }

    if (game?.currentPage) {
      const current = game.currentPage;
      const stack = historyRef.current;
      if (stack.length === 0 || stack[stack.length - 1] !== current) {
        // quando cambia pagina, pushiamo la pagina corrente come “precedente”
        stack.push(current);
      }
    }
  }, [game?.id, game?.currentPage]);

  useEffect(() => {
    if (game?.id && game?.status !== "completed") {
      loadPageContent(game.id);
    }
  }, [game?.id, game?.status, loadPageContent]);


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
  }, [game?.status, html]);

  const handleStart = async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await api.post("/api/games/start", {
        startPage: startPage || undefined,
      });
      setGame(response.data);
      setStartPage("");
      await loadPageContent(response.data.id);
    } catch (err) {
      setError(err?.response?.data?.message || "Impossibile avviare la partita");
    } finally {
      setStatus("idle");
    }
  };

  const handleMove = async (targetPage, { skipHistoryPush = false } = {}) => {
    // blocco extra durante caricamento pagine per evitare click multipli
    if (!game || cooldown || status === "loading" || linksStatus === "loading") {
      return;
    }
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
      if (response.data.status === "completed") {
        setHtml("");
        setLinksStatus("idle");
        setLinksError("");
        return;
      }
      await loadPageContent(response.data.id);
    } catch (err) {
      setError(err?.response?.data?.message || "Mossa non valida");
    } finally {
      setStatus("idle");
      setTimeout(() => setCooldown(false), skipHistoryPush ? 600 : 400);
    }
  };


  const handleBack = async () => {
    if (!game || cooldown) {
      return;
    }

    const stack = historyRef.current;
    if (!stack.length) {
      return;
    }

    // pop della pagina precedente
    const previousPage = stack.pop();
    if (!previousPage) {
      return;
    }

    setCooldown(true);
    setStatus("loading");
    setError("");
    // Mostra la rotella subito, prima di qualsiasi await, così l'utente la vede anche se le API rispondono velocemente.
    setLinksStatus("loading");
    setLinksError("");

    try {
      await api.post(`/api/games/${game.id}/undo`);
      const updated = await api.get(`/api/games/me/active`);
      setGame(updated.data || null);
      if (updated.data?.status !== "completed") {
        setError("");
        await loadPageContent(updated.data.id);
      }


      // ricomponi la stack in modo che l'utente possa continuare a fare indietro
      // se la stack aveva [A(prev), B(current)], dopo undo deve diventare [A]
      // quindi rimuoviamo l'elemento tornato indietro (previousPage) in modo posizionale
      // e ricostruiamo aggiungendo eventuale currentPage come ultimo.
      // ricostruzione stack basata sulla struttura path sul server
      // se path sul server è [start, ..., prev, current] allora la stack locale deve essere [..., prev]
      // quindi dopo undo dobbiamo semplicemente rimuovere l'elemento appena tornato indietro (previousPage)
      // e far coincidere l'ultimo elemento della stack con la pagina corrente aggiornata.
      const updatedPath = updated.data?.path;
      if (Array.isArray(updatedPath) && updatedPath.length >= 2) {
        historyRef.current = updatedPath.slice(0, updatedPath.length - 1);
      } else {
        historyRef.current = historyRef.current.filter((p) => p !== previousPage);
      }


    } catch (err) {
      setError(err?.response?.data?.message || "Impossibile tornare indietro");
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
      await api.post(`/api/games/${game.id}/abandon`);
      setGame(null);
      setHtml("");
      setLinksStatus("idle");
      setLinksError("");
      setStartPage("");
    } catch (err) {
      setError(err?.response?.data?.message || "Impossibile abbandonare");
    } finally {
      setStatus("idle");
    }
  };

  // Intercettatore globale dei click sui link di Wikipedia
  const handleWikiClick = (event) => {
    // Trova l'elemento anchor <a> più vicino rispetto a dove si è cliccato
    const anchor = event.target.closest("a");
    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute("href");

    // Intercettiamo SOLO i link interni di Wikipedia (es: /wiki/Napoli)
    if (href && href.startsWith("/wiki/")) {
      event.preventDefault(); // Blocca il cambio pagina del browser!

      // Estrae il titolo puro eliminando il prefisso ed eventuali ancore interne (#sezione)
      const cleanHref = href.replace("/wiki/", "").split("#")[0];

      // Ignora i link di servizio/speciali (es: File:, Aiuto:, Categoria:) che contengono i due punti
      if (cleanHref.includes(":")) {
        return;
      }

      // Decodifica i caratteri URL (es: %27 in ') e sostituisce i trattini bassi con spazi
      const pageTitle = decodeURIComponent(cleanHref).replace(/_/g, " ");
      
      if (pageTitle) {
        handleMove(pageTitle);
      }
    } else {
      // Blocca anche gli altri link (esterni) per evitare che l'utente esca dal gioco per errore
      event.preventDefault();
    }
  };

  const pathPreview = useMemo(() => {
    if (!game?.path?.length) {
      return "Nessun percorso";
    }
    return game.path.join(" → ");
  }, [game]);

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
            <p className="muted">Genera una sfida casuale.</p>
            <div className="stack">
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

            {game && (
              <div style={{ display: "grid", gap: 8 }}>
                <div className="chips">
                  <span>{game.clicks} click</span>
                  <span className="timer">{Math.max(0, Math.floor(((nowMs - new Date(game.startedAt).getTime()) / 1000)))}s</span>

                </div>

                <div className="path-box">{pathPreview}</div>
              </div>
            )}

            {game?.status === "in_progress" && (
              <>
                {game?.path?.length > 1 && (
                  <button
                    className="btn ghost"
                    onClick={handleBack}
                    disabled={cooldown}
                    style={{ marginTop: 12 }}
                  >
                    Indietro
                  </button>
                )}


                <button
                  className="btn ghost"
                  onClick={handleAbandon}
                  disabled={status === "loading"}
                >
                  Abbandona
                </button>
              </>
            )}

            {error && <p className="notice error">{error}</p>}
          </article>
        </div>

        <article className="panel link-panel" ref={linkPanelRef} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-head">
            <div>
              <h3>Visualizzazione Wikipedia</h3>
              <p className="muted">Clicca direttamente sulle parole blu nel testo per navigare.</p>
            </div>
          </div>

          <div className="wiki-stage">
            {linksStatus === "loading" && (
              <div className="wiki-spinner-overlay" aria-busy="true" aria-live="polite">
                <Spinner label="Caricamento pagina di Wikipedia..." />
              </div>
            )}

            {linksStatus === "error" && (
              <p className="notice error" style={{ margin: 0, alignSelf: 'flex-start' }}>
                {linksError}
              </p>
            )}

            {linksStatus === "success" && (
              <div
                className="wiki-container"
                onClick={handleWikiClick}
                dangerouslySetInnerHTML={{ __html: html }}
                style={{
                  overflowY: "auto",
                  flex: 1,
                  paddingRight: "10px",
                  textAlign: "left",
                }}
              />
            )}
          </div>
        </article>

      </div>
    </section>
  );
};

export default Play;

