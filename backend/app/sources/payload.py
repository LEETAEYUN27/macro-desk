"""기존 수집기(macro-console, GitHub Actions)가 발행한 payload.json 을 받아온다.

Yahoo Finance 시세는 클라우드 서버 IP 에서 차단되는 경우가 많아, 이미 검증된
GitHub Actions 수집 경로를 1차 원천으로 유지하고 API 서버는 이를 캐싱·가공한다.
"""
import json
from pathlib import Path

from app.cache import cache
from app.config import get_settings
from app.sources.http import client

ROOT = Path(__file__).resolve().parents[2]


async def _fetch() -> dict:
    s = get_settings()
    try:
        r = await client().get(s.payload_url)
        r.raise_for_status()
        data = r.json()
        if not data.get("groups"):
            raise ValueError("payload 구조 이상")
        return data
    except Exception:
        fp = ROOT / s.payload_fallback_path
        if fp.exists():
            data = json.loads(fp.read_text(encoding="utf-8"))
            data["_fallback"] = True
            return data
        raise


async def get_payload() -> dict:
    return await cache.get_or_fetch("payload", get_settings().ttl_payload, _fetch)
