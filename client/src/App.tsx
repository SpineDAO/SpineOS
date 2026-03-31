import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import PatientPWA from "./pages/PatientPWA";
import PhysicianPortal from "./pages/PhysicianPortal";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("aira_token"));

  const handleLogin = (jwt: string) => {
    localStorage.setItem("aira_token", jwt);
    setToken(jwt);
  };

  const handleLogout = () => {
    localStorage.removeItem("aira_token");
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/portal" /> : <Login onLogin={handleLogin} />} />
        <Route path="/intake/*" element={<PatientPWA />} />
        <Route path="/portal" element={token ? <PhysicianPortal /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
