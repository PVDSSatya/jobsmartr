import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { TrendingUp, IndianRupee, Target, Zap } from "lucide-react";

export default function CareerInsights() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/resumes/${id}`).then(r => setData(r.data));
  }, [id]);

  const a = data?.analysis?.analysis;
  const jobs = a?.recommended_jobs || [];
  const gaps = a?.skill_gaps || [];
  const maxSal = Math.max(1, ...jobs.map(j => j.salary_max_lpa || 0));

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="insights-page">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="overline mb-2">Career Insights · India</div>
        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter mb-3">Roles you qualify for — and salaries to target.</h1>
        <p className="text-sm text-[#6B7280] mb-8">Calibrated for the Indian job market in ₹ LPA (Lakhs per Annum).</p>

        {!data && <div className="overline">Loading…</div>}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Jobs */}
            <div className="lg:col-span-8 border border-[#E5E5E5] bg-white">
              <div className="p-6 border-b border-[#E5E5E5] flex items-center gap-2"><Target className="w-4 h-4" /> <span className="overline">Recommended Roles</span></div>
              <ul className="divide-y divide-[#E5E5E5]" data-testid="recommended-jobs-list">
                {jobs.map((j, i) => (
                  <li key={i} className="p-6">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div>
                        <div className="font-heading font-bold text-xl tracking-tight">{j.role}</div>
                        <div className="text-sm text-[#6B7280] mt-1">{j.why}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="overline">Match</div>
                        <div className="font-heading font-black text-2xl tracking-tighter text-[#0055FF]">{j.match}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <IndianRupee className="w-4 h-4 text-[#34C759]" />
                      <span className="font-heading font-bold">{j.salary_min_lpa}L – {j.salary_max_lpa}L</span>
                      <span className="text-xs text-[#6B7280]">per annum</span>
                    </div>
                    <div className="h-2 bg-[#F3F4F6] relative mt-2">
                      <div className="absolute inset-y-0 bg-[#34C759]" style={{ left: `${(j.salary_min_lpa/maxSal)*100}%`, right: `${100 - (j.salary_max_lpa/maxSal)*100}%` }} />
                    </div>
                  </li>
                ))}
                {jobs.length === 0 && <li className="p-6 text-sm text-[#6B7280]">No recommendations yet.</li>}
              </ul>
            </div>

            {/* Skill Gaps */}
            <div className="lg:col-span-4 border border-[#E5E5E5] bg-white">
              <div className="p-6 border-b border-[#E5E5E5] flex items-center gap-2"><TrendingUp className="w-4 h-4" /> <span className="overline">Skill Gap Analysis</span></div>
              <ul className="divide-y divide-[#E5E5E5]" data-testid="skill-gaps-list">
                {gaps.map((g, i) => (
                  <li key={i} className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-[#0055FF]" />
                      <div className="font-heading font-bold tracking-tight">{g.skill}</div>
                    </div>
                    <div className="text-sm text-[#6B7280]">{g.reason}</div>
                    {g.unlocks_role && <div className="mt-2 text-xs overline">Unlocks → {g.unlocks_role}</div>}
                  </li>
                ))}
                {gaps.length === 0 && <li className="p-6 text-sm text-[#6B7280]">No major gaps detected.</li>}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link to={`/results/${id}`} className="text-sm text-[#0055FF] hover:underline">← Back to results</Link>
        </div>
      </div>
    </div>
  );
}
