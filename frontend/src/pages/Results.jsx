import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell as BarCell } from "recharts";
import { AlertCircle, Sparkles, Search, TrendingUp, Loader2, ArrowRight, Copy } from "lucide-react";

const statusColor = (s) => s === "green" ? "#34C759" : s === "yellow" ? "#FFCC00" : "#FF3B30";

function ScoreRing({ score }) {
  const r = 70; const c = 2 * Math.PI * r;
  const color = score >= 75 ? "#34C759" : score >= 50 ? "#FFCC00" : "#FF3B30";
  return (
    <div className="relative w-48 h-48 mx-auto" data-testid="ats-score-circular-chart">
      <svg viewBox="0 0 160 160" className="w-full h-full">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#F3F4F6" strokeWidth="14" />
        <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={c} strokeDashoffset={c * (1 - score/100)}
          transform="rotate(-90 80 80)" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-heading font-black text-5xl tracking-tighter text-[#0A192F]">{score}</div>
        <div className="overline mt-1">ATS Score</div>
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
    api.get(`/resumes/${id}`).then(r => setData(r.data)).catch(e => toast.error(e?.response?.data?.detail || "Not found")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

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

  if (loading) return <div className="min-h-screen bg-[#FAFAFA]"><Navbar /><div className="p-12 text-center overline">Loading analysis…</div></div>;
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
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="overline mb-2">Analysis Results</div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter">{data.resume.filename}</h1>
            <p className="text-sm text-[#6B7280] mt-2">Name: {parsed.name || '—'} · Email: {parsed.email || '—'}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate(`/results/${id}/job-match`)} className="btn-outline" data-testid="to-jd-match"><Search className="w-4 h-4 mr-2" /> JD Match</Button>
            <Button onClick={() => navigate(`/results/${id}/insights`)} className="btn-secondary" data-testid="to-insights"><TrendingUp className="w-4 h-4 mr-2" /> Career Insights</Button>
          </div>
        </div>

        {/* TOP ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Score ring */}
          <div className="lg:col-span-4 border border-[#E5E5E5] bg-white p-8">
            <ScoreRing score={ats.total || 0} />
            <div className="border-t border-[#E5E5E5] mt-6 pt-4 grid grid-cols-2 text-center">
              <div>
                <div className="overline">Interview</div>
                <div className="font-heading font-black text-2xl tracking-tighter" data-testid="interview-prob">{ip}%</div>
              </div>
              <div className="border-l border-[#E5E5E5]">
                <div className="overline">Verdict</div>
                <div className="font-heading font-black text-2xl tracking-tighter">{ats.total >= 75 ? 'Strong' : ats.total >= 50 ? 'Average' : 'Weak'}</div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="lg:col-span-8 border border-[#E5E5E5] bg-white p-6">
            <div className="overline mb-4">Score Breakdown</div>
            <div className="h-64" data-testid="score-breakdown-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E5E5' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #E5E5E5' }} />
                  <Bar dataKey="v" radius={0}>
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
            <div className="overline mb-4">Resume Heatmap</div>
            <ul className="divide-y divide-[#E5E5E5]" data-testid="heatmap-list">
              {heatmap.map((h, i) => (
                <li key={i} className="py-3 flex items-start gap-4">
                  <span className="w-3 h-3 mt-1.5 flex-shrink-0" style={{ background: statusColor(h.status) }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-heading font-bold tracking-tight">{h.section}</div>
                    <div className="text-sm text-[#6B7280]">{h.comment}</div>
                  </div>
                  <span className="overline" style={{ color: statusColor(h.status) }}>{h.status}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Missing keywords */}
          <div className="lg:col-span-6 border border-[#E5E5E5] bg-white p-6">
            <div className="overline mb-4">Missing Keywords</div>
            <div className="flex flex-wrap gap-2" data-testid="missing-keywords">
              {missing.length === 0 && <div className="text-sm text-[#6B7280]">No major keywords missing — great job.</div>}
              {missing.map((k, i) => (
                <span key={i} className="border border-[#FF3B30] text-[#FF3B30] px-3 py-1 text-sm font-mono">{k}</span>
              ))}
            </div>
            <div className="border-t border-[#E5E5E5] mt-6 pt-4">
              <div className="overline mb-3">Quick Weaknesses</div>
              <ul className="text-sm space-y-2">
                {(a.weaknesses || []).map((w, i) => (
                  <li key={i} className="flex gap-2"><span className="text-[#FF3B30]">•</span><span>{w}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* SUGGESTIONS + OPTIMIZE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 border border-[#E5E5E5] bg-white p-6">
            <div className="overline mb-4">AI Suggestions</div>
            <ul className="space-y-3" data-testid="suggestions-list">
              {(a.suggestions || []).map((s, i) => (
                <li key={i} className="flex gap-3 text-sm"><span className="text-[#0055FF] font-mono">{String(i+1).padStart(2,'0')}</span><span>{s}</span></li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 border border-[#0A192F] bg-[#0A192F] text-white p-6">
            <div className="overline text-white/60 mb-3">One-click</div>
            <h3 className="font-heading font-black text-3xl tracking-tighter mb-3">Optimize My Resume</h3>
            <p className="text-sm text-white/70 mb-5">Rewrite weak bullets, add missing keywords, strengthen action verbs and metrics — in seconds.</p>
            <Button onClick={optimize} disabled={optimizing} className="bg-[#0055FF] hover:bg-[#0044CC] rounded-none font-semibold" data-testid="optimize-btn">
              {optimizing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Optimizing…</>) : (<><Sparkles className="w-4 h-4 mr-2" /> Optimize My Resume</>)}
            </Button>

            {optimized && (
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <div className="overline text-white/60 mb-1">New Summary</div>
                  <p className="text-white/90 leading-relaxed">{optimized.optimized_summary}</p>
                </div>
                <div>
                  <div className="overline text-white/60 mb-2">Rewritten Bullets ({optimized.rewritten_bullets?.length || 0})</div>
                  <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {optimized.rewritten_bullets?.map((b, i) => (
                      <li key={i} className="border-l-2 border-[#0055FF] pl-3">
                        <div className="text-white/50 line-through text-xs">{b.original}</div>
                        <div className="text-white mt-1">{b.improved}</div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-xs text-white/60">Projected ATS gain: <span className="text-[#34C759] font-bold">+{optimized.projected_ats_gain}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
