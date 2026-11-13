import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell as BarCell } from "recharts";
import { AlertCircle, Sparkles, Search, TrendingUp, Loader2, ArrowRight, ArrowLeft, Award, Zap, Target as TargetIcon } from "lucide-react";

const statusColor = (s) => s === "green" ? "#34C759" : s === "yellow" ? "#FFCC00" : "#FF3B30";

function ScoreRing({ score, size = 200 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf, t0;
    const dur = 1400;
    const step = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(score * ease));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const color = score >= 75 ? "#34C759" : score >= 50 ? "#FFCC00" : "#FF3B30";
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} data-testid="ats-score-circular-chart">
      <div className="absolute inset-0 animate-pulse-ring blur-2xl" style={{ background: `${color}22` }} />
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full relative">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth="14" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={c} strokeDashoffset={c * (1 - score/100)}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-heading font-black text-6xl tracking-tighter text-[#0A192F]">{display}</div>
        <div className="eyebrow mt-1">out of 100</div>
      </div>
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get(`/resumes/${id}`)
      .then(r => setData(r.data))
      .catch(e => toast.error(e?.response?.data?.detail || "Not found"))
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const optimize = async () => {
    setOptimizing(true);
    try {
      const r = await api.post(`/resumes/${id}/optimize`);
      setOptimized(r.data.result);
      toast.success("Optimized suggestions ready");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Optimization failed");
    } finally { setOptimizing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-8 w-40 bg-[#F3F4F6] shimmer mb-4" />
        <div className="h-14 w-96 bg-[#F3F4F6] shimmer mb-12" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-80 bg-[#F3F4F6] shimmer" />
          <div className="lg:col-span-8 h-80 bg-[#F3F4F6] shimmer" />
        </div>
      </div>
    </div>
  );

  if (!data?.analysis) return (
    <div className="min-h-screen bg-[#FAFAFA]"><Navbar />
      <div className="max-w-2xl mx-auto p-12 text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-4 text-[#FF3B30]" />
        <h2 className="font-heading font-bold text-2xl mb-2">Analysis not ready</h2>
        <Link to="/upload"><Button className="btn-primary">Upload a resume</Button></Link>
      </div></div>
  );

  const a = data.analysis.analysis;
  const ats = a.ats || { total: 0, breakdown: {} };
  const bd = ats.breakdown || {};
  const heatmap = a.heatmap || [];
  const missing = a.missing_keywords || [];
  const parsed = a.parsed || {};
  const ip = data.analysis.interview_probability ?? Math.round(ats.total * 0.6 + 50 * 0.4);
  const total = ats.total || 0;
  const verdict = total >= 75 ? 'Strong' : total >= 50 ? 'Average' : 'Needs work';
  const verdictColor = total >= 75 ? '#34C759' : total >= 50 ? '#FFCC00' : '#FF3B30';

  const barData = [
    { name: 'Keywords', v: bd.keyword_match || 0, max: 35 },
    { name: 'Skills', v: bd.skills_match || 0, max: 20 },
    { name: 'Experience', v: bd.experience_relevance || 0, max: 20 },
    { name: 'Formatting', v: bd.formatting || 0, max: 15 },
    { name: 'Education', v: bd.education || 0, max: 10 },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="results-page">
      <Navbar />

      {/* HERO */}
      <section className="relative border-b border-[#E5E5E5] bg-white overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-60" />
        <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full blur-3xl opacity-[0.06]" style={{ background: verdictColor }} />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          <Link to="/dashboard" className="inline-flex items-center gap-2 eyebrow text-[#6B7280] hover:text-[#0055FF] mb-4"><ArrowLeft className="w-3 h-3" /> Back to Dashboard</Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="animate-fade-up">
              <div className="flex items-center gap-3 mb-2">
                <div className="eyebrow">Analysis Results</div>
                <span className="eyebrow px-2 py-0.5" style={{ background: `${verdictColor}18`, color: verdictColor }}>{verdict}</span>
              </div>
              <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter text-[#0A192F]">{data.resume.filename}</h1>
              <p className="text-sm text-[#6B7280] mt-3 font-mono">
                {parsed.name || '—'} · {parsed.email || '—'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate(`/results/${id}/job-match`)} className="btn-outline group" data-testid="to-jd-match">
                <Search className="w-4 h-4 mr-2" /> JD Match
                <ArrowRight className="w-3 h-3 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button onClick={() => navigate(`/results/${id}/insights`)} className="btn-secondary group" data-testid="to-insights">
                <TrendingUp className="w-4 h-4 mr-2" /> Career Insights
                <ArrowRight className="w-3 h-3 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        {/* TOP ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Score ring */}
          <div className="lg:col-span-4 border border-[#E5E5E5] bg-white p-8 flex flex-col items-center">
            <div className="eyebrow mb-6">ATS Score</div>
            <ScoreRing score={total} />
            <div className="w-full border-t border-[#E5E5E5] mt-8 pt-5 grid grid-cols-2 text-center">
              <div>
                <div className="eyebrow mb-1">Interview</div>
                <div className="font-heading font-black text-3xl tracking-tighter" data-testid="interview-prob" style={{ color: verdictColor }}>{ip}%</div>
              </div>
              <div className="border-l border-[#E5E5E5]">
                <div className="eyebrow mb-1">Verdict</div>
                <div className="font-heading font-black text-3xl tracking-tighter">{verdict}</div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="lg:col-span-8 border border-[#E5E5E5] bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#0A192F]" />
                <div className="eyebrow">Score Breakdown</div>
              </div>
              <div className="text-xs font-mono text-[#6B7280]">max 100</div>
            </div>
            <div className="h-72" data-testid="score-breakdown-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280', fontFamily: 'Satoshi' }} axisLine={{ stroke: '#E5E5E5' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #E5E5E5', fontSize: 12 }} cursor={{ fill: 'rgba(0,85,255,0.04)' }} />
                  <Bar dataKey="v" radius={0} animationDuration={1100}>
                    {barData.map((d, i) => (
                      <BarCell key={i} fill={d.v/d.max >= 0.8 ? '#34C759' : d.v/d.max >= 0.5 ? '#FFCC00' : '#FF3B30'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SECOND ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Heatmap */}
          <div className="lg:col-span-6 border border-[#E5E5E5] bg-white p-6">
            <div className="flex items-center gap-2 mb-5">
              <TargetIcon className="w-4 h-4 text-[#0A192F]" />
              <div className="eyebrow">Resume Heatmap</div>
            </div>
            <ul className="divide-y divide-[#E5E5E5]" data-testid="heatmap-list">
              {heatmap.map((h, i) => (
                <li key={i} className="py-4 flex items-start gap-4 hover:bg-[#FAFAFA] -mx-2 px-2 transition" style={{ animation: `fade-up 0.5s ${i * 60}ms both` }}>
                  <span className="w-3 h-3 mt-1.5 flex-shrink-0" style={{ background: statusColor(h.status) }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-heading font-bold tracking-tight">{h.section}</div>
                    <div className="text-sm text-[#6B7280] leading-relaxed mt-1">{h.comment}</div>
                  </div>
                  <span className="eyebrow px-2 py-0.5 flex-shrink-0" style={{ color: statusColor(h.status), background: `${statusColor(h.status)}15` }}>{h.status}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Missing keywords */}
          <div className="lg:col-span-6 border border-[#E5E5E5] bg-white p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4 text-[#FF3B30]" />
              <div className="eyebrow">Missing Keywords</div>
            </div>
            <div className="flex flex-wrap gap-2" data-testid="missing-keywords">
              {missing.length === 0 && <div className="text-sm text-[#6B7280]">No major keywords missing — great job.</div>}
              {missing.map((k, i) => (
                <span key={i} className="border border-[#FF3B30] text-[#FF3B30] px-3 py-1 text-sm font-mono hover:bg-[#FF3B30] hover:text-white transition cursor-default" style={{ animation: `fade-up 0.5s ${i * 40}ms both` }}>{k}</span>
              ))}
            </div>
            <div className="border-t border-[#E5E5E5] mt-6 pt-5">
              <div className="eyebrow mb-3">Weaknesses to Address</div>
              <ul className="text-sm space-y-2.5">
                {(a.weaknesses || []).map((w, i) => (
                  <li key={i} className="flex gap-3 items-start"><span className="w-1 h-1 rounded-full bg-[#FF3B30] mt-2 flex-shrink-0" /><span className="leading-relaxed">{w}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* SUGGESTIONS + OPTIMIZE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 border border-[#E5E5E5] bg-white p-6">
            <div className="flex items-center gap-2 mb-5">
              <Award className="w-4 h-4 text-[#0055FF]" />
              <div className="eyebrow">AI Suggestions</div>
            </div>
            <ul className="space-y-4" data-testid="suggestions-list">
              {(a.suggestions || []).map((s, i) => (
                <li key={i} className="flex gap-4 text-sm leading-relaxed" style={{ animation: `fade-up 0.5s ${i * 60}ms both` }}>
                  <span className="text-[#0055FF] font-mono font-bold">{String(i+1).padStart(2,'0')}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 border border-[#0A192F] bg-[#0A192F] text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 grid-lines-dark" />
            <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-[#0055FF]/20 blur-3xl" />
            <div className="relative">
              <div className="eyebrow text-white/60 mb-3">One-click</div>
              <h3 className="font-heading font-black text-3xl tracking-tighter mb-3">Optimize My Resume</h3>
              <p className="text-sm text-white/70 mb-5 leading-relaxed">Rewrite weak bullets, add missing keywords, strengthen action verbs and metrics — in seconds.</p>
              <Button onClick={optimize} disabled={optimizing} className="bg-[#0055FF] hover:bg-[#0044CC] rounded-md font-semibold group" data-testid="optimize-btn">
                {optimizing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Optimizing…</>) : (<><Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" /> Optimize My Resume</>)}
              </Button>

              {optimized && (
                <div className="mt-6 space-y-5 text-sm animate-fade-up">
                  <div className="border-l-2 border-[#34C759] pl-4">
                    <div className="eyebrow text-white/60 mb-2">New Summary</div>
                    <p className="text-white/90 leading-relaxed">{optimized.optimized_summary}</p>
                  </div>
                  <div>
                    <div className="eyebrow text-white/60 mb-3">Rewritten Bullets ({optimized.rewritten_bullets?.length || 0})</div>
                    <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {optimized.rewritten_bullets?.map((b, i) => (
                        <li key={i} className="border border-white/10 p-3 hover:border-[#0055FF]/50 transition">
                          <div className="text-white/40 line-through text-xs">{b.original}</div>
                          <div className="text-white mt-1.5">{b.improved}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-xs bg-[#34C759]/15 border border-[#34C759]/40 px-3 py-2 text-[#34C759] font-mono">Projected ATS gain: +{optimized.projected_ats_gain}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
