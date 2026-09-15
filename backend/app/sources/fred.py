"""FRED 공개 CSV (API 키 불필요). build_console.py 의 fred() 이식 + 캐싱."""
import io

import pandas as pd

from app.cache import cache
from app.config import get_settings
from app.sources.http import client


async def fred_series(series_id: str, years: int = 30) -> list[list]:
    async def _fetch():
        r = await client().get(f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}")
        r.raise_for_status()
        df = pd.read_csv(io.BytesIO(r.content))
        df.columns = ["date", "value"]
        df["date"] = pd.to_datetime(df["date"])
        df["value"] = pd.to_numeric(df["value"], errors="coerce")
        df = df.dropna()
        df = df[df["date"] >= df["date"].max() - pd.DateOffset(years=years)]
        return [[d.strftime("%Y-%m-%d"), round(float(v), 4)] for d, v in zip(df["date"], df["value"])]

    return await cache.get_or_fetch(f"fred:{series_id}:{years}", get_settings().ttl_fred, _fetch)


def to_monthly(series: list[list]) -> list[list]:
    """일·주 단위 계열을 월말 값으로 축약(차트 전송량 절감)."""
    out: dict[str, float] = {}
    for d, v in series:
        out[d[:7]] = v
    return [[k, v] for k, v in out.items()]


def yoy(series: list[list]) -> list[list]:
    """월간 지수 → 전년비(%)."""
    out = []
    for i in range(12, len(series)):
        prev = series[i - 12][1]
        if prev:
            out.append([series[i][0][:7], round((series[i][1] / prev - 1) * 100, 2)])
    return out
