import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Vault from "./components/Vault";
import Settings from "./components/Settings";
import { api } from "./lib/api";
import "./App.css";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthenticated(api.isAuthenticated());
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate("/vault");
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/vault" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/vault" replace />
            ) : (
              <Register onRegisterSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/vault"
          element={
            isAuthenticated ? (
              <Vault onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <Settings onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/vault" : "/login"} replace />
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
