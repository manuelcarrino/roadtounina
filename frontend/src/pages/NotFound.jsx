import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <section className="page">
      <div className="page-head">
        <h2>Pagina non trovata</h2>
        <p>Il percorso non esiste. Torna alla home.</p>
      </div>
      <Link className="btn primary" to="/">
        Torna alla home
      </Link>
    </section>
  );
};

export default NotFound;
