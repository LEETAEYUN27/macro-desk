"""FOMC 금리 결정 확률 산출 (회의 시점 반영).

직전 구조는 '익월물 내재금리 − 현재 실효금리'를 그대로 확률로 썼기 때문에 회의가 지나가도
값이 갱신되지 않고 100% 같은 수치가 남았다. 본 엔진은 남은 회의 일정을 기준으로 다시 계산한다.

원리 : 연방기금 선물은 해당 월의 '일평균' 금리를 대상으로 한다. 월 중간에 회의가 있으면
회의 전 금리와 회의 후 금리가 일수 비중대로 섞이므로, 그 비중을 풀어 회의 후 금리를 구한다.
회의가 월말이면 비중이 작아 오차가 커지므로, 다음 달에 회의가 없는 경우 다음 달 월물을
회의 후 금리로 그대로 사용한다. (CME FedWatch 와 같은 접근이며 공식 수치는 아니다.)
"""
import datetime as dt

from app.sources.fedfunds import implied_rate, month_split

STEP = 0.25


def _next_month(d: dt.date) -> dt.date:
    return (d.replace(day=28) + dt.timedelta(days=4)).replace(day=1)


def _pack(direction: str, prob: float) -> list[dict]:
    prob = max(0, min(100, round(prob)))
    if direction == "hold" or prob < 3:
        return [{"key": "hold", "label": "동결", "prob": 100 - prob},
                {"key": "move", "label": "25bp 조정", "prob": prob}]
    key = "hike" if direction == "hike" else "cut"
    label = "25bp 인상" if key == "hike" else "25bp 인하"
    pair = [{"key": key, "label": label, "prob": prob},
            {"key": "hold", "label": "동결", "prob": 100 - prob}]
    return pair if prob >= 50 else pair[::-1]


async def current_rate(dff: float, last_meeting: dt.date | None, today: dt.date) -> tuple[float, str]:
    """현재 실효금리. 이번 달에 이미 회의가 있었다면 FRED 공표 지연을 선물로 보정한다."""
    if last_meeting and last_meeting.year == today.year and last_meeting.month == today.month:
        fut = await implied_rate(today.year, today.month)
        w_before, w_after = month_split(last_meeting)
        if fut is not None and w_after > 0.15:
            solved = (fut - w_before * dff) / w_after
            if abs(solved - dff) < 1.0:
                return round(solved, 3), "이번 달 회의 반영분을 선물로 보정"
    return dff, "FRED 실효금리(DFF) 최신값"


async def meeting_odds(meetings: list[dt.date], effr: float) -> list[dict]:
    out: list[dict] = []
    prev_rate = effr
    mset = {(m.year, m.month) for m in meetings}
    for mtg in meetings[:4]:
        nm = _next_month(mtg)
        post = None
        basis = ""
        if (nm.year, nm.month) not in mset:          # 다음 달에 회의가 없으면 그 월물이 곧 회의 후 금리
            post = await implied_rate(nm.year, nm.month)
            basis = f"{nm.month}월물 내재금리"
        if post is None:
            fut = await implied_rate(mtg.year, mtg.month)
            w_before, w_after = month_split(mtg)
            if fut is not None and w_after > 0.2:
                post = (fut - w_before * prev_rate) / w_after
                basis = f"{mtg.month}월물 일수 비중 환산"
        if post is None or abs(post - prev_rate) > 0.8:   # 환산 오차가 커지는 구간은 표시하지 않는다
            out.append({"date": mtg.isoformat(), "outcomes": None, "implied": None,
                        "change_bp": None, "cum_bp": None, "basis": "선물 환산 불가"})
            continue
        change = post - prev_rate
        direction = "hike" if change > 0.03 else "cut" if change < -0.03 else "hold"
        out.append({"date": mtg.isoformat(), "outcomes": _pack(direction, abs(change) / STEP * 100),
                    "implied": round(post, 3), "change_bp": round(change * 100),
                    "cum_bp": round((post - effr) * 100), "basis": basis})
        prev_rate = post
    return out


def summarize(first: dict | None, effr: float, meetings: list[dt.date], asof: str, source: str = "") -> dict:
    if not first or not first.get("outcomes"):
        return {"meeting": meetings[0].isoformat() if meetings else "-", "asof": asof,
                "outcomes": None, "path": [{"label": "현재 실효금리", "v": f"{effr:.2f}%"}],
                "method": "연방기금 선물 환산이 불가능해 이번 회의 반영 확률을 표시하지 않았습니다."}
    return {
        "meeting": first["date"], "asof": asof, "outcomes": first["outcomes"],
        "method": (f"연방기금 선물 내재금리 기준 · 현재 실효금리 {effr:.2f}%({source}) → 회의 후 내재 "
                   f"{first['implied']:.2f}%({first['basis']}) · 차이 {first['change_bp']:+d}bp ÷ 25bp. "
                   "CME FedWatch 공식 수치가 아니라 선물 가격에서 직접 환산한 근사치입니다."),
        "path": [{"label": "현재 실효금리", "v": f"{effr:.2f}%"},
                 {"label": "회의 후 내재금리", "v": f"{first['implied']:.2f}%"},
                 {"label": "이번 회의 반영폭", "v": f"{first['change_bp']:+d}bp"}],
    }
