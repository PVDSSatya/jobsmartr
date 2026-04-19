import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Menu, Zap } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="w-full border-b border-[#ECEEF1] bg-white/80 backdrop-blur-md sticky top-0 z-50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="logo-link">
          <div className="w-8 h-8 bg-[#0A192F] text-white flex items-center justify-center rounded-md shadow-sm transition-transform group-hover:scale-105">
            <Zap className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-black text-xl tracking-tighter">Job Smartr</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <Link to="/pricing" className="text-sm font-medium text-[#4B5563] hover:text-[#0055FF] transition-colors" data-testid="nav-pricing">Pricing</Link>
          <Link to="/affiliate" className="text-sm font-medium text-[#4B5563] hover:text-[#0055FF] transition-colors" data-testid="nav-affiliate">Affiliate</Link>
          {user && <Link to="/dashboard" className="text-sm font-medium text-[#4B5563] hover:text-[#0055FF] transition-colors" data-testid="nav-dashboard">Dashboard</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/login" className="text-sm font-medium hidden sm:inline-block text-[#4B5563] hover:text-[#0055FF] transition-colors" data-testid="nav-login">Login</Link>
              <Button onClick={() => navigate('/signup')} className="btn-primary" data-testid="nav-signup">Get Started</Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 border border-[#ECEEF1] px-3 py-2 rounded-md hover:bg-[#F4F5F7] transition" data-testid="user-menu-trigger">
                  <div className="w-6 h-6 bg-[#0A192F] text-white flex items-center justify-center text-xs font-bold rounded-md">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{user.name?.split(' ')[0]}</span>
                  <Menu className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-md border border-[#E5E5E5]">
                <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="menu-profile">Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/affiliate/dashboard')} data-testid="menu-affiliate-dash">Affiliate</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/pricing')} data-testid="menu-pricing">Upgrade</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} data-testid="menu-logout">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
