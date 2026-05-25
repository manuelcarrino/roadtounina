const Rules = () => {
  return (
    <section className="page">
      <div className="page-head">
        <h2>Regole del gioco</h2>
        <p>Trasforma Wikipedia in un percorso strategico.</p>
      </div>
      <div className="cards">
        <article>
          <h3>Partenza casuale</h3>
          <p>
            Ogni partita parte da una voce casuale. Puoi impostare un punto di
            partenza se vuoi allenarti.
          </p>
        </article>
        <article>
          <h3>Solo link reali</h3>
          <p>
            Il backend verifica che la pagina scelta sia davvero linkata nella
            voce corrente.
          </p>
        </article>
        <article>
          <h3>Obiettivo fisso</h3>
          <p>
            L'obiettivo e' sempre la pagina "Universita degli Studi di Napoli
            Federico II".
          </p>
        </article>
        <article>
          <h3>Salvataggio continuo</h3>
          <p>Ogni step viene salvato: puoi riprendere ovunque.</p>
        </article>
      </div>
    </section>
  );
};

export default Rules;
