import { Link } from "react-router-dom";

const Home = () => {
  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <p className="eyebrow">ROADTOUNINA</p>
        <h1>
          Una corsa a colpi di link fino a
          <span> Federico II</span>
        </h1>
        <p className="lede">
          Parti da una voce casuale su Wikipedia e raggiungi l'Universita
          degli Studi di Napoli Federico II nel minor numero di passaggi. Ogni
          click e' tracciato. Ogni partita vive nel tuo account.
        </p>
        <div className="cta-row">
          <Link className="btn primary" to="/play">
            Avvia una sfida
          </Link>
          <Link className="btn ghost" to="/rules">
            Come funziona
          </Link>
        </div>
        <div className="hero-stats">
          <div>
            <p className="stat">Persistente</p>
            <span>Riprendi la partita su ogni device.</span>
          </div>
          <div>
            <p className="stat">Live</p>
            <span>Leaderboard aggiornata in tempo reale.</span>
          </div>
          <div>
            <p className="stat">Verificato</p>
            <span>Solo link reali dalla pagina corrente.</span>
          </div>
        </div>
      </div>
      <div className="hero-card">
        <div className="route-map">
          <div className="route-line"></div>
          <div className="route-node start">
            <span className="dot"></span>
            <div>
              <p className="label">Start</p>
              <span className="meta">Voce casuale</span>
            </div>
          </div>
          <div className="route-node mid">
            <span className="dot"></span>
            <div>
              <p className="label">Link</p>
              <span className="meta">Solo collegamenti reali</span>
            </div>
          </div>
          <div className="route-node end">
            <span className="dot"></span>
            <div>
              <p className="label">Unina</p>
              <span className="meta">Obiettivo finale</span>
            </div>
          </div>
        </div>
        <div className="hero-card-content">
          <h3>Obiettivo</h3>
          <p>
            Raggiungi la pagina dedicata a Federico II passando solo dai link
            visibili nella voce corrente.
          </p>
          <ul>
            <li>Durata e percorso salvati.</li>
            <li>Solo namespace principale.</li>
            <li>Modalita' competitiva.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Home;
