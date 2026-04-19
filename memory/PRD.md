# Job Smartr — Product Requirements Document

## Problem Statement (Original)
Build "Job Smartr" — an AI-powered career intelligence SaaS that helps users analyze resumes (ATS scoring), optimize them with AI, match against job descriptions, discover recommended roles, estimate salary ranges (India/₹ LPA focused), identify skill gaps, and improve interview probability. Includes affiliate system (30% recurring commission) and subscription plans (Free / Pro ₹399/mo / Premium ₹999/mo).

## User Personas
- **Active Job Seeker** (primary): recently laid off or unhappy in current role; uploads resume, runs ATS scan, compares against JDs, optimizes resume.
- **Passive Candidate** exploring market: wants salary benchmarks and role recommendations.
- **Student / Fresher**: needs ATS-friendly resume + skill gap insights.
- **Career Coach / Creator** (affiliate): shares referral link and earns recurring commissions.

## Architecture
- **Frontend**: React 19 + React Router 7 + TailwindCSS + Shadcn UI + Recharts + Lucide icons. Sonner for toasts. Cabinet Grotesk / Satoshi fonts via Fontshare.
- **Backend**: FastAPI + Motor (MongoDB async) + JWT auth (PyJWT + bcrypt) + pypdf / python-docx for parsing.
- **AI Layer**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via `emergentintegrations` library + `EMERGENT_LLM_KEY`. Strict JSON output.
- **DB**: MongoDB collections — users, resumes, analyses, job_matches, optimizations, affiliates, referrals, commissions, subscriptions.
- **Payments**: **MOCKED** (flag in `subscriptions.mock=True`). Upgrades instantly flip `user.plan`. Real Stripe/Razorpay integration is a Phase 2 item.

## Core Requirements (Static)
1. JWT auth (signup/login/reset/me)
2. Resume upload (PDF/DOCX) + text extraction
3. ATS scoring out of 100 (keyword 35 / skills 20 / experience 20 / formatting 15 / education 10)
4. Resume heatmap (green/yellow/red)
5. Job description match (%, missing keywords)
6. Recommended roles with India ₹ LPA salary ranges
7. Skill gap analysis
8. Interview Probability = ATS × 0.6 + JobMatch × 0.4
9. AI Resume Optimization (rewritten bullets, summary, added keywords)
10. Affiliate system with 30% recurring commission, referral tracking
11. Subscription plans (Free 2 scans, Pro ₹399, Premium ₹999)
12. User-level data isolation + secure Bearer token authentication

## What's Been Implemented (2026-02)
- **Backend (/app/backend/server.py)**
  - Auth: `/api/auth/signup`, `/api/auth/login`, `/api/auth/reset-password`, `/api/auth/me` (JWT + bcrypt)
  - Resumes: `/api/resumes/upload` (multipart PDF/DOCX), `/api/resumes/{id}/analyze`, `/api/resumes`, `/api/resumes/{id}`
  - Job Match: `/api/job-match` (resume_id + JD → match % + missing keywords + interview probability)
  - Optimize: `/api/resumes/{id}/optimize` (Pro-gated)
  - Dashboard: `/api/dashboard`
  - Affiliate: `/api/affiliate/become`, `/api/affiliate/dashboard`, `/api/affiliate/track`
  - Subscription: `/api/subscription/upgrade`, `/api/subscription`
  - Free plan enforces 2-scan limit (402 on exceed); optimize is Pro-gated
  - Referral attribution + automatic 30% commission record on upgrade
- **Frontend**
  - Landing (/) with hero, ATS snapshot mock, stats, features, how-it-works, testimonials, pricing teaser
  - Auth: /login /signup /reset-password (referral code capture from ?ref=)
  - /dashboard with stats, previous scans, subscription card
  - /upload with drag-drop PDF/DOCX
  - /results/:id with circular ATS ring, Recharts breakdown bar chart, heatmap, missing keywords, suggestions, one-click Optimize panel
  - /results/:id/job-match with JD paste & match visualization
  - /results/:id/insights with recommended jobs (₹ LPA) + skill gaps
  - /affiliate marketing page, /affiliate/dashboard with link copy + earnings
  - /pricing with 3 plan cards + mock upgrade flow
  - /profile
- **Design system**: Swiss High-Contrast archetype, Cabinet Grotesk + Satoshi fonts, sharp borders, no gradients, color-functional (blue primary, green accent, red warnings). Zero emoji icons — only Lucide React.
- **Testing**: 28 backend test cases passing at 100% (auth, upload, AI analyze, job match, optimize, affiliate, commission, plan gating, user isolation).

## Prioritized Backlog
**P1 — high value next**
- Real payment integration (Stripe or Razorpay for India)
- Resume download/export (optimized version as PDF)
- Social sign-in (Emergent-managed Google Auth)
- Email verification + real password-reset via email link
**P2 — nice to have**
- Resume Builder (templates) for Premium plan
- Multi-resume comparison
- Interview prep questions generated per role
- Admin dashboard for affiliate payouts
- Rate limiting + caching for AI calls

## Next Tasks
1. Wire up Stripe or Razorpay for real subscriptions
2. Add email delivery (Resend/SendGrid) for password-reset + welcome flows
3. Build Resume Builder module for Premium tier
4. Add analytics for funnel tracking
