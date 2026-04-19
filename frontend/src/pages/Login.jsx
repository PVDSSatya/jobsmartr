import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import Navbar from "../components/Navbar";

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="login-page">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="overline mb-3">Welcome back</div>
        <h1 className="font-heading font-black text-4xl tracking-tighter mb-8">Login to Job Smartr</h1>
        <form onSubmit={onSubmit} className="border border-[#E5E5E5] bg-white p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="overline">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="rounded-none border-[#E5E5E5]" data-testid="login-email" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="overline">Password</Label>
              <Link to="/reset-password" className="text-xs text-[#0055FF] hover:underline" data-testid="login-forgot">Forgot?</Link>
            </div>
            <Input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="rounded-none border-[#E5E5E5]" data-testid="login-password" />
          </div>
          <Button type="submit" disabled={loading} className="btn-primary w-full" data-testid="login-submit">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <div className="text-sm text-center text-[#6B7280]">No account? <Link to="/signup" className="text-[#0055FF] hover:underline" data-testid="login-to-signup">Create one</Link></div>
        </form>
      </div>
    </div>
  );
}
