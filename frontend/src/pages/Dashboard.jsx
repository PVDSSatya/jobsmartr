import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Upload as UploadIcon, FileText, TrendingUp, Crown, ArrowRight, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="dashboard-page">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="overline mb-2">Dashboard</div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter">Hi, {user?.name?.split(' ')[0] || 'there'}.</h1>
            <p className="text-[#6B7280] text-sm mt-2">Upload a resume, inspect the ATS breakdown and unlock India-calibrated job & salary insights.</p>
          </div>
          <Link to="/upload" data-testid="upload-cta">
            <Button className="btn-primary"><UploadIcon className="w-4 h-4 mr-2" /> Upload Resume</Button>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-[#E5E5E5] bg-white mb-10">
          <StatCell label="Total Scans" value={loading ? '—' : (data?.stats?.total_scans ?? 0)} testid="stat-total-scans" />
          <StatCell label="Best ATS" value={loading ? '—' : (data?.stats?.best_ats_score || 0)} suffix="/100" testid="stat-best-ats" />
          <StatCell label="Scans Left" value={loading ? '—' : (data?.stats?.scans_remaining ?? 0)} testid="stat-scans-left" />
          <StatCell label="Plan" value={(user?.plan || 'free').toUpperCase()} highlight={user?.plan !== 'free'} testid="stat-plan" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Previous Scans */}
          <div className="lg:col-span-2 border border-[#E5E5E5] bg-white">
            <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
              <div className="overline">Previous Scans</div>
              <FileText className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div className="divide-y divide-[#E5E5E5]">
              {loading && <div className="p-6 text-sm text-[#6B7280]">Loading…</div>}
              {!loading && (data?.recent_resumes?.length ?? 0) === 0 && (
                <div className="p-10 text-center">
                  <div className="overline mb-2">No scans yet</div>
                  <div className="font-heading font-bold text-2xl tracking-tight mb-4">Upload your first resume</div>
                  <Link to="/upload"><Button className="btn-primary" data-testid="empty-upload-cta">Start free scan</Button></Link>
                </div>
              )}
              {!loading && data?.recent_resumes?.map((r) => (
                <Link to={`/results/${r.id}`} key={r.id} className="flex items-center justify-between p-5 hover:bg-[#FAFAFA] transition" data-testid={`scan-item-${r.id}`}>
                  <div className="min-w-0 flex-1">
                    <div className="font-heading font-bold tracking-tight truncate">{r.filename}</div>
                    <div className="text-xs text-[#6B7280] mt-1">
                      {new Date(r.created_at).toLocaleString()} · {r.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pl-4">
                    <div className="text-right">
                      <div className="overline">ATS</div>
                      <div className="font-heading font-black text-xl tracking-tighter">{r.ats_total ?? '—'}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="overline">Interview</div>
                      <div className="font-heading font-black text-xl tracking-tighter">{r.interview_probability ? `${r.interview_probability}%` : '—'}</div>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Side column */}
          <div className="space-y-6">
            <div className="border border-[#E5E5E5] bg-white p-6">
              <div className="flex items-center gap-2 overline mb-3"><TrendingUp className="w-4 h-4" /> Career Insights</div>
              <p className="text-sm text-[#6B7280] mb-4">After a scan, see recommended roles with match % and ₹ LPA salary ranges.</p>
              <Link to="/upload" className="text-sm text-[#0055FF] hover:underline inline-flex items-center gap-1" data-testid="insights-link">Scan a resume <ArrowRight className="w-3 h-3" /></Link>
            </div>

            <div className="border border-[#E5E5E5] bg-[#0A192F] text-white p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 overline text-white/60 mb-3"><Crown className="w-4 h-4" /> Subscription</div>
              <div className="font-heading font-black text-3xl tracking-tighter mb-1">{(user?.plan || 'free').toUpperCase()}</div>
              <div className="text-sm text-white/70 mb-5">
                {user?.plan === 'free' ? 'Upgrade to unlock unlimited scans, job match & AI optimization.' : 'You have access to premium tools.'}
              </div>
              <Link to="/pricing" data-testid="upgrade-link">
                <Button className="bg-[#0055FF] hover:bg-[#0044CC] rounded-none text-white font-semibold"><Sparkles className="w-4 h-4 mr-2" /> Upgrade</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, suffix, highlight, testid }) {
  return (
    <div className="p-6 border-r last:border-r-0 border-[#E5E5E5]" data-testid={testid}>
      <div className="overline mb-2">{label}</div>
      <div className={`font-heading font-black text-3xl sm:text-4xl tracking-tighter ${highlight ? 'text-[#0055FF]' : 'text-[#0A192F]'}`}>
        {value}{suffix && <span className="text-base text-[#6B7280] font-normal">{suffix}</span>}
      </div>
    </div>
  );
}
