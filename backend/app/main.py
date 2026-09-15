"""글로벌 경제 관제실 API (FastAPI)

실행 : uvicorn app.main:app --reload --port 8000
문서 : http://localhost:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.cache import cache
from app.config import get_settings
from app.services import indicators as ind
from app.services.insight import build_insight
from app.services.transform import (GROUP_LABELS, GROUP_SLUGS, SLUG_TO_GROUP, movers, slim_concentration,
                                    slim_item)
from app.services.transform import find_item
from app.sources import dart, http

DISCLAIMER = ("본 사이트는 공개 데이터를 모아 보여주는 정보 서비스이며 투자 자문이나 매매 권유가 아닙니다. "
              "시세는 종가 기준 스냅샷으로 실시간이 아니며, 13F는 분기 말 시점 신고 자료라 최대 45일 지연됩니다. "
              "금리 확률은 연방기금 선물 가격에서 직접 환산한 근사치로 CME FedWatch 공식 수치가 아닙니다. "
              "안정성 점수와 자동 해설은 공개 지표를 정해진 규칙으로 환산한 결과이며 미래를 예측하지 않습니다. "
              "모든 투자 판단과 책임은 이용자 본인에게 있습니다.")
from app.sources.payload import get_payload


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        await get_payload()          # 기동 시 캐시 예열
    except Exception:
        pass
    yield
    await http.close()


app = FastAPI(title="글로벌 경제 관제실 API", version="1.0.0", lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in get_settings().cors_origins.split(",") if o.strip()],
    allow_methods=["GET", "POST"], allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"ok": True}


@app.get("/api/dashboard")
async def dashboard():
    p = await get_payload()
    st = p["stability"]
    return {
        "asof": p["asof"],
        "fallback": bool(p.get("_fallback")),
        "stability": {k: st[k] for k in ("score", "label", "components", "metrics", "method")},
        "insight": build_insight(p),
        "rate_odds": p.get("rate_odds"),
        "concentration": slim_concentration(p.get("concentration")),
        "movers": movers(p),
        "groups": [
            {"key": g, "slug": GROUP_SLUGS[g], "label": GROUP_LABELS[g],
             "items": [slim_item(it, 30) for it in p["groups"].get(g, [])]}
            for g in GROUP_LABELS if p["groups"].get(g)
        ],
        "events": p.get("events", []),
        "scenarios": p.get("scenarios", []),
        "institutions": [{k: i.get(k) for k in ("key", "label", "report_date", "total_value_usd",
                                                "n_positions")} | {"top": i.get("top", [])[:5]}
                         for i in p.get("institutions", [])],
        "sources": p.get("sources"),
        "usdkrw": (find_item(p, "KRW=X") or {}).get("last"),
        "disclaimer": DISCLAIMER,
    }


@app.get("/api/markets/{slug}")
async def market_group(slug: str):
    g = SLUG_TO_GROUP.get(slug)
    if not g:
        raise HTTPException(404, "알 수 없는 시장 그룹")
    p = await get_payload()
    return {"slug": slug, "label": GROUP_LABELS[g], "asof": p["asof"],
            "items": [slim_item(it, 120) for it in p["groups"].get(g, [])]}


@app.get("/api/indicators")
async def indicator_list():
    return [{"slug": i.slug, "name": i.name, "short": i.short, "unit": i.unit} for i in ind.INDICATORS]


@app.get("/api/indicators/{slug}")
async def indicator_detail(slug: str):
    if slug not in ind.BY_SLUG:
        raise HTTPException(404, "알 수 없는 지표")
    return await ind.resolve(slug, await get_payload())


@app.get("/api/report/daily")
async def daily_report():
    p = await get_payload()
    return {"asof": p["asof"], "date": p["asof"][:10], **build_insight(p),
            "stability_score": p["stability"]["score"], "stability_label": p["stability"]["label"]}


@app.get("/api/disclosures")
async def disclosures(limit: int = Query(30, ge=1, le=100)):
    try:
        rows = await dart.recent_disclosures(limit)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"DART 조회 실패 : {e}") from e
    return {"enabled": bool(get_settings().dart_api_key), "items": rows}


@app.get("/api/cache")
async def cache_status():
    return cache.describe()


@app.post("/api/cache/refresh")
async def cache_refresh(x_refresh_token: str = Header("")):
    s = get_settings()
    if not s.refresh_token or x_refresh_token != s.refresh_token:
        raise HTTPException(401, "토큰 불일치")
    n = cache.invalidate()
    await get_payload()
    return {"invalidated": n}
