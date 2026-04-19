import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import GoogleButton from "../components/GoogleButton";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative" data-testid="login-page">
      <Navbar />
      <div className="absolute inset-0 grid-lines opacity-40 pointer-events-none" />
      <div className="relative grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Left brand side */}
        <div className="hidden lg:flex relative bg-[#0A192F] text-white p-12 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 grid-lines-dark opacity-60" />
          <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full bg-[#0055FF]/25 blur-3xl" />
          <div className="absolute bottom-10 -left-20 w-[280px] h-[280px] rounded-full bg-[#34C759]/20 blur-3xl" />

          <Link to="/" className="relative flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-[#0A192F] flex items-center justify-center">
              <Zap className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-black text-xl tracking-tighter">Job Smartr</span>
          </Link>

          <div className="relative">
            <div className="eyebrow text-white/50 mb-4">Welcome back</div>
            <h2 className="font-heading font-black text-5xl tracking-tighter leading-[0.95]">Your career intelligence, right where you left it.</h2>
            <ul className="mt-10 space-y-3">
              {['Continue where you stopped', 'Access all your past scans', 'Unlock your AI-optimized resume'].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-[#34C759]" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative text-xs text-white/40 font-mono">v2.0 · secured with JWT</div>
        </div>

        {/* Right form side */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md animate-fade-up">
            <div className="eyebrow mb-2">Login</div>
            <h1 className="font-heading font-black text-4xl tracking-tighter mb-8">Sign in to Job Smartr</h1>
            <form onSubmit={onSubmit} className="border border-[#ECEEF1] bg-white rounded-md p-8 space-y-5">
              <GoogleButton testid="login-google-btn" />
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#ECEEF1]" />
                <span className="eyebrow text-[10px]">or</span>
                <div className="flex-1 h-px bg-[#ECEEF1]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="eyebrow">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="rounded-md border-[#E5E5E5] focus-visible:ring-[#0055FF]" data-testid="login-email" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="eyebrow">Password</Label>
                  <Link to="/reset-password" className="text-xs text-[#0055FF] hover:underline" data-testid="login-forgot">Forgot?</Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="rounded-md border-[#E5E5E5] focus-visible:ring-[#0055FF]" data-testid="login-password" />
              </div>
              <Button type="submit" disabled={loading} className="btn-primary w-full group" data-testid="login-submit">
                {loading ? "Signing in…" : (<>Sign in <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" /></>)}
              </Button>
              <div className="text-sm text-center text-[#6B7280]">No account? <Link to="/signup" className="text-[#0055FF] hover:underline" data-testid="login-to-signup">Create one</Link></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
