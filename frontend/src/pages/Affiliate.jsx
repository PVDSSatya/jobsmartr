import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { ArrowRight, IndianRupee, Link as LinkIcon, BarChart3, Users } from "lucide-react";

export default function Affiliate() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="affiliate-page">
      <Navbar />
      <section className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="overline mb-3">Affiliate Program</div>
            <h1 className="font-heading font-black text-5xl lg:text-6xl tracking-tighter text-[#0A192F] leading-none">
              Earn <span className="text-[#34C759]">30%</span> recurring.<br/>Every month. Forever.
            </h1>
            <p className="text-[#6B7280] mt-6 max-w-xl">Share Job Smartr with job seekers in India and earn a 30% recurring commission on every Pro and Premium subscription — for as long as they stay subscribed.</p>
            <div className="flex gap-3 mt-8">
              <Button onClick={() => navigate('/signup')} className="btn-primary" data-testid="affiliate-start">Become an Affiliate <ArrowRight className="w-4 h-4 ml-2" /></Button>
              <Link to="/affiliate/dashboard" className="btn-outline" data-testid="affiliate-dash-link">Affiliate Dashboard</Link>
            </div>
          </div>
          <div className="lg:col-span-5 border border-[#E5E5E5] p-6 bg-[#FAFAFA]">
            <div className="overline mb-4">Example Earnings</div>
            <div className="space-y-4">
              {[
                { n: 10, plan: 'Pro', monthly: 10 * 399 * 0.30 },
                { n: 50, plan: 'Pro', monthly: 50 * 399 * 0.30 },
                { n: 100, plan: 'Premium', monthly: 100 * 999 * 0.30 },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                  <div>
                    <div className="font-heading font-bold">{r.n} {r.plan} referrals</div>
                    <div className="text-xs text-[#6B7280]">30% recurring</div>
                  </div>
                  <div className="text-right">
                    <div className="font-heading font-black text-2xl tracking-tighter text-[#34C759]">₹{Math.round(r.monthly).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-[#6B7280]">per month</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { i: LinkIcon, t: 'Get Your Link', d: 'Sign up, become an affiliate, and get a unique referral code + tracked link.' },
          { i: Users, t: 'Share It', d: 'Share it with job seekers, college groups, LinkedIn, WhatsApp — anywhere.' },
          { i: BarChart3, t: 'Track & Earn', d: 'Watch clicks, signups and commissions roll in on your affiliate dashboard.' },
        ].map((c, i) => (
          <div key={i} className="border border-[#E5E5E5] bg-white p-8">
            <c.i className="w-8 h-8 mb-4 text-[#0055FF]" strokeWidth={2} />
            <div className="font-heading font-bold text-xl tracking-tight mb-2">{c.t}</div>
            <div className="text-sm text-[#6B7280]">{c.d}</div>
          </div>
        ))}
      </section>
      <Footer />
    </div>
  );
}
