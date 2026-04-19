import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { ArrowRight, ArrowUpRight, Target, Zap, TrendingUp, FileCheck, Sparkles, CheckCircle2, IndianRupee, Search, BarChart3, ShieldCheck, Clock, Star, BrainCircuit, Layers, Rocket } from "lucide-react";

// ---------- helpers ----------
function useCountUp(to, duration = 1400, start = false) {
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

function useInView(options = { threshold: 0.3 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, options);
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line
  return [ref, visible];
}

// ---------- ATS Ring (animated) ----------
function AtsRing() {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setScore(82), 300);
    return () => clearTimeout(t);
  }, []);
  const r = 62; const c = 2 * Math.PI * r;
  return (
    <div className="relative">
      <div className="absolute inset-0 animate-pulse-ring bg-[#34C759]/10 blur-2xl" />
      <svg viewBox="0 0 160 160" className="w-44 h-44 relative">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
        <circle cx="80" cy="80" r={r} fill="none" stroke="#34C759" strokeWidth="12"
          strokeDasharray={c} strokeDashoffset={c * (1 - score/100)}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
          transform="rotate(-90 80 80)" strokeLinecap="butt" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-heading font-black text-5xl tracking-tighter text-[#0A192F]">{score}</div>
        <div className="eyebrow mt-1">ATS Score</div>
      </div>
    </div>
  );
}

// ---------- Stat ----------
function Stat({ value, suffix = '', label, decimals = 0 }) {
  const [ref, inView] = useInView();
  const raw = useCountUp(value, 1400, inView);
  const display = decimals ? raw.toFixed(decimals) : raw.toLocaleString('en-IN');
  return (
    <div ref={ref} className="border-r border-white/10 px-6 py-10 last:border-r-0 group">
      <div className="font-heading font-black text-5xl lg:text-6xl tracking-tighter transition-transform group-hover:scale-[1.02]">
        {display}{suffix}
      </div>
      <div className="eyebrow text-white/50 mt-3">{label}</div>
    </div>
  );
}

// ---------- Logo ticker ----------
const brands = ['Swiggy', 'Razorpay', 'Flipkart', 'Zomato', 'CRED', 'Paytm', 'Zerodha', 'Myntra', 'Meesho', 'Ola', 'PhonePe', 'BYJU\'S'];

