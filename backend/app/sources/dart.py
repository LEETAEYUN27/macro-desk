"""Open DART 공시 목록. 인증키는 환경변수 DART_API_KEY."""
import datetime as dt

from app.cache import cache
from app.config import get_settings
from app.sources.http import client

# 시장 파급력이 큰 공시 유형만 추린다 (보고서명 키워드)
KEYWORDS = ("유상증자", "무상증자", "전환사채", "자기주식", "합병", "분할", "최대주주",
            "공급계약", "영업(잠정)실적", "매출액또는손익구조", "타법인주식", "소송", "감자")


async def recent_disclosures(limit: int = 30) -> list[dict]:
    s = get_settings()
    if not s.dart_api_key:
        return []

    async def _fetch():
        today = dt.date.today()
        params = {
            "crtfc_key": s.dart_api_key,
            "bgn_de": (today - dt.timedelta(days=3)).strftime("%Y%m%d"),
            "end_de": today.strftime("%Y%m%d"),
            "page_count": 100,
        }
        r = await client().get("https://opendart.fss.or.kr/api/list.json", params=params)
        r.raise_for_status()
        js = r.json()
        if js.get("status") not in ("000", "013"):     # 013 = 조회 결과 없음
            raise RuntimeError(f"DART 오류 {js.get('status')} {js.get('message')}")
        rows = []
        for it in js.get("list", []):
            name = it.get("report_nm", "")
            if it.get("corp_cls") not in ("Y", "K"):     # 유가증권·코스닥만
                continue
            if not any(k in name for k in KEYWORDS):
                continue
            rows.append({
                "corp": it["corp_name"], "market": "코스피" if it["corp_cls"] == "Y" else "코스닥",
                "title": name.strip(), "date": it["rcept_dt"],
                "url": f"https://dart.fss.or.kr/dsaf001/main.do?rcpNo={it['rcept_no']}",
            })
        return rows

    rows = await cache.get_or_fetch("dart:recent", s.ttl_dart, _fetch)
    return rows[:limit]
