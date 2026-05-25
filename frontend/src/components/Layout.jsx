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
          <NavLink to="/play">Play</NavLink>
          <NavLink to="/completed">Completed</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          <NavLink to="/rules">Rules</NavLink>
          <NavLink to="/account">{isAuthed ? "Account" : "Login"}</NavLink>
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">
        <div>
          <strong>ROADTOUNINA</strong> &middot; Wikipedia traversal challenge
        </div>
        <span>Backend on Express + SQLite</span>
      </footer>
    </div>
  );
};

export default Layout;
