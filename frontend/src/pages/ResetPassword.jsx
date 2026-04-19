import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import api from "../lib/api";
import Navbar from "../components/Navbar";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, new_password: newPassword });
      setDone(true);
      toast.success("Password reset. Please login.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Request failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="reset-page">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="eyebrow mb-3">Forgot password?</div>
        <h1 className="font-heading font-black text-4xl tracking-tighter mb-8">Reset your password</h1>
        {done ? (
          <div className="border border-[#E5E5E5] bg-white p-8 space-y-4">
            <p className="text-sm">If the account exists, the password has been updated.</p>
            <Link to="/login" className="btn-primary inline-block" data-testid="reset-to-login">Go to Login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="border border-[#E5E5E5] bg-white p-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="eyebrow">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="rounded-md border-[#E5E5E5]" data-testid="reset-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np" className="eyebrow">New password</Label>
              <Input id="np" type="password" required minLength={6} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="rounded-md border-[#E5E5E5]" data-testid="reset-newpass" />
            </div>
            <Button type="submit" disabled={loading} className="btn-primary w-full" data-testid="reset-submit">
              {loading ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
