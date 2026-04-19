import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E5E5] bg-white mt-24" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="font-heading font-black text-2xl tracking-tighter">Job Smartr</div>
          <p className="text-sm text-[#6B7280] mt-3 max-w-sm">AI-powered career intelligence for the Indian job market. Check your ATS score, discover roles, and land the interview.</p>
        </div>
        <div>
          <div className="overline mb-3">Product</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/pricing" className="hover:text-[#0055FF]">Pricing</Link></li>
            <li><Link to="/affiliate" className="hover:text-[#0055FF]">Affiliate</Link></li>
            <li><Link to="/dashboard" className="hover:text-[#0055FF]">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <div className="overline mb-3">Account</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-[#0055FF]">Login</Link></li>
            <li><Link to="/signup" className="hover:text-[#0055FF]">Sign up</Link></li>
            <li><Link to="/reset-password" className="hover:text-[#0055FF]">Reset password</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#E5E5E5] py-5 px-6 text-center text-xs text-[#6B7280]">
        © {new Date().getFullYear()} Job Smartr — Built for the Indian job market.
      </div>
    </footer>
  );
}
