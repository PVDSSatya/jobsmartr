"""
OAuth session-token auth tests for Job Smartr.

Covers the NEW Emergent-managed Google OAuth layer added on top of the
existing JWT/email+password auth:
  - POST /api/auth/session  (exchange session_id -> cookie)
  - POST /api/auth/logout   (idempotent cookie clear)
  - GET  /api/auth/me       (now also resolves session_token cookie)
  - Bearer + cookie fallback behavior

Because we cannot generate real Emergent session_ids in tests, we simulate
the upstream result by directly inserting records into the `user_sessions`
collection (as documented in /app/auth_testing.md).
"""
import os
import time
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
from dotenv import dotenv_values

from conftest import API

# --- Mongo (sync) for direct seed of users + user_sessions ---
_backend_env = dotenv_values("/app/backend/.env")
MONGO_URL = _backend_env.get("MONGO_URL", os.environ.get("MONGO_URL"))
DB_NAME = _backend_env.get("DB_NAME", os.environ.get("DB_NAME"))
assert MONGO_URL and DB_NAME, "MONGO_URL / DB_NAME not found in /app/backend/.env"

_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


# ----------------- helpers -----------------
def _seed_oauth_user_and_session(expires_in_seconds: int = 7 * 24 * 3600):
    """Insert a fresh user + session directly into Mongo. Returns (user_id, session_token, email)."""
    ts = int(time.time() * 1000)
    user_id = f"TEST_oauth_user_{ts}_{uuid.uuid4().hex[:6]}"
    session_token = f"TEST_session_{ts}_{uuid.uuid4().hex}"
    email = f"test_oauth_{ts}@jobsmartr.com"

    _db.users.insert_one({
        "id": user_id,
        "email": email,
        "name": "OAuth Tester",
        "password_hash": "",
        "plan": "free",
        "scans_used": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "auth_provider": "google",
        "picture": "https://example.com/pic.png",
        "referred_by": None,
    })
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
    _db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return user_id, session_token, email


@pytest.fixture
def oauth_session():
    uid, token, email = _seed_oauth_user_and_session()
    yield {"user_id": uid, "session_token": token, "email": email}
    _db.users.delete_one({"id": uid})
    _db.user_sessions.delete_many({"user_id": uid})


@pytest.fixture
def expired_oauth_session():
    uid, token, email = _seed_oauth_user_and_session(expires_in_seconds=-3600)
    yield {"user_id": uid, "session_token": token, "email": email}
    _db.users.delete_one({"id": uid})
    _db.user_sessions.delete_many({"user_id": uid})


# ==================================================================
# POST /api/auth/session  (Emergent session_id exchange)
# ==================================================================
class TestAuthSessionEndpoint:
    def test_session_missing_session_id_returns_422(self, http):
        r = http.post(f"{API}/auth/session", json={}, timeout=15)
        assert r.status_code == 422, f"expected 422 got {r.status_code}: {r.text[:200]}"

    def test_session_invalid_session_id_returns_401(self, http):
        # A random session_id will hit Emergent -> 401/4xx upstream -> our endpoint => 401
        r = http.post(
            f"{API}/auth/session",
            json={"session_id": f"invalid_test_session_{uuid.uuid4().hex}"},
            timeout=30,
        )
        assert r.status_code in (401, 502), f"expected 401 (or 502 if upstream unreachable), got {r.status_code}: {r.text[:200]}"
        # Per acceptance criteria must specifically be 401 when upstream rejects
        if r.status_code == 502:
            pytest.skip("Emergent upstream unreachable in this environment; 401 path not exercised.")
        assert r.status_code == 401


