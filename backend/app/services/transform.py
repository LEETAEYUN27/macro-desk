"""원자료(payload) → 화면용 경량 응답. 일봉 전체(수백 KB)를 그대로 내보내지 않는다."""

GROUP_LABELS = {
    "indices": "주요 지수", "commodities": "원자재", "fx_rates": "환율·금리",
    "sectors_us": "미국 섹터", "sectors_kr": "한국 섹터", "realestate": "부동산·리츠",
}
GROUP_SLUGS = {"indices": "indices", "commodities": "commodities", "fx_rates": "fx-rates",
               "sectors_us": "us-sectors", "sectors_kr": "kr-sectors", "realestate": "real-estate"}
SLUG_TO_GROUP = {v: k for k, v in GROUP_SLUGS.items()}


def slim_item(it: dict, spark_n: int = 60) -> dict:
    return {
        "name": it["name"], "ticker": it["ticker"], "last": it["last"], "asof": it["asof"],
        "chg": it.get("chg", {}), "ytd": it.get("ytd"),
        "spark": [v for _, v in it.get("daily", [])[-spark_n:]],
    }


def find_item(payload: dict, ticker: str) -> dict | None:
    for items in payload.get("groups", {}).values():
        for it in items:
            if it["ticker"] == ticker:
                return it
    return None


def movers(payload: dict, key: str = "d1", n: int = 3) -> dict:
    pool = []
    for g in ("indices", "commodities", "sectors_us", "sectors_kr"):
        for it in payload["groups"].get(g, []):
            v = (it.get("chg") or {}).get(key)
            if v is not None and it["ticker"] != "^VIX":
                pool.append({"name": it["name"], "ticker": it["ticker"], "chg": v, "group": GROUP_LABELS[g]})
    pool.sort(key=lambda x: x["chg"])
    return {"down": pool[:n], "up": list(reversed(pool[-n:]))}


def slim_concentration(c: dict | None) -> dict | None:
    if not c:
        return None
    return {k: c.get(k) for k in ("last", "asof", "pctile", "chg_3m", "chg_6m", "level", "trend",
                                  "alert", "hi", "hi_at", "lo", "lo_at", "series", "method")}
