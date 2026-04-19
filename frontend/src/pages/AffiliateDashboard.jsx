import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Copy, IndianRupee, MousePointerClick, UserCheck } from "lucide-react";

export default function AffiliateDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/affiliate/dashboard");
      setData(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const become = async () => {
    try { await api.post("/affiliate/become"); toast.success("Welcome to the affiliate program"); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const refLink = (code) => `${window.location.origin}/signup?ref=${code}`;

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="affiliate-dashboard-page">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="eyebrow mb-2">Affiliate Dashboard</div>
        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter mb-8">Your referral performance</h1>

        {loading && <div className="eyebrow">Loading…</div>}

        {!loading && !data?.affiliate && (
          <div className="border border-[#E5E5E5] bg-white p-8">
            <h2 className="font-heading font-bold text-2xl mb-3">Become an affiliate</h2>
            <p className="text-sm text-[#6B7280] mb-5">Activate your unique referral code and earn 30% recurring on every Pro/Premium signup.</p>
            <Button onClick={become} className="btn-primary" data-testid="become-affiliate-btn">Activate Affiliate Account</Button>
          </div>
        )}

        {!loading && data?.affiliate && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-[#E5E5E5] bg-white mb-8">
              <Cell icon={MousePointerClick} label="Clicks" value={data.affiliate.clicks} testid="aff-clicks" />
              <Cell icon={UserCheck} label="Signups" value={data.affiliate.signups} testid="aff-signups" />
              <Cell icon={IndianRupee} label="Earnings" value={`₹${Math.round(data.affiliate.earnings_inr).toLocaleString('en-IN')}`} testid="aff-earnings" />
              <Cell label="Code" value={data.affiliate.code} mono testid="aff-code" />
            </div>

            <div className="border border-[#E5E5E5] bg-white p-6 mb-8">
              <div className="eyebrow mb-3">Your referral link</div>
              <div className="flex items-center gap-3 border border-[#E5E5E5] bg-[#FAFAFA] p-3 font-mono text-sm break-all">
                <span className="flex-1" data-testid="aff-ref-link">{refLink(data.affiliate.code)}</span>
                <Button onClick={() => copy(refLink(data.affiliate.code))} className="btn-secondary text-xs py-2" data-testid="copy-ref-link"><Copy className="w-3 h-3 mr-1" /> Copy</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-[#E5E5E5] bg-white">
                <div className="p-5 border-b border-[#E5E5E5] eyebrow">Referrals ({data.referrals.length})</div>
                <ul className="divide-y divide-[#E5E5E5]">
                  {data.referrals.slice(0, 20).map((r, i) => (
                    <li key={i} className="p-4 flex items-center justify-between text-sm">
                      <span className="font-mono">{r.referred_user_id.slice(0, 8)}…</span>
                      <span className="text-xs text-[#6B7280]">{new Date(r.signup_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                  {data.referrals.length === 0 && <li className="p-6 text-sm text-[#6B7280]">No referrals yet. Share your link!</li>}
                </ul>
              </div>
              <div className="border border-[#E5E5E5] bg-white">
                <div className="p-5 border-b border-[#E5E5E5] eyebrow">Commissions ({data.commissions.length})</div>
                <ul className="divide-y divide-[#E5E5E5]">
                  {data.commissions.slice(0, 20).map((c, i) => (
                    <li key={i} className="p-4 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-heading font-bold tracking-tight">{c.plan.toUpperCase()}</div>
                        <div className="text-xs text-[#6B7280]">{new Date(c.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="font-heading font-black text-lg text-[#34C759]">₹{c.amount_inr}</div>
                    </li>
                  ))}
                  {data.commissions.length === 0 && <li className="p-6 text-sm text-[#6B7280]">No commissions yet.</li>}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Cell({ icon: Icon, label, value, mono, testid }) {
  return (
    <div className="p-6 border-r last:border-r-0 border-[#E5E5E5]" data-testid={testid}>
      <div className="flex items-center gap-2 eyebrow mb-2">{Icon && <Icon className="w-3 h-3" />}{label}</div>
      <div className={`font-heading font-black text-3xl tracking-tighter text-[#0A192F] ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
