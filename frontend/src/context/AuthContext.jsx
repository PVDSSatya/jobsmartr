import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync Supabase user with backend profile and database
  const syncSupabaseUser = async (token) => {
    try {
      const refCode = sessionStorage.getItem("js_ref_code") || null;
      const r = await api.post(
        "/auth/supabase-sync",
        { referral_code: refCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (refCode) {
        sessionStorage.removeItem("js_ref_code");
      }
      setUser(r.data.user);
      return r.data.user;
    } catch {
      // Fallback: fetch user info via /auth/me
      try {
        const r = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(r.data);
        return r.data;
      } catch {
        return null;
      }
    }
  };

  useEffect(() => {
    let authListener = null;

    if (isSupabaseConfigured() && supabase) {
      // 1) Initialize from current Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          localStorage.setItem("js_token", session.access_token);
          syncSupabaseUser(session.access_token).finally(() => setLoading(false));
        } else {
          // If no active Supabase session, check local token
          const token = localStorage.getItem("js_token");
          if (token) {
            api.get("/auth/me")
              .then((r) => setUser(r.data))
              .catch(() => { localStorage.removeItem("js_token"); })
              .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        }
      });

      // 2) Listen to Supabase auth events (OAuth redirect, sign in, sign out)
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.access_token && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          localStorage.setItem("js_token", session.access_token);
          await syncSupabaseUser(session.access_token);
        } else if (event === "SIGNED_OUT") {
          localStorage.removeItem("js_token");
          setUser(null);
        }
      });
      authListener = data?.subscription;
    } else {
      // Fallback if Supabase credentials are not set yet
      api.get("/auth/me")
        .then((r) => setUser(r.data))
        .catch(() => { localStorage.removeItem("js_token"); })
        .finally(() => setLoading(false));
    }

    return () => {
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data?.session?.access_token) {
        localStorage.setItem("js_token", data.session.access_token);
        const syncedUser = await syncSupabaseUser(data.session.access_token);
        return syncedUser || data.user;
      }
      return data.user;
    } else {
      const r = await api.post("/auth/login", { email, password });
      localStorage.setItem("js_token", r.data.token);
      setUser(r.data.user);
      return r.data.user;
    }
  };

  const signup = async (name, email, password, referral_code) => {
    if (referral_code) {
      try { sessionStorage.setItem("js_ref_code", referral_code); } catch { /* noop */ }
    }

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, full_name: name },
        },
      });
      if (error) throw error;
      if (data?.session?.access_token) {
        localStorage.setItem("js_token", data.session.access_token);
        const syncedUser = await syncSupabaseUser(data.session.access_token);
        return syncedUser || data.user;
      }
      return data.user;
    } else {
      const r = await api.post("/auth/signup", { name, email, password, referral_code });
      localStorage.setItem("js_token", r.data.token);
      setUser(r.data.user);
      return r.data.user;
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      try { await supabase.auth.signOut(); } catch { /* noop */ }
    }
    try { await api.post("/auth/logout"); } catch { /* noop */ }
    localStorage.removeItem("js_token");
    setUser(null);
  };

  const refresh = async () => {
    try {
      const r = await api.get("/auth/me");
      setUser(r.data);
    } catch {
      /* noop */
    }
  };

  const setAuthenticatedUser = (u) => setUser(u);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        refresh,
        setAuthenticatedUser,
        isSupabase: isSupabaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
