import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { ArrowRight, CheckCircle2, Zap, Sparkles } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      setReferral(ref);
      api.post("/affiliate/track", { code: ref, event: "click" }).catch(()=>{});
    }
  }, [params]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(name, email, password, referral || null);
      toast.success("Account created. Let's analyze your resume!");
      navigate("/upload");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative" data-testid="signup-page">
      <Navbar />
      <div className="relative grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Left form */}
        <div className="flex items-center justify-center p-6 sm:p-12 order-2 lg:order-1">
          <div className="w-full max-w-md animate-fade-up">
            <div className="eyebrow mb-2">Start free</div>
            <h1 className="font-heading font-black text-4xl tracking-tighter mb-2">Create your account</h1>
            <p className="text-sm text-[#6B7280] mb-6">2 free scans. No card needed.</p>
            <form onSubmit={onSubmit} className="border border-[#E5E5E5] bg-white p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="eyebrow">Full name</Label>
                <Input id="name" required value={name} onChange={(e)=>setName(e.target.value)} className="rounded-md border-[#E5E5E5] focus-visible:ring-[#0055FF]" data-testid="signup-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="eyebrow">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="rounded-md border-[#E5E5E5] focus-visible:ring-[#0055FF]" data-testid="signup-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="eyebrow">Password</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} className="rounded-md border-[#E5E5E5] focus-visible:ring-[#0055FF]" data-testid="signup-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref" className="eyebrow">Referral code (optional)</Label>
                <Input id="ref" value={referral} onChange={(e)=>setReferral(e.target.value)} className="rounded-md border-[#E5E5E5] font-mono focus-visible:ring-[#0055FF]" data-testid="signup-ref" />
              </div>
              <Button type="submit" disabled={loading} className="btn-primary w-full group" data-testid="signup-submit">
                {loading ? "Creating…" : (<>Create account <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" /></>)}
              </Button>
              <div className="text-sm text-center text-[#6B7280]">Already registered? <Link to="/login" className="text-[#0055FF] hover:underline" data-testid="signup-to-login">Login</Link></div>
            </form>
          </div>
        </div>

        {/* Right brand */}
        <div className="hidden lg:flex relative bg-[#0A192F] text-white p-12 flex-col justify-between overflow-hidden order-1 lg:order-2">
          <div className="absolute inset-0 grid-lines-dark opacity-60" />
          <div className="absolute -bottom-40 -right-40 w-[420px] h-[420px] rounded-full bg-[#34C759]/25 blur-3xl" />
          <div className="absolute top-10 -left-20 w-[280px] h-[280px] rounded-full bg-[#0055FF]/25 blur-3xl" />

          <Link to="/" className="relative flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-[#0A192F] flex items-center justify-center">
              <Zap className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-black text-xl tracking-tighter">Job Smartr</span>
          </Link>

          <div className="relative">
            <div className="eyebrow text-white/50 mb-4">Get hired smarter</div>
            <h2 className="font-heading font-black text-5xl tracking-tighter leading-[0.95]">One upload. A full career map.</h2>
            <div className="mt-10 border border-white/10 p-5 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-2 eyebrow text-white/60 mb-3"><Sparkles className="w-4 h-4" /> What you'll see</div>
              <ul className="space-y-2.5 text-sm">
                {['ATS score with 5-way breakdown', 'Color-coded resume heatmap', 'Recommended jobs with ₹ LPA', 'Interview probability %', 'Skill gaps that unlock higher salary'].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-white/85"><CheckCircle2 className="w-4 h-4 text-[#34C759] flex-shrink-0" /> {t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative text-xs text-white/40 font-mono">Powered by Claude Sonnet 4.5</div>
        </div>
      </div>
    </div>
  );
}
