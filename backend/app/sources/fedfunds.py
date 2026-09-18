"""연방기금 선물(ZQ) 내재금리 조회.

CME FedWatch 엔드포인트는 스크래핑이 차단되어 있으므로 선물 종가에서 직접 환산한다.
GitHub Actions 환경에서는 Yahoo 시세가 정상 조회된다(클라우드 IP 일부는 차단됨).
"""
import datetime as dt

from app.cache import cache

MONTH_CODE = {1: "F", 2: "G", 3: "H", 4: "J", 5: "K", 6: "M",
              7: "N", 8: "Q", 9: "U", 10: "V", 11: "X", 12: "Z"}
TTL = 60 * 30


def _sync_implied(year: int, month: int):
    import yfinance as yf

    tk = f"ZQ{MONTH_CODE[month]}{str(year)[-2:]}.CBT"
    h = yf.Ticker(tk).history(period="10d")
    if h.empty:
        raise RuntimeError(f"{tk} 시세 없음")
    return round(100 - float(h["Close"].dropna().iloc[-1]), 4)


async def implied_rate(year: int, month: int) -> float | None:
    """해당 월물이 반영한 그 달의 평균 연방기금금리(%)."""
    import asyncio

    async def _fetch():
        return await asyncio.to_thread(_sync_implied, year, month)

    try:
        return await cache.get_or_fetch(f"zq:{year}-{month:02d}", TTL, _fetch)
    except Exception:  # noqa: BLE001
        return None


def month_split(meeting: dt.date) -> tuple[float, float]:
    """회의월을 회의 전/후 비중으로 나눈다.

    연방기금 선물은 그 달의 '일평균' 금리를 대상으로 하므로, 월 중간에 회의가 있으면
    회의 전 금리와 회의 후 금리가 일수 비중대로 섞인다. (CME FedWatch 와 같은 방식)
    결정은 회의 다음날부터 적용된다고 본다.
    """
    nxt = (meeting.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
    days = (nxt - meeting.replace(day=1)).days
    before = meeting.day            # 회의 당일까지는 종전 금리
    return before / days, (days - before) / days
