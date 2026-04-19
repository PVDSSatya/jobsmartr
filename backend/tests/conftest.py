import os
import io
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://resume-match-90.preview.emergentagent.com").rstrip("/")
# Try to read from frontend .env if env var not set properly
try:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break
except Exception:
    pass

API = f"{BASE_URL}/api"


def _make_pdf_bytes(text: str) -> bytes:
    from reportlab.lib.pagesizes import LETTER
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=LETTER)
    width, height = LETTER
    y = height - 50
    for line in text.split("\n"):
        if y < 50:
            c.showPage()
            y = height - 50
        c.drawString(40, y, line[:110])
        y -= 14
    c.save()
    buf.seek(0)
    return buf.read()


SAMPLE_RESUME_TEXT = """John Doe
Email: john.doe@example.com  Phone: +91 9876543210
Location: Bengaluru, India

PROFESSIONAL SUMMARY
Senior Software Engineer with 6+ years of experience building scalable backend systems in Python,
FastAPI, Node.js. Expert in AWS, Docker, Kubernetes, MongoDB, PostgreSQL, Redis, and system design.

SKILLS
Python, FastAPI, Django, Node.js, React, JavaScript, TypeScript, AWS, Docker, Kubernetes,
MongoDB, PostgreSQL, Redis, Kafka, RabbitMQ, CI/CD, GitHub Actions, Terraform, Linux, REST APIs, GraphQL.

EXPERIENCE
Senior Backend Engineer, Acme Corp, Bengaluru (2021 - Present)
- Designed microservices handling 5M req/day reducing latency by 40%.
- Led migration to Kubernetes across 15 services improving deployment speed by 70%.
- Mentored 4 junior engineers, conducted code reviews.

Software Engineer, Beta Labs, Remote (2018 - 2021)
- Built REST APIs in Django serving 500K users.
- Optimized PostgreSQL queries reducing p95 by 60%.

EDUCATION
B.Tech Computer Science, IIT Delhi, 2018

PROJECTS
- Resume Analyzer: NLP tool using spaCy to score resumes.
- E-commerce Platform: React + FastAPI stack with Stripe.
"""


@pytest.fixture(scope="session")
def api_base():
    return API


@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def sample_pdf():
    return _make_pdf_bytes(SAMPLE_RESUME_TEXT)


@pytest.fixture(scope="session")
def unique_email():
    return f"test_{int(time.time())}_{os.getpid()}@jobsmartr.com"


@pytest.fixture(scope="session")
def signup_user(http, unique_email):
    payload = {"name": "Test User", "email": unique_email, "password": "test1234"}
    r = http.post(f"{API}/auth/signup", json=payload, timeout=30)
    assert r.status_code == 200, f"Signup failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["token"], "user": data["user"], "password": payload["password"]}


@pytest.fixture(scope="session")
def auth_headers(signup_user):
    return {"Authorization": f"Bearer {signup_user['token']}"}
