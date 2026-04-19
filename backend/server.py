from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import re
import json
import uuid
import bcrypt
import jwt as pyjwt
import logging
import secrets
import asyncio
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

from pypdf import PdfReader
from docx import Document as DocxDocument

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Env
mongo_url = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
JWT_ALG = 'HS256'
JWT_EXP_DAYS = 30
EMERGENT_AUTH_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

client = AsyncIOMotorClient(mongo_url)
db = client[DB_NAME]

app = FastAPI(title="Job Smartr API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# =============== MODELS ===============
class SignupReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    referral_code: Optional[str] = None

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class ResetReq(BaseModel):
    email: EmailStr
    new_password: str

class JobMatchReq(BaseModel):
    resume_id: str
    job_description: str

class AffiliateTrack(BaseModel):
    code: str
    event: str  # "click" | "signup"

class UpgradeReq(BaseModel):
    plan: str  # "pro" | "premium"

class SessionReq(BaseModel):
    session_id: str
    referral_code: Optional[str] = None


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    plan: str = "free"
    scans_used: int = 0
    created_at: str


# =============== AUTH HELPERS ===============
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_user(request: Request):
    # 1) Try Bearer JWT (existing form-login flow)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        try:
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
            uid = payload.get("sub")
            if uid:
                user = await db.users.find_one({"id": uid}, {"_id": 0})
                if user:
                    return user
        except Exception:
            pass  # fall through to cookie auth

    # 2) Try session_token cookie (Emergent Google OAuth)
    session_token = request.cookies.get("session_token")
    if session_token:
        sess = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if sess:
            exp = sess.get("expires_at")
            if isinstance(exp, str):
                try:
                    exp = datetime.fromisoformat(exp)
                except Exception:
                    exp = None
            if exp is not None:
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                if exp >= datetime.now(timezone.utc):
                    user = await db.users.find_one({"id": sess["user_id"]}, {"_id": 0})
                    if user:
                        return user

    raise HTTPException(status_code=401, detail="Not authenticated")


# =============== FILE PARSING ===============
def extract_text_from_pdf(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    except Exception as e:
        logger.error(f"PDF parse error: {e}")
        return ""

def extract_text_from_docx(data: bytes) -> str:
    try:
        doc = DocxDocument(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        logger.error(f"DOCX parse error: {e}")
        return ""


# =============== AI LAYER (Claude Sonnet 4.5) ===============
def _strip_json(text: str) -> str:
    # strip ```json fences if any
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    # extract first JSON object
    first = t.find("{")
    last = t.rfind("}")
    if first != -1 and last != -1 and last > first:
        return t[first:last+1]
    return t

async def _llm_json(system_msg: str, user_text: str, session_id: str) -> Dict[str, Any]:
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system_msg)\
        .with_model("anthropic", "claude-sonnet-4-5-20250929")
    resp = await chat.send_message(UserMessage(text=user_text))
    try:
        return json.loads(_strip_json(resp))
    except Exception as e:
        logger.error(f"LLM JSON parse fail: {e}; raw={resp[:500]}")
        raise HTTPException(status_code=502, detail="AI response parse error")


async def ai_analyze_resume(resume_text: str) -> Dict[str, Any]:
    system = (
        "You are an expert ATS (Applicant Tracking System) and career intelligence analyzer for the Indian job market. "
        "Analyze resumes and return STRICT JSON only. No prose, no markdown fences. All salaries in INR (₹) per year."
    )
    prompt = f"""Analyze the following resume and produce a JSON object with this EXACT schema:

{{
  "parsed": {{
    "name": "string",
    "email": "string",
    "phone": "string",
    "skills": ["string", ...],
    "experience": [{{"role":"string","company":"string","duration":"string","bullets":["string",...]}}],
    "education": [{{"degree":"string","institution":"string","year":"string"}}],
    "projects": [{{"name":"string","description":"string"}}]
  }},
  "ats": {{
    "total": 0,
    "breakdown": {{
      "keyword_match": 0,
      "skills_match": 0,
      "experience_relevance": 0,
      "formatting": 0,
      "education": 0
    }}
  }},
  "heatmap": [
    {{"section":"Summary","status":"green|yellow|red","comment":"string"}},
    {{"section":"Experience","status":"green|yellow|red","comment":"string"}},
    {{"section":"Skills","status":"green|yellow|red","comment":"string"}},
    {{"section":"Education","status":"green|yellow|red","comment":"string"}},
    {{"section":"Projects","status":"green|yellow|red","comment":"string"}},
    {{"section":"Formatting","status":"green|yellow|red","comment":"string"}}
  ],
  "weaknesses": ["string", ...],
  "suggestions": ["string", ...],
  "recommended_jobs": [
    {{"role":"string","match":85,"salary_min_lpa":6,"salary_max_lpa":12,"why":"string"}}
  ],
  "skill_gaps": [{{"skill":"string","reason":"string","unlocks_role":"string"}}],
  "missing_keywords": ["string", ...]
}}

Scoring rules: keyword_match max 35, skills_match max 20, experience_relevance max 20, formatting max 15, education max 10. total is sum. Recommend at least 4 roles with Indian salary ranges (LPA = Lakhs per annum in INR).

RESUME TEXT:
<<<
{resume_text[:12000]}
>>>"""
    return await _llm_json(system, prompt, f"analyze-{uuid.uuid4()}")


async def ai_job_match(resume_text: str, jd: str) -> Dict[str, Any]:
    system = "You are an ATS JD-matching engine. Return STRICT JSON only."
    prompt = f"""Compare this resume against the job description. Return JSON:
{{
  "match_score": 0,
  "matched_keywords": ["string",...],
  "missing_keywords": ["string",...],
  "strengths": ["string",...],
  "gaps": ["string",...],
  "verdict": "string (1-2 sentences)"
}}
Resume:
<<<
{resume_text[:8000]}
>>>

Job Description:
<<<
{jd[:4000]}
>>>"""
    return await _llm_json(system, prompt, f"jdmatch-{uuid.uuid4()}")


async def ai_optimize_resume(resume_text: str, analysis: Dict[str, Any]) -> Dict[str, Any]:
    system = "You are a senior resume coach. Return STRICT JSON only."
    weaknesses = analysis.get("weaknesses", [])
    missing = analysis.get("missing_keywords", [])
    prompt = f"""Rewrite the weakest parts of this resume. Return JSON:
{{
  "optimized_summary": "string (2-3 lines, professional, impact-driven)",
  "rewritten_bullets": [
    {{"original":"string","improved":"string","why":"string"}}
  ],
  "added_keywords": ["string",...],
  "action_verbs_used": ["string",...],
  "projected_ats_gain": 12
}}
Provide 6-10 rewritten bullets. Use strong action verbs, add metrics where reasonable, and weave in missing keywords.

Focus weaknesses: {weaknesses}
Missing keywords to weave in: {missing}

Resume:
<<<
{resume_text[:8000]}
>>>"""
    return await _llm_json(system, prompt, f"opt-{uuid.uuid4()}")


# =============== AUTH ROUTES ===============
@api_router.post("/auth/signup")
async def signup(req: SignupReq):
    existing = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "password_hash": hash_pw(req.password),
        "plan": "free",
        "scans_used": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "referred_by": None,
    }
    # referral attribution
    if req.referral_code:
        aff = await db.affiliates.find_one({"code": req.referral_code.upper()}, {"_id": 0})
        if aff:
            doc["referred_by"] = aff["user_id"]
            await db.referrals.insert_one({
                "id": str(uuid.uuid4()),
                "affiliate_user_id": aff["user_id"],
                "referred_user_id": user_id,
                "code": aff["code"],
                "signup_at": datetime.now(timezone.utc).isoformat(),
            })
            await db.affiliates.update_one({"user_id": aff["user_id"]}, {"$inc": {"signups": 1}})
    await db.users.insert_one(doc)
    token = make_token(user_id)
    return {
        "token": token,
        "user": {"id": user_id, "name": doc["name"], "email": doc["email"], "plan": "free", "scans_used": 0, "created_at": doc["created_at"]},
    }


@api_router.post("/auth/login")
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Explicitly block password login for OAuth-only accounts (password_hash == "")
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="This account uses Google sign-in. Please continue with Google.")
    if not verify_pw(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_token(user["id"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "plan": user.get("plan", "free"), "scans_used": user.get("scans_used", 0), "created_at": user["created_at"]},
    }


@api_router.post("/auth/reset-password")
async def reset_password(req: ResetReq):
    user = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if not user:
        # Do not reveal existence
        return {"ok": True, "message": "If the account exists, password has been reset."}
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_pw(req.new_password)}})
    return {"ok": True, "message": "Password has been reset. Please login."}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"], "plan": user.get("plan", "free"), "scans_used": user.get("scans_used", 0), "created_at": user["created_at"]}


