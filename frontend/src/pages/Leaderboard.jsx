import { useEffect, useState } from "react";

import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Leaderboard = () => {
  const { isAuthed } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");

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
      } catch (error) {
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
        <section className="podium">
          {items.slice(0, 3).map((entry, index) => (
            <article key={`${entry.userId}-podium-${index}`} className={`podium-card rank-${index + 1}`}>
              <p className="podium-rank">#{index + 1}</p>
              <h3>{entry.username || "Utente anonimo"}</h3>
              <p className="muted">Best: {entry.bestClicks} click</p>
              <span className="muted">{entry.completedCount} completate</span>
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
              <h3>#{index + 4}</h3>
              <p className="muted">{entry.username || "Utente anonimo"}</p>
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
