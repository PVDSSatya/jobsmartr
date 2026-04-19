import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL: If returning from Emergent OAuth callback, skip the /me check.
    // AuthCallback will exchange session_id and establish the session first.
    if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => { localStorage.removeItem("js_token"); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("js_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const signup = async (name, email, password, referral_code) => {
    const r = await api.post("/auth/signup", { name, email, password, referral_code });
    localStorage.setItem("js_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch { /* noop */ }
    localStorage.removeItem("js_token");
    setUser(null);
  };

  const refresh = async () => {
    try { const r = await api.get("/auth/me"); setUser(r.data); } catch { /* noop */ }
  };

  // Used by AuthCallback to set user after OAuth session exchange
  const setAuthenticatedUser = (u) => setUser(u);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh, setAuthenticatedUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
