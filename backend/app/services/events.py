"""경제 이벤트 캘린더.

- 지난 이벤트는 자동으로 빠지고 다음 이벤트가 앞으로 당겨진다(화면단에서도 재계산).
- FOMC 는 연방기금 선물이 반영한 결정 확률을, 지표 발표는 발표 후 실제 값을 붙인다.
"""
import datetime as dt
import json
from pathlib import Path

from app.services.rate_odds import current_rate, meeting_odds, summarize
from app.sources import fred

ROOT = Path(__file__).resolve().parents[2]
KST = dt.timezone(dt.timedelta(hours=9))


def load() -> list[dict]:
    return json.loads((ROOT / "config" / "events.json").read_text(encoding="utf-8"))


def _kst_dt(e: dict) -> dt.datetime:
    """이벤트의 한국시간 발생 시각(대략)."""
    d = dt.date.fromisoformat(e["date"])
    t = e.get("time_kst", "")
    if t.startswith("익일"):
        d = d + dt.timedelta(days=1)
        t = t.replace("익일", "").strip()
    try:
        hh, mm = (int(x) for x in t.split(":"))
    except ValueError:
        hh, mm = 23, 59
    return dt.datetime(d.year, d.month, d.day, hh, mm, tzinfo=KST)


async def _result_value(spec: dict | None, effr_series: list[list] | None,
                        event_date: str = "", effr_now: float | None = None) -> str | None:
    if not spec:
        return None
    try:
        if spec["type"] == "fred_last":
            s = await fred.fred_series(spec["id"], years=3)
            return f"{spec['label']} {s[-1][1]:.2f}{spec.get('unit', '')} ({s[-1][0][:7]})"
        if spec["type"] == "fred_yoy":
            s = await fred.fred_series(spec["id"], years=4)
            m = fred.to_monthly(s)
            y = fred.yoy(m)
            return f"{spec['label']} {y[-1][1]:.2f}{spec.get('unit', '')} ({y[-1][0]})"
        if spec["type"] == "effr_change" and effr_series and event_date:
            pre = next((v for d, v in reversed(effr_series) if d <= event_date), None)
            after = [v for d, v in effr_series if d > event_date]
            post = after[-1] if after else None
            src = "FRED 실효금리"
            if post is None or (effr_now is not None and abs(effr_now - (post or 0)) > 0.1):
                # FRED 공표가 아직 반영되지 않은 구간은 선물로 보정한 현재 금리를 사용한다
                post, src = effr_now, "선물 보정치"
            if pre is None or post is None:
                return None
            bp = round((post - pre) * 100)
            if abs(bp) < 3:
                return f"동결 (실효금리 {post:.2f}% 유지)"
            return f"{'인상' if bp > 0 else '인하'} {abs(bp)}bp · 실효금리 {pre:.2f}% → {post:.2f}% ({src})"
    except Exception:  # noqa: BLE001
        return None
    return None


async def build(effr: float, asof: str, upcoming_n: int = 6, past_n: int = 3) -> dict:
    now = dt.datetime.now(KST)
    evs = load()
    for e in evs:
        e["at_kst"] = _kst_dt(e).isoformat()
    upcoming = [e for e in evs if _kst_dt(e) >= now][:upcoming_n]
    past_all = [e for e in evs if _kst_dt(e) < now]
    past = past_all[-past_n:][::-1]

    try:
        effr_series = await fred.fred_series("DFF", years=2)
        effr = effr_series[-1][1]
    except Exception:  # noqa: BLE001
        effr_series = None
    last_fomc = next((dt.date.fromisoformat(e["date"]) for e in reversed(past_all) if e["kind"] == "fomc"), None)
    effr, effr_src = await current_rate(effr, last_fomc, now.date())

    # FOMC 확률 (다음 회의부터 최대 4회)
    fomc_dates = [dt.date.fromisoformat(e["date"]) for e in upcoming if e["kind"] == "fomc"]
    odds = await meeting_odds(fomc_dates, effr) if fomc_dates else []
    odds_by_date = {o["date"]: o for o in odds}

    for e in upcoming:
        o = odds_by_date.get(e["date"])
        e["odds"] = o["outcomes"] if o else None
        e["cum_bp"] = o.get("cum_bp") if o else None
        e["days_left"] = (_kst_dt(e).date() - now.date()).days
    for e in past:
        e["result_text"] = await _result_value(e.get("result"), effr_series, e["date"], effr)
        e["days_ago"] = (now.date() - _kst_dt(e).date()).days

    first = odds[0] if odds else None
    return {
        "now_kst": now.isoformat(),
        "upcoming": upcoming,
        "past": past,
        "effr": effr,
        "effr_source": effr_src,
        "rate_odds": summarize(first, effr, fomc_dates, asof, effr_src),
        "fomc_path": odds,
        "note": ("일정은 각 기관 공식 발표 일정이며, 확률은 연방기금 선물 가격에서 환산한 근사치입니다. "
                 "지표 발표 이벤트는 사전 확률을 제공하지 않고 발표 후 실제 수치를 표시합니다."),
    }
