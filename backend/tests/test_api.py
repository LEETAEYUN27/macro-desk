import os

os.environ["PAYLOAD_URL"] = "http://127.0.0.1:9/unreachable.json"   # 강제로 로컬 스냅샷 사용

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.indicators import INDICATORS  # noqa: E402


def test_dashboard():
    with TestClient(app) as c:
        r = c.get("/api/dashboard")
        assert r.status_code == 200
        js = r.json()
        assert 0 <= js["stability"]["score"] <= 100
        assert js["insight"]["paragraphs"]
        assert len(js["groups"]) == 6


def test_markets_and_404():
    with TestClient(app) as c:
        assert c.get("/api/markets/indices").status_code == 200
        assert c.get("/api/markets/nope").status_code == 404


def test_all_indicators():
    with TestClient(app) as c:
        for i in INDICATORS:
            r = c.get(f"/api/indicators/{i.slug}")
            assert r.status_code == 200, i.slug
            assert r.json()["reading"]


def test_cache_hit():
    with TestClient(app) as c:
        c.get("/api/dashboard")
        c.get("/api/dashboard")
        assert c.get("/api/cache").json()["stats"]["hit"] >= 1