# =============== GOOGLE OAUTH (Emergent Managed) ===============
@api_router.post("/auth/session")
async def auth_session(req: SessionReq, response: Response):
    """Exchange Emergent session_id for a persistent server session + cookie."""
    # Call Emergent to resolve the session_id into user data + session_token
    try:
        async with httpx.AsyncClient(timeout=15.0) as hc:
            r = await hc.get(EMERGENT_AUTH_SESSION_URL, headers={"X-Session-ID": req.session_id})
    except Exception as e:
        logger.error(f"Emergent auth call failed: {e}")
        raise HTTPException(status_code=502, detail="Auth provider unreachable")

    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = (data.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="No email from provider")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "name": data.get("name") or email.split("@")[0],
            "email": email,
            "password_hash": "",  # OAuth users have no password
            "plan": "free",
            "scans_used": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "referred_by": None,
            "picture": data.get("picture"),
            "auth_provider": "google",
        }
        # Referral attribution
        if req.referral_code:
            aff = await db.affiliates.find_one({"code": req.referral_code.upper()}, {"_id": 0})
            if aff:
                user_doc["referred_by"] = aff["user_id"]
                await db.referrals.insert_one({
                    "id": str(uuid.uuid4()),
                    "affiliate_user_id": aff["user_id"],
                    "referred_user_id": user_id,
                    "code": aff["code"],
                    "signup_at": datetime.now(timezone.utc).isoformat(),
                })
                await db.affiliates.update_one({"user_id": aff["user_id"]}, {"$inc": {"signups": 1}})
        await db.users.insert_one(user_doc)
        user = user_doc
    else:
        # Link provider info if missing
        updates = {}
        if not user.get("picture") and data.get("picture"):
            updates["picture"] = data["picture"]
        if not user.get("auth_provider"):
            updates["auth_provider"] = "google"
        if updates:
            await db.users.update_one({"id": user["id"]}, {"$set": updates})

    # Persist session
    session_token = data.get("session_token")
    if not session_token:
        raise HTTPException(status_code=502, detail="Provider missing session_token")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )

    return {
        "user": {
            "id": user["id"], "name": user["name"], "email": user["email"],
            "plan": user.get("plan", "free"), "scans_used": user.get("scans_used", 0),
            "created_at": user["created_at"],
        }
    }


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# =============== RESUME ROUTES ===============
@api_router.post("/resumes/upload")
async def upload_resume(file: UploadFile = File(...), user=Depends(get_current_user)):
    # Plan check
    plan = user.get("plan", "free")
    used = user.get("scans_used", 0)
    if plan == "free" and used >= 2:
        raise HTTPException(status_code=402, detail="Free plan limit reached. Upgrade to Pro for unlimited scans.")

    data = await file.read()
    name = (file.filename or "resume").lower()
    if name.endswith(".pdf"):
        text = extract_text_from_pdf(data)
    elif name.endswith(".docx"):
        text = extract_text_from_docx(data)
    else:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX supported")
    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract readable text from file")

    resume_id = str(uuid.uuid4())
    doc = {
        "id": resume_id,
        "user_id": user["id"],
        "filename": file.filename,
        "text": text,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "uploaded",
    }
    await db.resumes.insert_one(doc)
    return {"id": resume_id, "filename": file.filename, "text_length": len(text), "status": "uploaded"}


