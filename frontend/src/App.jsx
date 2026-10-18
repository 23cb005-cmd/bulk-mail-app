import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import DemoBanner from "./components/DemoBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import SendMail from "./pages/SendMail";
import History from "./pages/History";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <DemoBanner />
      <main className="app-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SendMail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
