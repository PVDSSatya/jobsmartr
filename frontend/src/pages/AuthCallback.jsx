import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        if (isSupabaseConfigured() && supabase) {
          const { data, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr) throw sessionErr;
          if (data?.session) {
            navigate("/dashboard", { replace: true });
            return;
          }
        }
        // If no session found in callback, redirect to login
        navigate("/dashboard", { replace: true });
      } catch (e) {
        setError(e?.message || "Authentication failed. Please try again.");
        setTimeout(() => navigate("/login"), 1800);
      }
    };

    handleCallback();
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
            <div className="font-heading font-bold text-xl tracking-tight">Finishing authentication…</div>
          </>
        )}
      </div>
    </div>
  );
}