# ==================================================================
# POST /api/auth/logout  (idempotent cookie clear)
# ==================================================================
class TestAuthLogout:
    def test_logout_without_cookie_returns_200(self, http):
        r = http.post(f"{API}/auth/logout", timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

    def test_logout_with_cookie_deletes_session(self, oauth_session):
        s = requests.Session()
        s.cookies.set("session_token", oauth_session["session_token"])
        r = s.post(f"{API}/auth/logout", timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True
        # Session row should be removed from Mongo
        leftover = _db.user_sessions.find_one({"session_token": oauth_session["session_token"]})
        assert leftover is None, "Session record should have been deleted on logout"


# ==================================================================
# GET /api/auth/me  -- cookie path + fallback behavior
# ==================================================================
class TestAuthMeWithCookie:
    def test_me_with_valid_session_cookie(self, http, oauth_session):
        r = http.get(
            f"{API}/auth/me",
            headers={"Cookie": f"session_token={oauth_session['session_token']}"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] == oauth_session["user_id"]
        assert data["email"] == oauth_session["email"]
        assert data["plan"] == "free"

    def test_me_with_expired_session_cookie_returns_401(self, http, expired_oauth_session):
        r = http.get(
            f"{API}/auth/me",
            headers={"Cookie": f"session_token={expired_oauth_session['session_token']}"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_me_with_no_auth_returns_401(self, http):
        r = http.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_invalid_bearer_and_no_cookie_returns_401(self, http):
        r = http.get(
            f"{API}/auth/me",
            headers={"Authorization": "Bearer this.is.not.a.valid.jwt"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_me_invalid_bearer_but_valid_cookie_falls_back_to_cookie(self, http, oauth_session):
        r = http.get(
            f"{API}/auth/me",
            headers={
                "Authorization": "Bearer invalid.jwt.token",
                "Cookie": f"session_token={oauth_session['session_token']}",
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["id"] == oauth_session["user_id"]

    def test_me_with_unknown_session_cookie_returns_401(self, http):
        r = http.get(
            f"{API}/auth/me",
            headers={"Cookie": f"session_token=definitely_not_a_real_token_{uuid.uuid4().hex}"},
            timeout=15,
        )
        assert r.status_code == 401


# ==================================================================
# Protected endpoints reachable with COOKIE (regression for new auth path)
# ==================================================================
class TestProtectedEndpointsViaCookie:
    def test_dashboard_via_cookie(self, http, oauth_session):
        r = http.get(
            f"{API}/dashboard",
            headers={"Cookie": f"session_token={oauth_session['session_token']}"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["id"] == oauth_session["user_id"]
        assert data["user"]["plan"] == "free"
        assert "stats" in data and "recent_resumes" in data

    def test_become_affiliate_via_cookie(self, http, oauth_session):
        r = http.post(
            f"{API}/affiliate/become",
            headers={"Cookie": f"session_token={oauth_session['session_token']}"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["user_id"] == oauth_session["user_id"]
        assert body["code"]
        # cleanup affiliate row
        _db.affiliates.delete_many({"user_id": oauth_session["user_id"]})

    def test_affiliate_dashboard_via_cookie(self, http, oauth_session):
        r = http.get(
            f"{API}/affiliate/dashboard",
            headers={"Cookie": f"session_token={oauth_session['session_token']}"},
            timeout=20,
        )
        assert r.status_code == 200
        data = r.json()
        # No affiliate yet for this fresh user
        assert "affiliate" in data and "referrals" in data and "commissions" in data

    def test_upload_requires_auth_still_401_without_cookie(self, http):
        r = http.post(
            f"{API}/resumes/upload",
            files={"file": ("x.pdf", b"%PDF-1.4 tiny", "application/pdf")},
            timeout=15,
        )
        assert r.status_code in (401, 403)


# ==================================================================
# Bearer JWT regression (existing flow must still work)
# ==================================================================
class TestJWTRegression:
    def test_signup_login_me_with_bearer(self, http):
        email = f"test_jwt_regress_{int(time.time())}_{uuid.uuid4().hex[:6]}@jobsmartr.com"
        s = http.post(f"{API}/auth/signup",
                      json={"name": "JWT Reg", "email": email, "password": "pw12345"},
                      timeout=20)
        assert s.status_code == 200, s.text
        token = s.json()["token"]

        me = http.get(f"{API}/auth/me",
                      headers={"Authorization": f"Bearer {token}"},
                      timeout=15)
        assert me.status_code == 200
        assert me.json()["email"] == email

        # dashboard via bearer
        d = http.get(f"{API}/dashboard",
                     headers={"Authorization": f"Bearer {token}"},
                     timeout=20)
        assert d.status_code == 200
        assert d.json()["user"]["email"] == email

        # cleanup
        uid = me.json()["id"]
        _db.users.delete_one({"id": uid})
        _db.resumes.delete_many({"user_id": uid})
