import { useEffect, useState } from "react";

import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Leaderboard = () => {
  const { isAuthed } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const podium = [
    { entry: items[1], rank: 2, tone: "silver" },
    { entry: items[0], rank: 1, tone: "gold" },
    { entry: items[2], rank: 3, tone: "bronze" },
  ].filter((slot) => slot.entry);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!isAuthed) {
        setStatus("idle");
        return;
      }

      setStatus("loading");
      try {
        const response = await api.get("/api/games/leaderboard");
        if (isMounted) {
          setItems(response.data);
          setStatus("success");
        }
      } catch {
        if (isMounted) {
          setStatus("error");
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [isAuthed]);

  return (
    <section className="page">
      <div className="page-head">
        <h2>Classifica</h2>
        <p>Classifica per numero minimo di passaggi.</p>
      </div>
      {!isAuthed && (
        <div className="notice">
          Devi effettuare il login per visualizzare la classifica.
        </div>
      )}
      {status === "success" && items.length > 0 && (
        <section className="podium-stage">
          {podium.map(({ entry, rank, tone }) => (
            <article
              key={`${entry.userId}-podium-${rank}`}
              className={`podium-card podium-rank-${rank} podium-${tone}`}
            >
              <div className="podium-medal">#{rank}</div>
              <h3 className="podium-name">{entry.username || "Utente anonimo"}</h3>
              <p className="podium-meta">Best: {entry.bestClicks} click</p>
              <span className="podium-meta">{entry.completedCount} completate</span>
              <div className="podium-stand" aria-hidden="true"></div>
            </article>
          ))}
        </section>
      )}
      <div className="cards leaderboard">
        {status === "loading" && <p>Caricamento in corso...</p>}
        {status === "error" && <p>Impossibile caricare la classifica.</p>}
        {status === "success" &&
          items.slice(3, 23).map((entry, index) => (
            <article key={`${entry.userId}-${index}`}>
              <p className="leaderboard-rank">#{index + 4}</p>
              <h3>{entry.username || "Utente anonimo"}</h3>
              <p className="stat">Best: {entry.bestClicks} click</p>
              <span className="muted">
                {entry.completedCount} completate
              </span>
            </article>
          ))}
      </div>
    </section>
  );
};

export default Leaderboard;
