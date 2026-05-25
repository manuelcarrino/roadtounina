import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import Play from "./pages/Play";
import Completed from "./pages/Completed";
import Leaderboard from "./pages/Leaderboard";
import Rules from "./pages/Rules";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import "./App.css";

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="play" element={<Play />} />
        <Route path="completed" element={<Completed />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="rules" element={<Rules />} />
        <Route path="account" element={<Account />} />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
