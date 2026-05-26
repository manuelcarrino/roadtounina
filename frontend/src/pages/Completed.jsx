import { useEffect, useState } from "react";

import { api } from "../services/api";

const Completed = () => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await api.get("/api/games/completed");
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
  }, []);

  return (
    <section className="page">
      <div className="page-head">
        <h2>Partite concluse</h2>
        <p>Esplora i percorsi completati dalla community.</p>
      </div>
      <div className="cards completed-grid">
        {status === "loading" && <p>Caricamento in corso...</p>}
        {status === "error" && <p>Impossibile caricare le partite.</p>}
        {status === "success" &&
          items.map((game) => (
            <article key={`${game.startPage}-${game.endedAt}`} className="completed-card">
              <h3>{game.startPage}</h3>
              <div className="chips">
                <span>{game.User?.username || "Utente anonimo"}</span>
              </div>
              <p className="muted">
                {game.clicks} click &middot; {game.durationSeconds}s
              </p>
              <p className="path">{game.path?.join(" → ")}</p>
            </article>
          ))}
      </div>
    </section>
  );
};

export default Completed;