@api_router.post("/resumes/{resume_id}/analyze")
async def analyze_resume(resume_id: str, user=Depends(get_current_user)):
    resume = await db.resumes.find_one({"id": resume_id, "user_id": user["id"]}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # If cached analysis exists return it
    existing = await db.analyses.find_one({"resume_id": resume_id, "user_id": user["id"]}, {"_id": 0})
    if existing:
        return existing

    analysis = await ai_analyze_resume(resume["text"])
    interview_prob = round(analysis.get("ats", {}).get("total", 0) * 0.6 + 50 * 0.4, 1)
    analysis_doc = {
        "id": str(uuid.uuid4()),
        "resume_id": resume_id,
        "user_id": user["id"],
        "analysis": analysis,
        "interview_probability": interview_prob,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.analyses.insert_one(analysis_doc)
    await db.resumes.update_one({"id": resume_id}, {"$set": {"status": "analyzed"}})
    await db.users.update_one({"id": user["id"]}, {"$inc": {"scans_used": 1}})
    analysis_doc.pop("_id", None)
    return analysis_doc


@api_router.get("/resumes")
async def list_resumes(user=Depends(get_current_user)):
    items = await db.resumes.find({"user_id": user["id"]}, {"_id": 0, "text": 0}).sort("created_at", -1).to_list(100)
    # enrich with ats score if analyzed
    for r in items:
        a = await db.analyses.find_one({"resume_id": r["id"]}, {"_id": 0, "analysis.ats": 1, "interview_probability": 1})
        r["ats_total"] = (a or {}).get("analysis", {}).get("ats", {}).get("total") if a else None
        r["interview_probability"] = (a or {}).get("interview_probability") if a else None
    return items


@api_router.get("/resumes/{resume_id}")
async def get_resume(resume_id: str, user=Depends(get_current_user)):
    resume = await db.resumes.find_one({"id": resume_id, "user_id": user["id"]}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    analysis = await db.analyses.find_one({"resume_id": resume_id}, {"_id": 0})
    return {"resume": resume, "analysis": analysis}


@api_router.post("/job-match")
async def job_match(req: JobMatchReq, user=Depends(get_current_user)):
    if user.get("plan", "free") == "free" and user.get("scans_used", 0) >= 2:
        raise HTTPException(status_code=402, detail="Upgrade to Pro for unlimited job matches")
    resume = await db.resumes.find_one({"id": req.resume_id, "user_id": user["id"]}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    result = await ai_job_match(resume["text"], req.job_description)
    # Also compute interview prob with ATS
    analysis = await db.analyses.find_one({"resume_id": req.resume_id}, {"_id": 0})
    ats_total = (analysis or {}).get("analysis", {}).get("ats", {}).get("total", 50)
    interview_prob = round(ats_total * 0.6 + result.get("match_score", 0) * 0.4, 1)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "resume_id": req.resume_id,
        "job_description": req.job_description[:500],
        "result": result,
        "interview_probability": interview_prob,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.job_matches.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/resumes/{resume_id}/optimize")
async def optimize_resume(resume_id: str, user=Depends(get_current_user)):
    if user.get("plan", "free") == "free":
        raise HTTPException(status_code=402, detail="AI Resume Optimization is a Pro feature. Please upgrade.")
    resume = await db.resumes.find_one({"id": resume_id, "user_id": user["id"]}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    analysis = await db.analyses.find_one({"resume_id": resume_id}, {"_id": 0})
    analysis_payload = (analysis or {}).get("analysis", {})
    result = await ai_optimize_resume(resume["text"], analysis_payload)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "resume_id": resume_id,
        "result": result,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.optimizations.insert_one(doc)
    doc.pop("_id", None)
    return doc


# =============== DASHBOARD ===============
@api_router.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    resumes = await db.resumes.find({"user_id": user["id"]}, {"_id": 0, "text": 0}).sort("created_at", -1).to_list(20)
    # attach ats
    recent = []
    best_ats = 0
    for r in resumes:
        a = await db.analyses.find_one({"resume_id": r["id"]}, {"_id": 0})
        ats_total = (a or {}).get("analysis", {}).get("ats", {}).get("total")
        interview_prob = (a or {}).get("interview_probability")
        r["ats_total"] = ats_total
        r["interview_probability"] = interview_prob
        if ats_total and ats_total > best_ats:
            best_ats = ats_total
        recent.append(r)
    total_scans = len(resumes)
    return {
        "user": {
            "id": user["id"], "name": user["name"], "email": user["email"],
            "plan": user.get("plan", "free"), "scans_used": user.get("scans_used", 0),
        },
        "recent_resumes": recent[:10],
        "stats": {
            "total_scans": total_scans,
            "best_ats_score": best_ats,
            "scans_remaining": ("unlimited" if user.get("plan", "free") != "free" else max(0, 2 - user.get("scans_used", 0))),
        },
    }


# =============== AFFILIATE ===============
def gen_code():
    return secrets.token_hex(4).upper()

@api_router.post("/affiliate/become")
async def become_affiliate(user=Depends(get_current_user)):
    existing = await db.affiliates.find_one({"user_id": user["id"]}, {"_id": 0})
    if existing:
        return existing
    code = gen_code()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "code": code,
        "clicks": 0,
        "signups": 0,
        "earnings_inr": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.affiliates.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/affiliate/dashboard")
async def affiliate_dashboard(user=Depends(get_current_user)):
    aff = await db.affiliates.find_one({"user_id": user["id"]}, {"_id": 0})
    if not aff:
        return {"affiliate": None, "referrals": [], "commissions": []}
    referrals = await db.referrals.find({"affiliate_user_id": user["id"]}, {"_id": 0}).sort("signup_at", -1).to_list(200)
    commissions = await db.commissions.find({"affiliate_user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"affiliate": aff, "referrals": referrals, "commissions": commissions}


@api_router.post("/affiliate/track")
async def affiliate_track(req: AffiliateTrack):
    aff = await db.affiliates.find_one({"code": req.code.upper()}, {"_id": 0})
    if not aff:
        return {"ok": False}
    if req.event == "click":
        await db.affiliates.update_one({"code": req.code.upper()}, {"$inc": {"clicks": 1}})
    return {"ok": True}


# =============== SUBSCRIPTION (mocked) ===============
PLAN_PRICES = {"pro": 399, "premium": 999}

@api_router.post("/subscription/upgrade")
async def upgrade(req: UpgradeReq, user=Depends(get_current_user)):
    if req.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")
    await db.users.update_one({"id": user["id"]}, {"$set": {"plan": req.plan}})
    sub_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "plan": req.plan,
        "price_inr": PLAN_PRICES[req.plan],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "mock": True,
    }
    await db.subscriptions.insert_one(sub_doc)

    # 30% recurring commission to referrer
    refby = user.get("referred_by")
    if refby:
        commission = round(PLAN_PRICES[req.plan] * 0.30, 2)
        await db.commissions.insert_one({
            "id": str(uuid.uuid4()),
            "affiliate_user_id": refby,
            "referred_user_id": user["id"],
            "plan": req.plan,
            "amount_inr": commission,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.affiliates.update_one({"user_id": refby}, {"$inc": {"earnings_inr": commission}})
    sub_doc.pop("_id", None)
    return sub_doc


@api_router.get("/subscription")
async def get_subscription(user=Depends(get_current_user)):
    sub = await db.subscriptions.find_one({"user_id": user["id"], "status": "active"}, {"_id": 0}, sort=[("created_at", -1)])
    return {"plan": user.get("plan", "free"), "subscription": sub}


# =============== HEALTH ===============
@api_router.get("/")
async def root():
    return {"message": "Job Smartr API", "status": "ok"}


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
