import { useEffect, useState } from "react";

import { api } from "../services/api";

const TrophyIcon = () => (
  <svg
    className="trophy-icon"
    viewBox="0 0 64 64"
    role="img"
    aria-hidden="true"
  >
    <path
      d="M18 10h28v6h8c0 11.2-6 19.3-16 21.6A14.1 14.1 0 0 1 34 44.6V48h8v6H22v-6h8v-3.4A14.1 14.1 0 0 1 26 37.6C16 35.3 10 27.2 10 16h8v-6zm-2 12c1.1 6.3 4.8 10.5 10.2 11.7A14.1 14.1 0 0 1 22.5 22H16zm32 0a14.1 14.1 0 0 1-3.7 11.7C49.7 32.5 53 28.3 54 22h-6zM24 16v8.8a8 8 0 0 0 16 0V16H24z"
      fill="currentColor"
    />
  </svg>
);

const Leaderboard = () => {
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
  }, []);

  return (
    <section className="page">
      <div className="page-head">
        <h2>Classifica</h2>
        <p>Classifica per numero minimo di passaggi.</p>
      </div>
      {status === "success" && items.length > 0 && (
        <section className="podium-stage">
          {podium.map(({ entry, rank, tone }) => (
            <article
              key={`${entry.userId}-podium-${rank}`}
              className={`podium-card podium-rank-${rank} podium-${tone}`}
            >
              <div className={`podium-trophy ${tone}`}>
                <TrophyIcon />
              </div>
              <div className="podium-medal">#{rank}</div>
              <h3 className="podium-name">{entry.username || "Utente anonimo"}</h3>
              <p className="podium-meta">Best: {entry.bestClicks} click</p>
              <span className="podium-meta">{entry.completedCount} completate</span>
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
