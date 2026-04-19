import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { ArrowRight, Target, Zap, TrendingUp, Shield, FileCheck, Sparkles, CheckCircle2, IndianRupee, Search, BarChart3 } from "lucide-react";

const Stat = ({ k, v, label }) => (
  <div className="border border-[#E5E5E5] bg-white p-6">
    <div className="overline mb-2">{label}</div>
    <div className="font-heading font-black text-4xl tracking-tighter text-[#0A192F]">{k}</div>
    <div className="text-sm text-[#6B7280] mt-1">{v}</div>
  </div>
);

const Feature = ({ icon: Icon, title, desc, testid }) => (
  <div className="border border-[#E5E5E5] bg-white p-8 hover:-translate-y-1 hover:shadow-md transition-all duration-300" data-testid={testid}>
    <div className="w-12 h-12 border border-[#0A192F] flex items-center justify-center mb-5">
      <Icon className="w-6 h-6 text-[#0A192F]" strokeWidth={2} />
    </div>
    <h3 className="font-heading font-bold text-xl mb-2 tracking-tight">{title}</h3>
    <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
  </div>
);

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="bg-[#FAFAFA] min-h-screen" data-testid="landing-page">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#E5E5E5] bg-white">
        <div className="absolute inset-0 grid-lines opacity-60" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="inline-flex items-center gap-2 border border-[#0A192F] px-3 py-1.5 mb-6">
              <span className="w-2 h-2 bg-[#34C759]" />
              <span className="overline">AI Career Intelligence · India</span>
            </div>
            <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95] text-balance text-[#0A192F]">
              Get hired <span className="text-[#0055FF]">smarter</span>,<br/>not harder.
            </h1>
            <p className="text-lg text-[#6B7280] mt-6 max-w-xl leading-relaxed">
              Check your ATS score, discover what jobs you qualify for, and see how much you can earn — powered by an AI career intelligence engine built for India.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button onClick={() => navigate('/signup')} className="btn-primary text-base" data-testid="hero-cta-primary">
                Check My Resume Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate('/pricing')} variant="ghost" className="btn-outline text-base" data-testid="hero-cta-secondary">
                View Pricing
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-[#6B7280]">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34C759]" /> 2 free scans · no card needed</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34C759]" /> PDF & DOCX supported</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34C759]" /> Structured JSON results</div>
            </div>
          </div>

          {/* Right: Mock ATS Card */}
          <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="relative border border-[#E5E5E5] bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="overline">ATS Snapshot</div>
                <div className="text-xs font-mono text-[#6B7280]">RESUME.PDF</div>
              </div>
              <div className="flex items-end gap-6 my-6">
                <div className="relative">
                  <svg viewBox="0 0 120 120" className="w-36 h-36">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#F3F4F6" strokeWidth="12" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#34C759" strokeWidth="12"
                      strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - 0.82)}`}
                      transform="rotate(-90 60 60)" strokeLinecap="butt" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-heading font-black text-4xl tracking-tighter text-[#0A192F]">82</div>
                    <div className="text-[10px] overline">ATS Score</div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    ['Keyword', 30, 35, 'bg-[#34C759]'],
                    ['Skills', 17, 20, 'bg-[#34C759]'],
                    ['Experience', 14, 20, 'bg-[#FFCC00]'],
                    ['Formatting', 12, 15, 'bg-[#34C759]'],
                    ['Education', 9, 10, 'bg-[#34C759]'],
                  ].map(([k, v, max, color]) => (
                    <div key={k} className="text-xs">
                      <div className="flex justify-between mb-1 text-[#6B7280]"><span>{k}</span><span className="font-mono">{v}/{max}</span></div>
                      <div className="h-1.5 bg-[#F3F4F6]"><div className={`h-full ${color}`} style={{ width: `${(v/max)*100}%` }}/></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#E5E5E5] pt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#FAFAFA] p-3">
                  <div className="overline mb-1">Match</div>
                  <div className="font-heading font-bold text-lg">Backend Developer · 78%</div>
                </div>
                <div className="bg-[#FAFAFA] p-3">
                  <div className="overline mb-1">Salary</div>
                  <div className="font-heading font-bold text-lg">₹6L – ₹12L</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-[#0A192F] text-white border-y border-[#0A192F]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-14 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="font-heading font-black text-5xl tracking-tighter">75%</div>
            <div className="overline text-white/60 mt-2">Resumes fail ATS</div>
          </div>
          <div>
            <div className="font-heading font-black text-5xl tracking-tighter">3×</div>
            <div className="overline text-white/60 mt-2">More interview calls</div>
          </div>
          <div>
            <div className="font-heading font-black text-5xl tracking-tighter">₹4L+</div>
            <div className="overline text-white/60 mt-2">Average salary boost</div>
          </div>
          <div>
            <div className="font-heading font-black text-5xl tracking-tighter">60s</div>
            <div className="overline text-white/60 mt-2">From upload to insights</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div className="mb-14 max-w-3xl">
          <div className="overline mb-3">Everything you need</div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter text-[#0A192F]">A career intelligence stack — not another resume checker.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Feature icon={Target} title="ATS Scoring Engine" desc="Score out of 100 across keyword match, skills, experience, formatting and education." testid="feature-ats" />
          <Feature icon={BarChart3} title="Resume Heatmap" desc="Color-coded sections (green/yellow/red) so you know exactly what to fix first." testid="feature-heatmap" />
          <Feature icon={Search} title="Job Description Match" desc="Paste any JD — we compute match % and the missing keywords to win the shortlist." testid="feature-jd-match" />
          <Feature icon={IndianRupee} title="India Salary Insights" desc="Realistic ₹ LPA ranges for recommended roles, calibrated for the Indian market." testid="feature-salary" />
          <Feature icon={Sparkles} title="AI Resume Optimize" desc="One-click rewrite of weak bullets, improved summary, strong action verbs and metrics." testid="feature-optimize" />
          <Feature icon={TrendingUp} title="Skill Gap Analysis" desc="See the exact skills that unlock higher-paying roles in your target domain." testid="feature-skill-gap" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-y border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <div className="overline mb-3">How it works</div>
            <h2 className="font-heading font-black text-4xl tracking-tighter">Four steps from upload to interview.</h2>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { n: '01', t: 'Upload Resume', d: 'PDF or DOCX. We extract and structure your content.' },
              { n: '02', t: 'AI Analysis', d: 'Claude-powered ATS scoring, parsing and heatmap — in under a minute.' },
              { n: '03', t: 'Match & Salary', d: 'Recommended roles with match % and India salary ranges in ₹ LPA.' },
              { n: '04', t: 'Optimize', d: 'One-click resume optimization to lift your ATS score and interview odds.' },
            ].map((s) => (
              <div key={s.n} className="border border-[#E5E5E5] p-6">
                <div className="font-mono text-sm text-[#0055FF] mb-3">{s.n}</div>
                <h4 className="font-heading font-bold text-xl mb-2">{s.t}</h4>
                <p className="text-sm text-[#6B7280]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="overline mb-3">Used by candidates across India</div>
        <h2 className="font-heading font-black text-4xl tracking-tighter mb-10">From the shortlist to the offer letter.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#E5E5E5] bg-white p-8">
            <p className="font-heading text-xl leading-snug tracking-tight text-[#0A192F]">“Went from 4 ATS rejections to 3 interviews in one week. The missing keywords list alone was worth it.”</p>
            <div className="mt-6 flex items-center gap-3">
              <img src="https://images.pexels.com/photos/7580940/pexels-photo-7580940.jpeg" alt="Rahul" className="w-10 h-10 object-cover" />
              <div>
                <div className="font-semibold text-sm">Rahul M.</div>
                <div className="text-xs text-[#6B7280]">Backend Engineer · Bengaluru</div>
              </div>
            </div>
          </div>
          <div className="border border-[#E5E5E5] bg-white p-8">
            <p className="font-heading text-xl leading-snug tracking-tight text-[#0A192F]">“The salary insights helped me negotiate ₹3.5L more. Optimize button rewrote my bullets beautifully.”</p>
            <div className="mt-6 flex items-center gap-3">
              <img src="https://images.pexels.com/photos/7580822/pexels-photo-7580822.jpeg" alt="Priya" className="w-10 h-10 object-cover" />
              <div>
                <div className="font-semibold text-sm">Priya S.</div>
                <div className="text-xs text-[#6B7280]">Product Analyst · Gurugram</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="bg-[#0A192F] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
          <div>
            <div className="overline text-white/60 mb-3">Start free</div>
            <h2 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter text-balance max-w-2xl">2 free scans. Upgrade to Pro at ₹399/month for unlimited.</h2>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/signup')} className="btn-primary" data-testid="bottom-cta-signup">Start Free</Button>
            <Button onClick={() => navigate('/pricing')} className="bg-white text-[#0A192F] hover:bg-white/90 rounded-none px-6 py-3 font-semibold" data-testid="bottom-cta-pricing">See plans</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
