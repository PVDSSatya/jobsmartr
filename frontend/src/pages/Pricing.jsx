import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "sonner";
import { Check, Zap, Crown, Sparkles, ArrowRight } from "lucide-react";

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    tagline: 'Start your journey',
    icon: Zap,
    features: ['2 resume scans', 'ATS score & heatmap', 'Basic suggestions', 'Resume parsing'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 399,
    priceYearly: 3499,
    period: 'per month',
    tagline: 'Most popular · best value',
    icon: Sparkles,
    features: ['Unlimited scans', 'Job description match', 'AI resume optimization', 'Career insights & skill gaps', 'Salary benchmarks (₹ India)'],
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 999,
    priceYearly: 8999,
    period: 'per month',
    tagline: 'For power seekers',
    icon: Crown,
    features: ['Everything in Pro', 'Resume builder (beta)', 'Advanced insights', 'Priority AI models', 'Early feature access'],
    highlight: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [yearly, setYearly] = useState(false);

  const upgrade = async (plan) => {
    if (!user) { navigate('/signup'); return; }
    if (plan === 'free') { toast.info("You're on the Free plan by default"); return; }
    try {
      await api.post('/subscription/upgrade', { plan });
      await refresh();
      toast.success(`Upgraded to ${plan.toUpperCase()}`);
      navigate('/dashboard');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Upgrade failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="pricing-page">
      <Navbar />

      <section className="relative border-b border-[#E5E5E5] bg-white overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-60" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 text-center">
          <div className="overline mb-3">Pricing</div>
          <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl tracking-tighter text-[#0A192F] text-balance animate-fade-up">Simple. Priced for India.</h1>
          <p className="text-[#6B7280] mt-5 max-w-xl mx-auto">Start free. Upgrade when you want unlimited scans, AI optimization and deeper insights.</p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex border border-[#E5E5E5] bg-white overflow-hidden">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 text-sm font-semibold transition ${!yearly ? 'bg-[#0A192F] text-white' : 'text-[#6B7280] hover:text-[#0A192F]'}`}
              data-testid="billing-monthly"
            >Monthly</button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 text-sm font-semibold transition inline-flex items-center gap-2 ${yearly ? 'bg-[#0A192F] text-white' : 'text-[#6B7280] hover:text-[#0A192F]'}`}
              data-testid="billing-yearly"
            >Yearly <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#34C759] text-white">-25%</span></button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E5E5E5] bg-white overflow-hidden">
        {plans.map((p, i) => {
          const monthly = p.priceMonthly ?? 0;
          const yearlyTotal = p.priceYearly ?? 0;
          const displayPrice = p.id === 'free' ? '₹0' : yearly ? `₹${Math.round(yearlyTotal/12).toLocaleString('en-IN')}` : `₹${monthly}`;
          const periodText = p.id === 'free' ? 'forever' : yearly ? 'per month · billed yearly' : 'per month';
          return (
            <div
              key={p.id}
              className={`p-8 border-r last:border-r-0 border-[#E5E5E5] flex flex-col relative overflow-hidden group transition ${p.highlight ? 'bg-[#0A192F] text-white' : 'bg-white hover:bg-[#FAFAFA]'}`}
              data-testid={`plan-${p.id}`}
              style={{ animation: `fade-up 0.6s ${i * 100}ms both` }}
            >
              {p.highlight && <div className="absolute inset-0 grid-lines-dark opacity-40" />}
              {p.highlight && <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-[#0055FF]/20 blur-3xl" />}
              {p.highlight && (
                <div className="absolute top-0 right-0 bg-[#34C759] text-white text-[10px] font-bold tracking-widest px-3 py-1.5">POPULAR</div>
              )}

              <div className="relative">
                <div className="flex items-center gap-2 overline mb-3" style={{ color: p.highlight ? 'rgba(255,255,255,0.6)' : undefined }}>
                  <p.icon className="w-4 h-4" /> {p.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <div className="font-heading font-black text-6xl tracking-tighter">{displayPrice}</div>
                </div>
                <div className="text-sm mt-1" style={{ color: p.highlight ? 'rgba(255,255,255,0.6)' : '#6B7280' }}>{periodText}</div>
                <div className="text-xs mt-1.5 font-semibold" style={{ color: p.highlight ? 'rgba(255,255,255,0.75)' : '#0055FF' }}>{p.tagline}</div>

                <div className="h-px w-full my-6" style={{ background: p.highlight ? 'rgba(255,255,255,0.15)' : '#E5E5E5' }} />

                <ul className="space-y-3 flex-1 mb-8">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex gap-2.5 text-sm leading-relaxed">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#34C759' }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button onClick={() => upgrade(p.id)}
                  className={`rounded-none font-semibold w-full group/btn ${p.id === 'pro' ? 'bg-[#0055FF] hover:bg-[#0044CC] text-white' : p.highlight ? 'bg-white text-[#0A192F] hover:bg-white/90' : 'btn-secondary'}`}
                  data-testid={`select-plan-${p.id}`}>
                  {user?.plan === p.id ? 'Current Plan' : (p.id === 'free' ? 'Get Started' : `Choose ${p.name}`)}
                  <ArrowRight className="w-3 h-3 ml-2 transition-transform group-hover/btn:translate-x-1" />
                </Button>

                {p.id !== 'free' && (
                  <div className="text-[11px] mt-3 text-center" style={{ color: p.highlight ? 'rgba(255,255,255,0.5)' : '#9CA3AF' }}>
                    Mock payment · instant upgrade
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Comparison table */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="overline mb-3">Compare plans</div>
        <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter mb-8">Which plan is right for you?</h2>
        <div className="border border-[#E5E5E5] bg-white overflow-hidden">
          {[
            ['Resume scans', '2 total', 'Unlimited', 'Unlimited'],
            ['ATS score & heatmap', '✓', '✓', '✓'],
            ['Job description match', '—', '✓', '✓'],
            ['AI resume optimize', '—', '✓', '✓'],
            ['Career insights & skill gaps', 'Basic', 'Full', 'Advanced'],
            ['Salary benchmarks', '—', '✓', '✓'],
            ['Resume builder', '—', '—', '✓ Beta'],
            ['Priority AI models', '—', '—', '✓'],
          ].map((row, i) => (
            <div key={i} className={`grid grid-cols-4 ${i !== 0 ? 'border-t border-[#E5E5E5]' : ''} hover:bg-[#FAFAFA] transition`}>
              <div className="p-4 text-sm font-medium">{row[0]}</div>
              <div className="p-4 text-sm text-center border-l border-[#E5E5E5]">{row[1]}</div>
              <div className="p-4 text-sm text-center border-l border-[#E5E5E5] bg-[#0055FF]/[0.03]">{row[2]}</div>
              <div className="p-4 text-sm text-center border-l border-[#E5E5E5]">{row[3]}</div>
            </div>
          ))}
          <div className="grid grid-cols-4 border-t-2 border-[#0A192F] bg-[#FAFAFA]">
            <div className="p-3 text-xs overline">Plan</div>
            <div className="p-3 text-xs overline text-center border-l border-[#E5E5E5]">Free</div>
            <div className="p-3 text-xs overline text-center border-l border-[#E5E5E5] text-[#0055FF]">Pro</div>
            <div className="p-3 text-xs overline text-center border-l border-[#E5E5E5]">Premium</div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
