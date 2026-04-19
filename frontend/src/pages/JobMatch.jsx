import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Target, CheckCircle2, XCircle } from "lucide-react";

export default function JobMatch() {
  const { id } = useParams();
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (jd.trim().length < 80) { toast.error("Paste a longer job description"); return; }
    setLoading(true);
    try {
      const r = await api.post(`/job-match`, { resume_id: id, job_description: jd });
      setResult(r.data);
      toast.success("Match analysis complete");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Match failed");
    } finally { setLoading(false); }
  };

  const score = result?.result?.match_score || 0;
  const color = score >= 75 ? "#34C759" : score >= 50 ? "#FFCC00" : "#FF3B30";

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="jd-match-page">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="overline mb-2">Job Description Match</div>
        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter mb-3">How well does this role fit you?</h1>
        <p className="text-sm text-[#6B7280] mb-8">Paste any JD to see match % and missing keywords.</p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 border border-[#E5E5E5] bg-white p-6">
            <div className="overline mb-3">Paste Job Description</div>
            <Textarea value={jd} onChange={(e)=>setJd(e.target.value)} rows={14} placeholder="Paste the full JD here…" className="rounded-none border-[#E5E5E5] font-mono text-sm" data-testid="jd-textarea" />
            <Button onClick={submit} disabled={loading} className="btn-primary mt-4" data-testid="jd-submit">
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Matching…</>) : (<><Target className="w-4 h-4 mr-2" /> Compute Match</>)}
            </Button>
          </div>

          <div className="lg:col-span-6 border border-[#E5E5E5] bg-white p-6 min-h-[300px]">
            {!result && <div className="h-full flex items-center justify-center text-sm text-[#6B7280]">Match result will appear here.</div>}
            {result && (
              <div data-testid="jd-match-result">
                <div className="flex items-center gap-8 mb-6">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 120 120" className="w-32 h-32">
                      <circle cx="60" cy="60" r="48" fill="none" stroke="#F3F4F6" strokeWidth="12" />
                      <circle cx="60" cy="60" r="48" fill="none" stroke={color} strokeWidth="12"
                        strokeDasharray={2 * Math.PI * 48} strokeDashoffset={2 * Math.PI * 48 * (1 - score/100)}
                        transform="rotate(-90 60 60)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-heading font-black text-3xl tracking-tighter">{score}%</div>
                  </div>
                  <div className="flex-1">
                    <div className="overline mb-1">Interview Probability</div>
                    <div className="font-heading font-black text-3xl tracking-tighter">{result.interview_probability}%</div>
                    <div className="text-sm text-[#6B7280] mt-2">{result.result.verdict}</div>
                  </div>
                </div>

                <div className="border-t border-[#E5E5E5] pt-4 space-y-4">
                  <div>
                    <div className="overline mb-2">Matched ({result.result.matched_keywords?.length || 0})</div>
                    <div className="flex flex-wrap gap-2">
                      {(result.result.matched_keywords || []).map((k, i) => (
                        <span key={i} className="border border-[#34C759] text-[#34C759] px-2 py-1 text-xs font-mono flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{k}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="overline mb-2">Missing ({result.result.missing_keywords?.length || 0})</div>
                    <div className="flex flex-wrap gap-2">
                      {(result.result.missing_keywords || []).map((k, i) => (
                        <span key={i} className="border border-[#FF3B30] text-[#FF3B30] px-2 py-1 text-xs font-mono flex items-center gap-1"><XCircle className="w-3 h-3" />{k}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="overline mb-2">Strengths</div>
                      <ul className="space-y-1 text-[#6B7280]">{(result.result.strengths || []).map((s,i)=><li key={i}>• {s}</li>)}</ul>
                    </div>
                    <div>
                      <div className="overline mb-2">Gaps</div>
                      <ul className="space-y-1 text-[#6B7280]">{(result.result.gaps || []).map((s,i)=><li key={i}>• {s}</li>)}</ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Link to={`/results/${id}`} className="text-sm text-[#0055FF] hover:underline">← Back to results</Link>
        </div>
      </div>
    </div>
  );
}