export default function Landing() {
  const navigate = useNavigate();
  const [heroIn, setHeroIn] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setHeroIn(true)); }, []);

  return (
    <div className="bg-[#FAFAFA] min-h-screen" data-testid="landing-page">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#E5E5E5] bg-white">
        <div className="absolute inset-0 grid-lines opacity-70" />
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-[#0055FF] opacity-[0.04] blur-3xl" />
        <div className="absolute top-20 -left-40 w-[420px] h-[420px] rounded-full bg-[#34C759] opacity-[0.05] blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className={`lg:col-span-7 ${heroIn ? 'animate-fade-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 border border-[#0A192F] px-3 py-1.5 mb-6">
              <span className="w-2 h-2 bg-[#34C759] animate-pulse" />
              <span className="eyebrow">AI Career Intelligence</span>
            </div>
            <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95] text-balance text-[#0A192F]">
              Get hired <span className="text-[#0055FF]">smarter</span>,<br/>not harder.
            </h1>
            <p className="text-lg text-[#6B7280] mt-7 max-w-xl leading-relaxed">
              Check your ATS score, discover what jobs you qualify for, and see how much you can earn — powered by an AI career intelligence engine built for India.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button onClick={() => navigate('/signup')} className="btn-primary text-base group" data-testid="hero-cta-primary">
                Check My Resume Free <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button onClick={() => navigate('/pricing')} variant="ghost" className="btn-outline text-base" data-testid="hero-cta-secondary">
                View Pricing
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-10 text-sm text-[#6B7280]">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34C759]" /> 2 free scans · no card needed</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34C759]" /> PDF & DOCX supported</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34C759]" /> Results in under 60 seconds</div>
            </div>

            {/* tiny social proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[
                  'https://images.pexels.com/photos/7580940/pexels-photo-7580940.jpeg',
                  'https://images.pexels.com/photos/7580822/pexels-photo-7580822.jpeg',
                  'https://images.pexels.com/photos/5453822/pexels-photo-5453822.jpeg',
                ].map((src, i) => (
                  <img key={i} src={src} alt="" className="w-9 h-9 object-cover border-2 border-white ring-1 ring-[#E5E5E5]" />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[0,1,2,3,4].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-[#FFCC00] text-[#FFCC00]" />)}
                </div>
                <div className="text-xs text-[#6B7280] mt-0.5">4.9/5 · 10,000+ resumes analyzed</div>
              </div>
            </div>
          </div>

          {/* Right: Bento preview */}
          <div className={`lg:col-span-5 ${heroIn ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '150ms' }}>
            <div className="grid grid-cols-12 gap-3">
              {/* ATS Snapshot */}
              <div className="col-span-12 border border-[#E5E5E5] bg-white p-6 hover-lift hover-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="eyebrow">ATS Snapshot</div>
                  <div className="text-xs font-mono text-[#6B7280]">RESUME.PDF</div>
                </div>
                <div className="flex items-end gap-6">
                  <AtsRing />
                  <div className="flex-1 space-y-2">
                    {[
                      ['Keyword', 30, 35, '#34C759'],
                      ['Skills', 17, 20, '#34C759'],
                      ['Experience', 14, 20, '#FFCC00'],
                      ['Formatting', 12, 15, '#34C759'],
                      ['Education', 9, 10, '#34C759'],
                    ].map(([k, v, max, color], i) => (
                      <div key={k} className="text-xs">
                        <div className="flex justify-between mb-1 text-[#6B7280]"><span>{k}</span><span className="font-mono">{v}/{max}</span></div>
                        <div className="h-1.5 bg-[#F3F4F6] relative overflow-hidden">
                          <div className="h-full" style={{ width: `${(v/max)*100}%`, background: color, transition: 'width 1.2s ease-out', transitionDelay: `${i * 120 + 400}ms` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Match */}
              <div className="col-span-7 border border-[#E5E5E5] bg-[#0A192F] text-white p-5 hover-lift">
                <div className="eyebrow text-white/50 mb-2">Top Match</div>
                <div className="font-heading font-black text-xl tracking-tighter">Backend Dev</div>
                <div className="text-xs text-white/70">78% match · Bengaluru, Remote</div>
                <div className="mt-3 h-1 bg-white/10"><div className="h-full bg-[#34C759]" style={{ width: '78%' }} /></div>
              </div>
              {/* Salary */}
              <div className="col-span-5 border border-[#E5E5E5] bg-white p-5 hover-lift">
                <div className="eyebrow mb-2">Salary</div>
                <div className="font-heading font-black text-xl tracking-tighter">₹6–12L</div>
                <div className="text-xs text-[#6B7280]">per annum · India</div>
              </div>
              {/* Interview Probability */}
              <div className="col-span-12 border border-[#E5E5E5] bg-white p-4 flex items-center justify-between hover-lift">
                <div>
                  <div className="eyebrow">Interview Probability</div>
                  <div className="font-heading font-black text-2xl tracking-tighter">71%</div>
                </div>
                <div className="flex items-center gap-1 text-xs bg-[#34C759]/10 text-[#34C759] px-2 py-1 font-mono">
                  <TrendingUp className="w-3 h-3" /> +14 vs avg
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO TICKER */}
      <section className="bg-white border-b border-[#E5E5E5] py-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="eyebrow text-center mb-5">Candidates at Job Smartr have landed roles at</div>
          <div className="relative ticker overflow-hidden">
            <div className="flex gap-14 animate-ticker whitespace-nowrap w-max">
              {[...brands, ...brands].map((b, i) => (
                <span key={i} className="font-heading font-bold text-2xl tracking-tighter text-[#0A192F]/40 hover:text-[#0A192F] transition">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#0A192F] text-white border-b border-[#0A192F] relative overflow-hidden">
        <div className="absolute inset-0 grid-lines-dark" />
        <div className="relative max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
          <Stat value={75} suffix="%" label="Resumes fail ATS" />
          <Stat value={3} suffix="×" label="More interview calls" />
          <Stat value={4} suffix="L+" label="Avg. salary boost (₹)" />
          <Stat value={60} suffix="s" label="Upload to insights" />
        </div>
      </section>

      {/* FEATURES - Bento */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div className="mb-14 max-w-3xl">
          <div className="eyebrow mb-3">Everything you need</div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter text-[#0A192F] text-balance">A career intelligence stack — not another resume checker.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Big ATS card */}
          <div className="md:col-span-4 md:row-span-2 border border-[#E5E5E5] bg-white p-8 hover-lift hover-shadow relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-[#0055FF]/5 group-hover:bg-[#0055FF]/10 transition" />
            <Target className="w-8 h-8 text-[#0055FF] mb-5 relative" strokeWidth={2} />
            <h3 className="font-heading font-bold text-2xl mb-2 tracking-tight relative">ATS Scoring Engine</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-md relative">Score out of 100 across keyword match (35), skills (20), experience (20), formatting (15), and education (10). No black box — just transparent math.</p>
            <div className="mt-8 relative grid grid-cols-5 gap-2">
              {[35, 20, 20, 15, 10].map((w, i) => (
                <div key={i} className="border border-[#E5E5E5] p-3">
                  <div className="eyebrow text-[10px]">{['KW','SK','EX','FM','ED'][i]}</div>
                  <div className="font-heading font-black text-xl tracking-tighter mt-1">{w}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <div className="md:col-span-2 border border-[#E5E5E5] bg-white p-6 hover-lift hover-shadow">
            <BarChart3 className="w-7 h-7 text-[#0A192F] mb-4" strokeWidth={2} />
            <h3 className="font-heading font-bold text-lg mb-1 tracking-tight">Resume Heatmap</h3>
            <p className="text-sm text-[#6B7280] mb-4">Color-coded sections: fix red first.</p>
            <div className="space-y-1.5">
              {[['Summary','#34C759'],['Experience','#FFCC00'],['Skills','#34C759'],['Projects','#FF3B30']].map(([n, c]) => (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3" style={{ background: c }} />
                  <span className="font-mono">{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* JD Match */}
          <div className="md:col-span-2 border border-[#E5E5E5] bg-[#0A192F] text-white p-6 hover-lift">
            <Search className="w-7 h-7 text-[#0055FF] mb-4" strokeWidth={2} />
            <h3 className="font-heading font-bold text-lg mb-1 tracking-tight">JD Match</h3>
            <p className="text-sm text-white/60">Paste any JD — get match % and missing keywords.</p>
            <div className="font-heading font-black text-4xl tracking-tighter mt-4 text-[#34C759]">78%</div>
          </div>

          {/* Salary */}
          <div className="md:col-span-3 border border-[#E5E5E5] bg-white p-6 hover-lift hover-shadow">
            <IndianRupee className="w-7 h-7 text-[#34C759] mb-4" strokeWidth={2} />
            <h3 className="font-heading font-bold text-lg mb-1 tracking-tight">India Salary Insights</h3>
            <p className="text-sm text-[#6B7280] mb-4">Realistic ₹ LPA ranges calibrated for the Indian market.</p>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 bg-[#F3F4F6] relative">
                <div className="absolute inset-y-0 bg-[#34C759]" style={{ left: '20%', right: '30%' }} />
              </div>
              <span className="font-heading font-bold text-sm">₹6–12L</span>
            </div>
          </div>

          {/* AI Optimize */}
          <div className="md:col-span-3 border border-[#E5E5E5] bg-white p-6 hover-lift hover-shadow">
            <Sparkles className="w-7 h-7 text-[#0055FF] mb-4" strokeWidth={2} />
            <h3 className="font-heading font-bold text-lg mb-1 tracking-tight">AI Resume Optimize</h3>
            <p className="text-sm text-[#6B7280] mb-4">One-click rewrite — stronger verbs, metrics, missing keywords woven in.</p>
            <div className="font-mono text-xs text-[#6B7280] bg-[#FAFAFA] border border-[#E5E5E5] p-3">
              <span className="line-through text-[#FF3B30]/60">Worked on backend stuff</span><br/>
              <span className="text-[#34C759]">→ Architected FastAPI services handling 50K req/day</span>
            </div>
          </div>

          {/* Skill Gap */}
          <div className="md:col-span-2 border border-[#E5E5E5] bg-white p-6 hover-lift hover-shadow">
            <TrendingUp className="w-7 h-7 text-[#0A192F] mb-4" strokeWidth={2} />
            <h3 className="font-heading font-bold text-lg mb-1 tracking-tight">Skill Gap</h3>
            <p className="text-sm text-[#6B7280]">Which skills unlock the next salary band?</p>
          </div>

          {/* Interview Probability */}
          <div className="md:col-span-2 border border-[#E5E5E5] bg-white p-6 hover-lift hover-shadow">
            <ShieldCheck className="w-7 h-7 text-[#34C759] mb-4" strokeWidth={2} />
            <h3 className="font-heading font-bold text-lg mb-1 tracking-tight">Interview Probability</h3>
            <p className="text-sm text-[#6B7280]">ATS × 0.6 + JD Match × 0.4.</p>
          </div>

          {/* Speed */}
          <div className="md:col-span-2 border border-[#E5E5E5] bg-[#0055FF] text-white p-6 hover-lift">
            <Clock className="w-7 h-7 text-white mb-4" strokeWidth={2} />
            <h3 className="font-heading font-bold text-lg mb-1 tracking-tight">60-Second Results</h3>
            <p className="text-sm text-white/80">From upload to actionable insights.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-y border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <div className="eyebrow mb-3">How it works</div>
            <h2 className="font-heading font-black text-4xl lg:text-5xl tracking-tighter">Four steps from upload to interview.</h2>
            <p className="text-sm text-[#6B7280] mt-4">No courses. No coaches. Just decisive, actionable signals.</p>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { n: '01', i: FileCheck, t: 'Upload Resume', d: 'PDF or DOCX. We extract and structure your content.' },
              { n: '02', i: BrainCircuit, t: 'AI Analysis', d: 'Claude-powered ATS scoring, parsing and heatmap.' },
              { n: '03', i: Layers, t: 'Match & Salary', d: 'Recommended roles with match % and India ₹ LPA ranges.' },
              { n: '04', i: Rocket, t: 'Optimize', d: 'One-click resume optimization to lift your ATS score.' },
            ].map((s, idx) => (
              <div key={s.n} className="border border-[#E5E5E5] p-6 hover-lift hover-shadow group" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="font-mono text-sm text-[#0055FF]">{s.n}</div>
                  <s.i className="w-5 h-5 text-[#0A192F] opacity-60 group-hover:opacity-100 transition" strokeWidth={2} />
                </div>
                <h4 className="font-heading font-bold text-xl mb-2">{s.t}</h4>
                <p className="text-sm text-[#6B7280]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="eyebrow mb-3">Used by candidates across India</div>
        <h2 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter mb-12 max-w-3xl text-balance">From the shortlist to the offer letter — in weeks.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              q: 'Went from 4 ATS rejections to 3 interviews in one week. The missing keywords list alone was worth it.',
              n: 'Rahul M.', r: 'Backend Engineer · Bengaluru',
              img: 'https://images.pexels.com/photos/7580940/pexels-photo-7580940.jpeg', accent: '#0055FF',
            },
            {
              q: 'The salary insights helped me negotiate ₹3.5L more. Optimize button rewrote my bullets beautifully.',
              n: 'Priya S.', r: 'Product Analyst · Gurugram',
              img: 'https://images.pexels.com/photos/7580822/pexels-photo-7580822.jpeg', accent: '#34C759',
            },
            {
              q: 'As a fresher, the skill gap analysis told me exactly what to learn first. Landed 2 internships in a month.',
              n: 'Aditya K.', r: 'CS Student · Pune',
              img: 'https://images.pexels.com/photos/5453822/pexels-photo-5453822.jpeg', accent: '#FFCC00',
            },
          ].map((t, i) => (
            <div key={i} className="border border-[#E5E5E5] bg-white p-8 hover-lift hover-shadow relative">
              <div className="absolute top-0 left-0 w-1 h-16" style={{ background: t.accent }} />
              <div className="flex gap-0.5 mb-4">
                {[0,1,2,3,4].map((s) => <Star key={s} className="w-3.5 h-3.5 fill-[#FFCC00] text-[#FFCC00]" />)}
              </div>
              <p className="font-heading text-xl leading-snug tracking-tight text-[#0A192F]">“{t.q}”</p>
              <div className="mt-6 flex items-center gap-3">
                <img src={t.img} alt={t.n} className="w-10 h-10 object-cover" />
                <div>
                  <div className="font-semibold text-sm">{t.n}</div>
                  <div className="text-xs text-[#6B7280]">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-y border-[#E5E5E5]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
          <div className="eyebrow mb-3">FAQ</div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter mb-10">Everything you wanted to ask.</h2>
          <Accordion type="single" collapsible className="border-t border-[#E5E5E5]">
            {[
              { q: 'Is the free plan really free?', a: 'Yes. 2 full scans with ATS score, heatmap and job recommendations — no credit card required.' },
              { q: 'Which AI powers the analysis?', a: 'Claude Sonnet 4.5 by Anthropic, tuned for structured career analysis and Indian job context.' },
              { q: 'Do you support fresher resumes?', a: 'Absolutely. Our engine weights projects and education heavily for freshers and calibrates salary ranges for entry-level roles.' },
              { q: 'Is my resume data secure?', a: 'All uploads are scoped to your user account, protected by JWT authentication, and never shared with third parties.' },
              { q: 'What file formats are supported?', a: 'PDF and DOCX. We extract text server-side using pypdf and python-docx.' },
              { q: 'How does the affiliate program work?', a: 'Become an affiliate for free, share your link, and earn 30% recurring commission on every Pro (₹399) or Premium (₹999) subscription — forever.' },
            ].map((f, i) => (
              <AccordionItem key={i} value={`q${i}`} className="border-b border-[#E5E5E5]">
                <AccordionTrigger className="text-left font-heading font-bold text-lg tracking-tight hover:text-[#0055FF] py-5" data-testid={`faq-${i}`}>{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-[#6B7280] leading-relaxed pb-5">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0A192F] text-white relative overflow-hidden">
        <div className="absolute inset-0 grid-lines-dark" />
        <div className="absolute -right-40 -bottom-40 w-[520px] h-[520px] rounded-full bg-[#0055FF] opacity-20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
          <div>
            <div className="eyebrow text-white/60 mb-3">Start free</div>
            <h2 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl tracking-tighter text-balance max-w-3xl leading-[0.95]">
              2 free scans.<br/>Upgrade to <span className="text-[#34C759]">Pro</span> at <span className="text-[#0055FF]">₹399/mo</span> for unlimited.
            </h2>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/signup')} className="btn-primary text-base" data-testid="bottom-cta-signup">
              Start Free <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
            <Button onClick={() => navigate('/pricing')} className="bg-white text-[#0A192F] hover:bg-white/90 rounded-md px-6 py-3 font-semibold" data-testid="bottom-cta-pricing">See plans</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
