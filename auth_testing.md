# Auth-Gated App Testing Playbook — Job Smartr

## Auth modes supported
1. **JWT (email+password)** — existing form-based auth. Token in `localStorage.js_token`, sent via `Authorization: Bearer <token>`.
2. **Emergent Google OAuth** — session cookie `session_token` (httpOnly, 7-day expiry). Records in `user_sessions` collection.

Both resolve to the same `users` collection via `user.id` and both work on `GET /api/auth/me` and all protected endpoints.

## Step 1: Create Test User & Session (OAuth path)
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  id: userId,
  email: 'test.oauth.' + Date.now() + '@example.com',
  name: 'Test OAuth User',
  plan: 'free',
  scans_used: 0,
  created_at: new Date().toISOString(),
  auth_provider: 'google',
  picture: 'https://example.com/p.png'
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# OAuth path — cookie-based
curl -X GET "$REACT_APP_BACKEND_URL/api/auth/me" \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN"

# JWT path — bearer-based  (existing)
curl -X GET "$REACT_APP_BACKEND_URL/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT"
```

## Step 3: Browser Testing with Playwright
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "resume-match-90.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://resume-match-90.preview.emergentagent.com/dashboard")
```

## Quick Debug
```bash
mongosh --eval "
use('test_database');
db.users.find({auth_provider: 'google'}).limit(2).pretty();
db.user_sessions.find().limit(2).pretty();
"

# Clean test data
mongosh --eval "
use('test_database');
db.users.deleteMany({email: /test\.oauth\./});
db.user_sessions.deleteMany({session_token: /test_session/});
"
```

## Checklist
- [ ] `users.id` is a string UUID (not `_id`)
- [ ] `user_sessions.user_id` matches `users.id` exactly
- [ ] All queries exclude `_id` via `{"_id": 0}`
- [ ] `/api/auth/me` accepts BOTH `Authorization: Bearer` header AND `session_token` cookie
- [ ] Redirect URL during Google login is derived from `window.location.origin` — NOT hardcoded
- [ ] Session cookie is httpOnly, Secure, SameSite=None
- [ ] CORS has `allow_credentials=True` and frontend uses `withCredentials: true`
- [ ] Referral code (if present) is stored in sessionStorage before Google redirect and applied by backend on session exchange
- [ ] Logout calls `/api/auth/logout` AND clears localStorage

## Success Indicators
- ✅ `/api/auth/me` returns user data via cookie
- ✅ Dashboard loads without redirect after Google callback
- ✅ Existing JWT flow (form login) still works unchanged

## Failure Indicators
- ❌ 401 on `/api/auth/me` after OAuth callback
- ❌ Redirect loop between / and /dashboard
- ❌ Existing form-login users get logged out
