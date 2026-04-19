import React from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function Profile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="profile-page">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="eyebrow mb-2">Account</div>
        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter mb-8">Your profile</h1>

        <div className="border border-[#E5E5E5] bg-white divide-y divide-[#E5E5E5]">
          <Row label="Name" value={user.name} testid="profile-name" />
          <Row label="Email" value={user.email} testid="profile-email" />
          <Row label="Plan" value={user.plan?.toUpperCase() || 'FREE'} testid="profile-plan" />
          <Row label="Scans Used" value={user.scans_used} testid="profile-scans" />
          <Row label="Member Since" value={new Date(user.created_at).toLocaleDateString()} testid="profile-since" />
        </div>

        <div className="mt-6 flex gap-3">
          <Link to="/pricing"><Button className="btn-primary" data-testid="profile-upgrade">Manage Plan</Button></Link>
          <Button onClick={logout} className="btn-outline" data-testid="profile-logout">Logout</Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, testid }) {
  return (
    <div className="flex items-center justify-between p-5" data-testid={testid}>
      <span className="eyebrow">{label}</span>
      <span className="font-heading font-bold tracking-tight">{value}</span>
    </div>
  );
}
