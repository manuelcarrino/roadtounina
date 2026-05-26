const Rules = () => {
  return (
    <section className="page">
      <div className="page-head">
        <h2>Regole del gioco</h2>
        <p>Trasforma Wikipedia in un percorso strategico.</p>
      </div>
      <div className="rules-hero">
        <div>
          <p className="eyebrow">Guida rapida</p>
          <h3>Regole chiare, partita veloce</h3>
          <p className="muted">
            Punta al bersaglio in meno click possibili e fai salire il tuo profilo.
          </p>
        </div>
        <div className="rules-tags">
          <span>Target: Federico II</span>
          <span>Obiettivo: click minimi</span>
          <span>Modalita': tempo reale</span>
        </div>
      </div>
      <div className="cards rules-grid">
        <article className="rule-card">
          <div className="rule-head">
            <span className="rule-index">01</span>
            <h3>Partenza casuale</h3>
          </div>
          <p>
            Ogni partita parte da una voce casuale. Puoi impostare un punto di
            partenza se vuoi allenarti.
          </p>
        </article>
        <article className="rule-card">
          <div className="rule-head">
            <span className="rule-index">02</span>
            <h3>Solo link reali</h3>
          </div>
          <p>
            Il backend verifica che la pagina scelta sia davvero linkata nella
            voce corrente.
          </p>
        </article>
        <article className="rule-card">
          <div className="rule-head">
            <span className="rule-index">03</span>
            <h3>Obiettivo fisso</h3>
          </div>
          <p>
            L'obiettivo e' sempre la pagina "Universita degli Studi di Napoli
            Federico II".
          </p>
        </article>
        <article className="rule-card">
          <div className="rule-head">
            <span className="rule-index">04</span>
            <h3>Salvataggio continuo</h3>
          </div>
          <p>Ogni step viene salvato: puoi riprendere ovunque.</p>
        </article>
        <article className="rule-card">
          <div className="rule-head">
            <span className="rule-index">05</span>
            <h3>Velocita' e strategia</h3>
          </div>
          <p>Riduci i click e ottimizza i passaggi per salire in classifica.</p>
        </article>
        <article className="rule-card">
          <div className="rule-head">
            <span className="rule-index">06</span>
            <h3>Sessione pulita</h3>
          </div>
          <p>Ogni partita ha uno storico chiaro: niente passaggi fantasma.</p>
        </article>
      </div>
    </section>
  );
};

export default Rules;
