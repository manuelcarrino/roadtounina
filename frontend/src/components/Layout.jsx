import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

const Layout = () => {
  const { isAuthed } = useAuth();

  return (
    <div className="app-shell">
      <header className="nav-shell">
        <div className="brand">
          <span className="brand-mark">RTU</span>
          <div>
            <p className="brand-title">Road To Unina</p>
            <p className="brand-tag">Wikipedia Race | Napoli</p>
          </div>
        </div>
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/play">Gioca</NavLink>
          <NavLink to="/completed">Completati</NavLink>
          <NavLink to="/leaderboard">Classifica</NavLink>
          <NavLink to="/rules">Regole</NavLink>
          <NavLink to="/account">{isAuthed ? "Account" : "Accedi"}</NavLink>
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">
        <div>
          <strong>ROADTOUNINA</strong> &middot; Sfida di navigazione Wikipedia
        </div>
      </footer>
    </div>
  );
};

export default Layout;
