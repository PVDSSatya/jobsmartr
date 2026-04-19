"""End-to-end backend tests for Job Smartr API.
Covers: health, auth (signup/login/reset/me), resume upload/analyze, job-match,
dashboard, affiliate, subscription upgrade, referral commission attribution.
"""
import io
import time
import pytest
import requests
from conftest import API, _make_pdf_bytes, SAMPLE_RESUME_TEXT

LONG_TIMEOUT = 120  # for AI calls


# ---------------- Health ----------------
class TestHealth:
    def test_root(self, http):
        r = http.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"


# ---------------- Auth ----------------
class TestAuth:
    def test_signup_returns_token_and_user(self, signup_user, unique_email):
        assert signup_user["token"]
        assert signup_user["user"]["email"] == unique_email
        assert signup_user["user"]["plan"] == "free"
        assert signup_user["user"]["scans_used"] == 0

    def test_signup_duplicate_rejected(self, http, unique_email):
        r = http.post(f"{API}/auth/signup", json={"name": "Dup", "email": unique_email, "password": "x"}, timeout=20)
        assert r.status_code == 400

    def test_login_success(self, http, unique_email, signup_user):
        r = http.post(f"{API}/auth/login", json={"email": unique_email, "password": signup_user["password"]}, timeout=20)
        assert r.status_code == 200
        assert "token" in r.json()

    def test_login_wrong_password(self, http, unique_email):
        r = http.post(f"{API}/auth/login", json={"email": unique_email, "password": "wrong"}, timeout=20)
        assert r.status_code == 401

    def test_me_requires_token(self, http):
        r = http.get(f"{API}/auth/me", timeout=15)
        assert r.status_code in (401, 403)

    def test_me_with_token(self, http, auth_headers, unique_email):
        r = http.get(f"{API}/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == unique_email

    def test_reset_password_silent_when_email_missing(self, http):
        r = http.post(f"{API}/auth/reset-password",
                      json={"email": f"nonexistent_{int(time.time())}@none.com", "new_password": "abc12345"},
                      timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_reset_password_real_user(self, http, unique_email, signup_user):
        new_pw = "newpass4567"
        r = http.post(f"{API}/auth/reset-password", json={"email": unique_email, "new_password": new_pw}, timeout=20)
        assert r.status_code == 200
        # login with new pw
        lr = http.post(f"{API}/auth/login", json={"email": unique_email, "password": new_pw}, timeout=20)
        assert lr.status_code == 200
        # restore original password for downstream tests
        http.post(f"{API}/auth/reset-password",
                  json={"email": unique_email, "new_password": signup_user["password"]}, timeout=20)


# ---------------- Resume Upload ----------------
class TestResumeUpload:
    def test_upload_requires_auth(self, http, sample_pdf):
        r = http.post(f"{API}/resumes/upload",
                      files={"file": ("r.pdf", sample_pdf, "application/pdf")}, timeout=30)
        assert r.status_code in (401, 403)

    def test_upload_rejects_txt(self, http, auth_headers):
        r = http.post(f"{API}/resumes/upload",
                      files={"file": ("r.txt", b"hello world " * 20, "text/plain")},
                      headers=auth_headers, timeout=30)
        assert r.status_code == 400

    def test_upload_pdf_success(self, http, auth_headers, sample_pdf, request):
        r = http.post(f"{API}/resumes/upload",
                      files={"file": ("resume.pdf", sample_pdf, "application/pdf")},
                      headers=auth_headers, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] and data["filename"] == "resume.pdf"
        assert data["text_length"] > 100
        # stash resume_id on session
        request.session._resume_id = data["id"]

    def test_upload_docx_success(self, http, auth_headers, request):
        from docx import Document
        doc = Document()
        for line in SAMPLE_RESUME_TEXT.split("\n"):
            doc.add_paragraph(line)
        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        r = http.post(f"{API}/resumes/upload",
                      files={"file": ("resume.docx", buf.read(),
                                       "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
                      headers=auth_headers, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"]
        request.session._docx_resume_id = data["id"]


# ---------------- Resume Analyze (AI) ----------------
class TestAnalyze:
    def test_analyze_resume(self, http, auth_headers, request):
        resume_id = getattr(request.session, "_resume_id", None)
        assert resume_id, "Upload test must run before analyze"
        r = http.post(f"{API}/resumes/{resume_id}/analyze", headers=auth_headers, timeout=LONG_TIMEOUT)
        assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
        data = r.json()
        assert "analysis" in data
        a = data["analysis"]
        assert "ats" in a and "total" in a["ats"] and "breakdown" in a["ats"]
        assert "heatmap" in a and isinstance(a["heatmap"], list) and len(a["heatmap"]) >= 1
        assert "recommended_jobs" in a and len(a["recommended_jobs"]) >= 1
        job = a["recommended_jobs"][0]
        assert "salary_min_lpa" in job and "salary_max_lpa" in job
        assert "interview_probability" in data
        request.session._ats_total = a["ats"]["total"]

    def test_list_resumes_includes_ats(self, http, auth_headers):
        r = http.get(f"{API}/resumes", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 1
        analyzed = [x for x in items if x.get("ats_total") is not None]
        assert analyzed, "Expected at least one analyzed resume with ats_total"

    def test_get_resume_user_isolation(self, http, auth_headers, request):
        # Create second user and confirm they cannot fetch first user's resume
        email2 = f"test_iso_{int(time.time())}@jobsmartr.com"
        s = http.post(f"{API}/auth/signup",
                      json={"name": "Iso", "email": email2, "password": "pw12345"}, timeout=20)
        assert s.status_code == 200
        other_token = s.json()["token"]
        r = http.get(f"{API}/resumes/{request.session._resume_id}",
                     headers={"Authorization": f"Bearer {other_token}"}, timeout=20)
        assert r.status_code == 404


# ---------------- Job Match ----------------
class TestJobMatch:
    def test_job_match(self, http, auth_headers, request):
        resume_id = getattr(request.session, "_resume_id", None)
        assert resume_id
        jd = ("Looking for a Senior Python Engineer with FastAPI, AWS, Kubernetes, "
              "MongoDB experience. Must have 5+ years. Bengaluru based.")
        r = http.post(f"{API}/job-match",
                      json={"resume_id": resume_id, "job_description": jd},
                      headers=auth_headers, timeout=LONG_TIMEOUT)
        assert r.status_code == 200, r.text[:500]
        data = r.json()
        assert "result" in data
        res = data["result"]
        for k in ("match_score", "matched_keywords", "missing_keywords", "strengths", "gaps", "verdict"):
            assert k in res
        assert "interview_probability" in data


# ---------------- Free plan limits & Optimize gating ----------------
class TestFreeLimitAndOptimize:
    def test_optimize_blocked_on_free(self, http, auth_headers, request):
        resume_id = request.session._resume_id
        r = http.post(f"{API}/resumes/{resume_id}/optimize", headers=auth_headers, timeout=30)
        assert r.status_code == 402

    def test_free_plan_scan_limit(self, http, auth_headers, sample_pdf, request):
        # First analyze already consumed 1 scan. Analyze docx resume to consume 2nd scan.
        docx_id = getattr(request.session, "_docx_resume_id", None)
        if docx_id:
            r = http.post(f"{API}/resumes/{docx_id}/analyze", headers=auth_headers, timeout=LONG_TIMEOUT)
            assert r.status_code == 200, r.text[:300]
        # Now scans_used should be 2. New upload should be blocked with 402.
        r2 = http.post(f"{API}/resumes/upload",
                       files={"file": ("third.pdf", sample_pdf, "application/pdf")},
                       headers=auth_headers, timeout=30)
        assert r2.status_code == 402, f"Expected 402 got {r2.status_code}: {r2.text[:200]}"


# ---------------- Subscription (mocked) & Optimize ----------------
class TestSubscription:
    def test_upgrade_invalid_plan(self, http, auth_headers):
        r = http.post(f"{API}/subscription/upgrade", json={"plan": "gold"}, headers=auth_headers, timeout=20)
        assert r.status_code == 400

    def test_upgrade_to_pro(self, http, auth_headers):
        r = http.post(f"{API}/subscription/upgrade", json={"plan": "pro"}, headers=auth_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["plan"] == "pro"
        assert data["price_inr"] == 399
        assert data["status"] == "active"

    def test_subscription_get(self, http, auth_headers):
        r = http.get(f"{API}/subscription", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["plan"] == "pro"
        assert data["subscription"] is not None

    def test_optimize_works_after_upgrade(self, http, auth_headers, request):
        resume_id = request.session._resume_id
        r = http.post(f"{API}/resumes/{resume_id}/optimize", headers=auth_headers, timeout=LONG_TIMEOUT)
        assert r.status_code == 200, r.text[:500]
        res = r.json()["result"]
        for k in ("optimized_summary", "rewritten_bullets", "added_keywords", "projected_ats_gain"):
            assert k in res


# ---------------- Dashboard ----------------
class TestDashboard:
    def test_dashboard_after_activity(self, http, auth_headers):
        r = http.get(f"{API}/dashboard", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "user" in data and "stats" in data and "recent_resumes" in data
        assert data["user"]["plan"] == "pro"
        assert data["stats"]["total_scans"] >= 1
        assert data["stats"]["scans_remaining"] == "unlimited"


# ---------------- Affiliate & Referral commission ----------------
class TestAffiliateFlow:
    def test_become_affiliate_idempotent(self, http, auth_headers, request):
        r1 = http.post(f"{API}/affiliate/become", headers=auth_headers, timeout=20)
        assert r1.status_code == 200
        a1 = r1.json()
        assert a1["code"] and a1["user_id"]
        r2 = http.post(f"{API}/affiliate/become", headers=auth_headers, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["code"] == a1["code"]
        request.session._aff_code = a1["code"]

    def test_affiliate_track_click(self, http, request):
        code = request.session._aff_code
        r = http.post(f"{API}/affiliate/track", json={"code": code, "event": "click"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_affiliate_track_invalid_code(self, http):
        r = http.post(f"{API}/affiliate/track", json={"code": "NOSUCHCODE", "event": "click"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is False

    def test_referral_signup_and_commission(self, http, request):
        code = request.session._aff_code
        ref_email = f"test_ref_{int(time.time())}@jobsmartr.com"
        s = http.post(f"{API}/auth/signup",
                      json={"name": "Ref User", "email": ref_email, "password": "refpass1", "referral_code": code},
                      timeout=20)
        assert s.status_code == 200
        ref_token = s.json()["token"]
        # referred user upgrades -> commission should land on affiliate
        up = http.post(f"{API}/subscription/upgrade", json={"plan": "pro"},
                       headers={"Authorization": f"Bearer {ref_token}"}, timeout=20)
        assert up.status_code == 200

        # Check affiliate dashboard of original user
        # Use session token of first user via auth_headers fixture indirectly - reuse http session with aff_code owner token
        # We need first user's token; pull from signup_user fixture via request.getfixturevalue
        owner = request.getfixturevalue("auth_headers")
        d = http.get(f"{API}/affiliate/dashboard", headers=owner, timeout=20)
        assert d.status_code == 200
        data = d.json()
        assert data["affiliate"] is not None
        assert data["affiliate"]["signups"] >= 1
        assert data["affiliate"]["earnings_inr"] >= 399 * 0.30
        assert any(c["plan"] == "pro" for c in data["commissions"])
