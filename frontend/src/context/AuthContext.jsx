import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem("admin");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (admin) {
      localStorage.setItem("admin", JSON.stringify(admin));
    } else {
      localStorage.removeItem("admin");
    }
  }, [admin]);

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/login", { email, password });
      setToken(data.token);
      setAdmin(data.admin);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please try again.";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setAdmin(null);
  }

  const value = {
    admin,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
