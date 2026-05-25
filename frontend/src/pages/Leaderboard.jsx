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
        <h2>Leaderboard</h2>
        <p>Classifica per numero minimo di passaggi.</p>
      </div>
      {!isAuthed && (
        <div className="notice">
          Devi effettuare il login per visualizzare la classifica.
        </div>
      )}
      <div className="cards leaderboard">
        {status === "loading" && <p>Caricamento in corso...</p>}
        {status === "error" && <p>Impossibile caricare la classifica.</p>}
        {status === "success" &&
          items.map((entry, index) => (
            <article key={`${entry.userId}-${index}`}>
              <h3>#{index + 1}</h3>
              <p className="muted">{entry.email || "Utente anonimo"}</p>
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
