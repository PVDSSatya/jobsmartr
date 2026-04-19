import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "sonner";
import { Check, Zap, Crown, Sparkles } from "lucide-react";

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    icon: Zap,
    features: ['2 resume scans', 'ATS score & heatmap', 'Basic suggestions', 'Resume parsing'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹399',
    period: 'per month',
    icon: Sparkles,
    features: ['Unlimited scans', 'Job description match', 'AI resume optimization', 'Career insights & skill gaps', 'Salary benchmarks (₹ India)'],
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹999',
    period: 'per month',
    icon: Crown,
    features: ['Everything in Pro', 'Resume builder (beta)', 'Advanced insights', 'Priority AI models', 'Early feature access'],
    highlight: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();

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
      <section className="border-b border-[#E5E5E5] bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 text-center">
          <div className="overline mb-3">Pricing</div>
          <h1 className="font-heading font-black text-5xl lg:text-6xl tracking-tighter text-[#0A192F]">Simple. Priced for India.</h1>
          <p className="text-[#6B7280] mt-5 max-w-xl mx-auto">Start free. Upgrade when you want unlimited scans, AI optimization and deeper insights.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E5E5E5] bg-white">
        {plans.map((p) => (
          <div key={p.id} className={`p-8 border-r last:border-r-0 border-[#E5E5E5] flex flex-col ${p.highlight ? 'bg-[#0A192F] text-white' : ''}`} data-testid={`plan-${p.id}`}>
            <div className="flex items-center gap-2 overline mb-3" style={{ color: p.highlight ? 'rgba(255,255,255,0.6)' : undefined }}>
              <p.icon className="w-4 h-4" /> {p.name}
            </div>
            <div className="font-heading font-black text-5xl tracking-tighter">{p.price}</div>
            <div className="text-sm mt-1" style={{ color: p.highlight ? 'rgba(255,255,255,0.6)' : '#6B7280' }}>{p.period}</div>
            <ul className="mt-6 space-y-3 flex-1">
              {p.features.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: p.highlight ? '#34C759' : '#34C759' }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => upgrade(p.id)}
              className={`mt-8 rounded-none font-semibold ${p.id === 'pro' ? 'bg-[#0055FF] hover:bg-[#0044CC] text-white' : p.highlight ? 'bg-white text-[#0A192F] hover:bg-white/90' : 'btn-secondary'}`}
              data-testid={`select-plan-${p.id}`}>
              {user?.plan === p.id ? 'Current Plan' : (p.id === 'free' ? 'Get Started' : `Choose ${p.name}`)}
            </Button>
            {p.id !== 'free' && (
              <div className="text-[11px] mt-3" style={{ color: p.highlight ? 'rgba(255,255,255,0.5)' : '#9CA3AF' }}>Mock payment · instant upgrade for demo</div>
            )}
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
