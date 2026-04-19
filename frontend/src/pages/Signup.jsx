import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import api from "../lib/api";

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
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="signup-page">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="overline mb-3">Get hired smarter</div>
        <h1 className="font-heading font-black text-4xl tracking-tighter mb-8">Create your account</h1>
        <form onSubmit={onSubmit} className="border border-[#E5E5E5] bg-white p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="overline">Full name</Label>
            <Input id="name" required value={name} onChange={(e)=>setName(e.target.value)} className="rounded-none border-[#E5E5E5]" data-testid="signup-name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="overline">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="rounded-none border-[#E5E5E5]" data-testid="signup-email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="overline">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} className="rounded-none border-[#E5E5E5]" data-testid="signup-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref" className="overline">Referral code (optional)</Label>
            <Input id="ref" value={referral} onChange={(e)=>setReferral(e.target.value)} className="rounded-none border-[#E5E5E5]" data-testid="signup-ref" />
          </div>
          <Button type="submit" disabled={loading} className="btn-primary w-full" data-testid="signup-submit">
            {loading ? "Creating…" : "Create account"}
          </Button>
          <div className="text-sm text-center text-[#6B7280]">Already have an account? <Link to="/login" className="text-[#0055FF] hover:underline" data-testid="signup-to-login">Login</Link></div>
        </form>
      </div>
    </div>
  );
}
