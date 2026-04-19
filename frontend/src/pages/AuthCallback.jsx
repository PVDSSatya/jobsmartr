import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    const session_id = match ? decodeURIComponent(match[1]) : null;
    const referral_code = sessionStorage.getItem("js_ref_code") || null;

    if (!session_id) {
      setError("Missing session. Please try signing in again.");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    (async () => {
      try {
        const r = await api.post("/auth/session", { session_id, referral_code });
        sessionStorage.removeItem("js_ref_code");
        // Clear URL hash so Emergent session_id is not leaked
        window.history.replaceState({}, document.title, window.location.pathname);
        setAuthenticatedUser(r.data.user);
        navigate("/dashboard", { replace: true });
      } catch (e) {
        setError(e?.response?.data?.detail || "Google sign-in failed. Please try again.");
        setTimeout(() => navigate("/login"), 1800);
      }
    })();
  }, [navigate, setAuthenticatedUser]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6" data-testid="auth-callback">
      <div className="max-w-md w-full border border-[#ECEEF1] bg-white rounded-md p-8 text-center">
        {error ? (
          <>
            <div className="eyebrow text-[#FF3B30] mb-3">Authentication failed</div>
            <div className="font-heading font-bold text-xl tracking-tight">{error}</div>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#0055FF]" />
            <div className="eyebrow mb-2">Signing you in</div>
            <div className="font-heading font-bold text-xl tracking-tight">Finishing Google authentication…</div>
          </>
        )}
      </div>
    </div>
  );
}
