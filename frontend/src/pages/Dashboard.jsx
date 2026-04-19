import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Upload as UploadIcon, FileText, TrendingUp, Crown, ArrowRight, Sparkles, Zap, ShieldCheck, Activity } from "lucide-react";

function useCountUp(to, duration = 900, start = true) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf, t0;
    const step = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * ease));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, start]);
  return n;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const totalScans = data?.stats?.total_scans ?? 0;
  const bestAts = data?.stats?.best_ats_score ?? 0;
  const animTotal = useCountUp(totalScans, 900, !loading);
  const animBest = useCountUp(bestAts, 1200, !loading);

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="dashboard-page">
      <Navbar />

      {/* HERO BAND */}
      <section className="relative border-b border-[#E5E5E5] bg-white overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-70" />
        <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full bg-[#0055FF] opacity-[0.05] blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="animate-fade-up">
              <div className="overline mb-2">Dashboard</div>
              <h1 className="font-heading font-black text-5xl sm:text-6xl tracking-tighter text-[#0A192F]">
                Hi, {user?.name?.split(' ')[0] || 'there'}.
              </h1>
              <p className="text-[#6B7280] text-sm mt-3 max-w-xl">Upload a resume, inspect the ATS breakdown and unlock India-calibrated job & salary insights.</p>
            </div>
            <Link to="/upload" data-testid="upload-cta" className="animate-fade-up" style={{ animationDelay: '100ms' }}>
              <Button className="btn-primary group"><UploadIcon className="w-4 h-4 mr-2 transition-transform group-hover:-translate-y-0.5" /> Upload Resume</Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        {/* Stats Bento */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-[#E5E5E5] bg-white mb-8 overflow-hidden">
          <BentoStat icon={Activity} label="Total Scans" value={animTotal} testid="stat-total-scans" />
          <BentoStat icon={ShieldCheck} label="Best ATS" value={animBest} suffix="/100" color={bestAts >= 75 ? '#34C759' : bestAts >= 50 ? '#FFCC00' : '#0A192F'} testid="stat-best-ats" />
          <BentoStat icon={Zap} label="Scans Left" value={loading ? '—' : (data?.stats?.scans_remaining ?? 0)} testid="stat-scans-left" />
          <BentoStat icon={Crown} label="Plan" value={(user?.plan || 'free').toUpperCase()} highlight={user?.plan !== 'free'} testid="stat-plan" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Previous Scans */}
          <div className="lg:col-span-2 border border-[#E5E5E5] bg-white">
            <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0A192F]" />
                <div className="overline">Previous Scans</div>
              </div>
              <Link to="/upload" className="text-xs overline text-[#0055FF] hover:underline">+ New scan</Link>
            </div>
            <div className="divide-y divide-[#E5E5E5]">
              {loading && (
                <div className="p-6 space-y-3">
                  {[0,1,2].map(i => (
                    <div key={i} className="h-16 border border-[#E5E5E5] shimmer" />
                  ))}
                </div>
              )}
              {!loading && (data?.recent_resumes?.length ?? 0) === 0 && (
                <div className="p-12 text-center">
                  <div className="w-14 h-14 mx-auto border border-[#0A192F] flex items-center justify-center mb-4">
                    <UploadIcon className="w-6 h-6 text-[#0A192F]" strokeWidth={2} />
                  </div>
                  <div className="overline mb-2">No scans yet</div>
                  <div className="font-heading font-bold text-2xl tracking-tight mb-5">Upload your first resume</div>
                  <Link to="/upload"><Button className="btn-primary" data-testid="empty-upload-cta">Start free scan</Button></Link>
                </div>
              )}
              {!loading && data?.recent_resumes?.map((r, i) => {
                const color = r.ats_total >= 75 ? '#34C759' : r.ats_total >= 50 ? '#FFCC00' : r.ats_total ? '#FF3B30' : '#E5E5E5';
                return (
                  <Link to={`/results/${r.id}`} key={r.id} className="flex items-center gap-4 p-5 hover:bg-[#FAFAFA] transition group" data-testid={`scan-item-${r.id}`} style={{ animation: `fade-up 0.5s ${i * 50}ms both` }}>
                    <div className="w-1.5 h-12" style={{ background: color }} />
                    <div className="min-w-0 flex-1">
                      <div className="font-heading font-bold tracking-tight truncate group-hover:text-[#0055FF] transition">{r.filename}</div>
                      <div className="text-xs text-[#6B7280] mt-1 font-mono">
                        {new Date(r.created_at).toLocaleString()} · {r.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-5 pl-4">
                      <div className="text-right">
                        <div className="overline">ATS</div>
                        <div className="font-heading font-black text-xl tracking-tighter" style={{ color: r.ats_total ? color : undefined }}>{r.ats_total ?? '—'}</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="overline">Interview</div>
                        <div className="font-heading font-black text-xl tracking-tighter">{r.interview_probability ? `${r.interview_probability}%` : '—'}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Side column */}
          <div className="space-y-6">
            {/* Insights tile */}
            <div className="border border-[#E5E5E5] bg-white p-6 hover-lift hover-shadow">
              <div className="flex items-center gap-2 overline mb-3"><TrendingUp className="w-4 h-4" /> Career Insights</div>
              <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">After a scan, see recommended roles with match % and ₹ LPA salary ranges.</p>
              <div className="space-y-2 mb-5">
                {[
                  { r: 'Backend Developer', m: 78, s: '₹6–12L' },
                  { r: 'Full Stack', m: 72, s: '₹5–10L' },
                  { r: 'Data Engineer', m: 65, s: '₹8–14L' },
                ].map((j) => (
                  <div key={j.r} className="flex items-center justify-between text-xs">
                    <div className="font-medium">{j.r}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#6B7280] font-mono">{j.s}</span>
                      <span className="font-mono text-[#34C759]">{j.m}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/upload" className="text-sm text-[#0055FF] hover:underline inline-flex items-center gap-1" data-testid="insights-link">Scan a resume <ArrowRight className="w-3 h-3" /></Link>
            </div>

            {/* Plan tile */}
            <div className="border border-[#0A192F] bg-[#0A192F] text-white p-6 relative overflow-hidden group hover-lift">
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-[#0055FF]/20 blur-2xl group-hover:bg-[#0055FF]/30 transition" />
              <div className="relative">
                <div className="flex items-center gap-2 overline text-white/60 mb-3"><Crown className="w-4 h-4" /> Subscription</div>
                <div className="font-heading font-black text-4xl tracking-tighter mb-1">{(user?.plan || 'free').toUpperCase()}</div>
                <div className="text-sm text-white/70 mb-5 leading-relaxed">
                  {user?.plan === 'free' ? 'Unlock unlimited scans, JD match & AI optimization.' : 'You have access to premium tools.'}
                </div>
                <Link to="/pricing" data-testid="upgrade-link">
                  <Button className="bg-[#0055FF] hover:bg-[#0044CC] rounded-none text-white font-semibold group/btn">
                    <Sparkles className="w-4 h-4 mr-2 transition-transform group-hover/btn:rotate-12" /> Upgrade
                  </Button>
                </Link>
              </div>
            </div>

            {/* Affiliate tile */}
            <div className="border border-[#E5E5E5] bg-white p-6 hover-lift hover-shadow">
              <div className="flex items-center gap-2 overline mb-3 text-[#34C759]"><Zap className="w-4 h-4" /> Earn 30%</div>
              <div className="font-heading font-bold text-lg mb-1 tracking-tight">Become an affiliate</div>
              <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">Refer job seekers, earn 30% recurring on every subscription.</p>
              <Link to="/affiliate/dashboard" className="text-sm text-[#0055FF] hover:underline inline-flex items-center gap-1">Open affiliate dashboard <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BentoStat({ icon: Icon, label, value, suffix, highlight, color, testid }) {
  return (
    <div className="p-6 border-r last:border-r-0 border-[#E5E5E5] relative overflow-hidden group hover:bg-[#FAFAFA] transition" data-testid={testid}>
      <div className="flex items-center gap-2 overline mb-3">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </div>
      <div
        className={`font-heading font-black text-3xl sm:text-4xl tracking-tighter transition-transform group-hover:scale-[1.02] origin-left ${highlight ? 'text-[#0055FF]' : ''}`}
        style={!highlight && color ? { color } : undefined}
      >
        {value}{suffix && <span className="text-base text-[#6B7280] font-normal ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
