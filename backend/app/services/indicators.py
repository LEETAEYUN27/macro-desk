"""검색 유입용 지표 상세 페이지 정의.

각 지표는 (1) 현재값 (2) 추이 계열 (3) 규칙 기반 현재 해석 (4) 상시 설명문을 가진다.
설명문은 애드센스·네이버 품질 평가에서 '고유하고 유용한 텍스트'로 인정받기 위한 핵심 자산이다.
"""
from dataclasses import dataclass, field
from typing import Callable

from app.services.transform import find_item
from app.sources import fred


@dataclass
class Indicator:
    slug: str
    name: str
    short: str
    keywords: list[str]
    unit: str
    source: str
    explainer: list[str]
    reading: Callable[[float], str]
    related: list[str] = field(default_factory=list)


def _yc(v):
    if v < 0:
        return (f"현재 {v:+.2f}%p 로 역전 상태입니다. 장기금리가 단기금리보다 낮다는 것은 채권시장이 "
                "향후 금리 인하, 곧 경기 둔화를 반영하고 있다는 뜻입니다.")
    if v < 0.5:
        return f"현재 {v:+.2f}%p 로 정상 구간이지만 폭이 좁습니다. 역전 해소 직후 구간은 과거 침체가 실제로 시작된 시점과 겹친 사례가 많습니다."
    return f"현재 {v:+.2f}%p 로 정상 기울기입니다. 채권시장이 단기적인 경기 침체를 강하게 반영하고 있지는 않습니다."


def _vix(v):
    if v >= 30:
        return f"현재 {v:.1f} 로 공포 구간(30 이상)입니다. 옵션시장이 향후 30일간 큰 폭의 변동을 가격에 반영하고 있습니다."
    if v >= 20:
        return f"현재 {v:.1f} 로 경계 구간(20~30)입니다. 장기 평균(약 19~20)을 웃돌아 불안 심리가 커진 상태입니다."
    if v >= 13:
        return f"현재 {v:.1f} 로 평온 구간입니다. 장기 평균 부근이거나 그 아래로, 시장이 큰 충격을 예상하지 않고 있습니다."
    return f"현재 {v:.1f} 로 과도한 안도 구간입니다. 변동성이 극단적으로 낮은 시기는 위험 자산 쏠림이 누적되기 쉽습니다."


def _cape(v):
    if v >= 35:
        return f"현재 {v:.1f} 로 역사적 상위권입니다. 1999~2000년 닷컴 버블 정점(약 44) 다음 수준으로, 장기 기대수익률이 낮아진 상태입니다."
    if v >= 25:
        return f"현재 {v:.1f} 로 장기 평균(약 17)을 크게 웃돕니다. 고평가 구간이지만 이 지표는 매매 시점 신호로는 쓰기 어렵습니다."
    return f"현재 {v:.1f} 로 장기 평균에 가까운 수준입니다."


def _krw(v):
    if v >= 1400:
        return f"현재 {v:,.1f}원입니다. 1,400원대는 2008년 금융위기·2022년 긴축기 등 원화 약세 국면에서 나타난 수준입니다."
    if v >= 1300:
        return f"현재 {v:,.1f}원으로 2022년 이후 형성된 1,300원대 박스권 안에 있습니다."
    return f"현재 {v:,.1f}원으로 최근 몇 년 평균보다 원화가 강한 편입니다."


def _pct_level(name, hi, lo):
    def f(v):
        if v >= hi:
            return f"현재 {name} {v:.2f}% 로 높은 수준입니다."
        if v <= lo:
            return f"현재 {name} {v:.2f}% 로 낮은 수준입니다."
        return f"현재 {name} {v:.2f}% 로 중간 수준입니다."
    return f


def _unrate(v):
    return (f"현재 {v:.1f}% 입니다. 실업률 자체보다 3개월 평균이 직전 12개월 최저치보다 0.5%p 이상 오르는지"
            "(Sahm 룰)가 침체 판단에 더 유용합니다.")


def _cpi(v):
    gap = v - 2.0
    return f"현재 근원 CPI 전년비 {v:.2f}% 로 연준 목표 2%와 {gap:+.2f}%p 차이입니다. 차이가 클수록 금리 인하 여지는 줄어듭니다."


def _rec(v):
    if v >= 30:
        return f"현재 {v:.1f}% 로 과거 침체 직전 구간에서 관찰된 30% 선을 넘었습니다."
    return f"현재 {v:.1f}% 입니다. 30%를 넘는 구간은 과거 대부분의 침체에 앞서 나타났습니다."


def _nfci(v):
    return (f"현재 {v:.3f} 입니다. 0 미만은 금융여건이 장기 평균보다 완화적, 0 초과는 긴축적이라는 뜻입니다."
            if v < 0 else f"현재 {v:.3f} 로 평균보다 긴축적인 금융여건입니다.")


def _gold(v):
    return f"현재 온스당 {v:,.1f}달러입니다. 금은 실질금리·달러 방향과 반대로 움직이는 경향이 있습니다."


def _wti(v):
    return f"현재 배럴당 {v:,.2f}달러입니다. 유가는 수개월 시차를 두고 헤드라인 물가에 반영됩니다."


def _conc(v):
    return (f"현재 시가총액 가중 S&P 500 이 동일가중보다 12개월간 {v:+.1f}%p 앞서 있습니다. "
            "값이 클수록 소수 대형주가 지수를 끌어올리는 쏠림 장세입니다.")


def _generic(unit):
    return lambda v: f"현재 {v:,.2f}{unit} 입니다."


INDICATORS: list[Indicator] = [
    Indicator("yield-curve", "장단기 금리차 (미국 10년-3개월)", "장단기 금리차",
              ["장단기금리차", "금리역전", "10년물 3개월물", "경기침체 신호"], "%p", "FRED T10Y3M",
              ["장단기 금리차는 미국 10년 만기 국채금리에서 3개월 만기 국채금리를 뺀 값입니다. 평소에는 돈을 오래 빌려줄수록 "
               "높은 금리를 요구하므로 양(+)의 값을 가집니다.",
               "이 값이 음(-)으로 뒤집히는 '금리 역전'은 채권 투자자들이 가까운 미래의 금리 인하, 즉 경기 둔화를 예상한다는 뜻입니다. "
               "뉴욕 연준의 침체확률 모형도 바로 이 10년-3개월 금리차를 입력값으로 사용합니다.",
               "다만 역전 시점과 실제 침체 시작 사이에는 통상 6~24개월의 시차가 있고, 2022~2024년처럼 긴 역전 뒤에도 "
               "침체가 곧바로 오지 않은 사례가 있으므로 단독 신호보다 고용·신용 지표와 함께 보는 것이 일반적입니다."],
              _yc, ["recession-probability", "us-10y", "fed-funds"]),
    Indicator("vix", "VIX 변동성 지수 (공포지수)", "VIX 공포지수",
              ["VIX", "공포지수", "변동성지수", "시장 불안"], "", "CBOE (Yahoo Finance)",
              ["VIX 는 S&P 500 옵션 가격에서 산출한 향후 30일 기대 변동성(연율)입니다. 시장이 불안할수록 하락 방어용 옵션 수요가 "
               "늘어 값이 오르기 때문에 흔히 '공포지수'라고 부릅니다.",
               "통상 12~20 은 평온, 20~30 은 경계, 30 이상은 공포 구간으로 해석합니다. 2008년 금융위기와 2020년 3월 코로나 충격 "
               "당시에는 80 을 넘었습니다.",
               "VIX 는 평균으로 되돌아가는 성질이 강해 급등 이후 빠르게 낮아지는 경우가 많습니다."],
              _vix, ["market-concentration", "shiller-cape"]),
    Indicator("shiller-cape", "실러 CAPE (경기조정 주가수익비율)", "실러 CAPE",
              ["CAPE", "실러 PER", "주식 고평가", "밸류에이션"], "배", "multpl.com",
              ["CAPE 는 S&P 500 지수를 최근 10년 물가조정 평균 이익으로 나눈 값입니다. 노벨경제학상 수상자 로버트 실러가 "
               "대중화했으며, 한 해 실적의 일시적 등락을 걸러 장기 밸류에이션을 보여줍니다.",
               "장기 평균은 17 안팎이며, 닷컴 버블 정점인 2000년에는 44 수준까지 올랐습니다. 높은 CAPE 는 이후 10년 기대수익률이 "
               "낮았다는 통계적 관계가 있습니다.",
               "그러나 고평가 상태가 수년간 지속될 수 있어 단기 매매 시점 신호로는 적합하지 않습니다."],
              _cape, ["vix", "market-concentration"]),
    Indicator("usd-krw", "원/달러 환율", "원달러 환율",
              ["원달러 환율", "환율 전망", "달러 환율", "원화 약세"], "원", "Yahoo Finance",
              ["원/달러 환율은 1달러를 사는 데 필요한 원화 금액입니다. 값이 오르면 원화 약세(달러 강세)입니다.",
               "한미 금리차, 무역수지, 외국인 주식 매매, 글로벌 위험회피 심리가 주요 변수입니다. 위기 국면에서는 안전자산 선호로 "
               "달러가 강해지며 환율이 급등하는 경향이 있습니다.",
               "환율 상승은 수출기업 원화 환산 이익에는 유리하지만 수입 물가를 높이고 외국인 자금 유출 압력을 키웁니다."],
              _krw, ["gold", "us-10y"]),
    Indicator("gold", "국제 금 시세 (COMEX 선물)", "금 시세",
              ["금값", "금 시세", "국제 금값", "금 투자"], "달러/온스", "COMEX (Yahoo Finance)",
              ["국제 금 시세는 뉴욕상품거래소(COMEX) 금 선물 최근월물 가격(달러/트로이온스)입니다.",
               "금은 이자가 없는 자산이라 실질금리(명목금리-기대인플레이션)가 오르면 보유 기회비용이 커져 약세, 내리면 강세를 "
               "보이는 경향이 있습니다. 달러 약세와 지정학적 위기, 중앙은행 매입도 가격을 끌어올립니다."],
              _gold, ["usd-krw", "us-10y"]),
    Indicator("wti", "WTI 국제유가", "WTI 유가",
              ["국제유가", "WTI", "유가 전망", "원유 가격"], "달러/배럴", "NYMEX (Yahoo Finance)",
              ["WTI 는 미국 서부텍사스산 원유 선물 최근월물 가격으로, 브렌트유와 함께 국제 유가의 기준입니다.",
               "유가는 운송·제조 비용을 통해 수개월 시차를 두고 소비자물가에 반영되며, 에너지 섹터 이익과 산유국 통화에도 영향을 줍니다."],
              _wti, ["core-cpi", "fed-funds"]),
    Indicator("us-10y", "미국 10년물 국채금리", "미국 10년물 금리",
              ["미국채 10년물", "미국 국채금리", "장기금리"], "%", "FRED DGS10",
              ["미국 10년물 국채금리는 전 세계 자산 가격의 할인율 역할을 하는 기준 금리입니다. 주택담보대출 금리와 성장주 "
               "밸류에이션에 직접적인 영향을 줍니다.",
               "기대 인플레이션, 향후 기준금리 경로, 기간 프리미엄(장기 보유에 대한 추가 보상)의 합으로 결정됩니다."],
              _pct_level("10년물 금리", 4.5, 3.0), ["yield-curve", "fed-funds"]),
    Indicator("fed-funds", "미국 연방기금 실효금리", "미국 기준금리",
              ["미국 기준금리", "연방기금금리", "FOMC", "금리 인상"], "%", "FRED DFF",
              ["연방기금 실효금리는 미국 은행 간 초단기 자금 거래에 실제로 적용된 금리의 가중평균입니다. FOMC 가 정하는 "
               "목표 범위 안에서 움직이므로 사실상 미국 기준금리로 봅니다.",
               "FOMC 는 연 8회 정례회의에서 목표 범위를 조정합니다. 시장의 인상·인하 기대는 연방기금 선물 가격에 반영됩니다."],
              _pct_level("실효금리", 4.5, 2.0), ["yield-curve", "core-cpi"]),
    Indicator("core-cpi", "미국 근원 소비자물가 (전년비)", "미국 근원 CPI",
              ["미국 CPI", "근원 물가", "인플레이션", "소비자물가"], "%", "FRED CPILFESL",
              ["근원 CPI 는 변동성이 큰 식품과 에너지를 뺀 소비자물가지수입니다. 일시적 가격 충격을 걸러 기조적 물가 흐름을 보여줍니다.",
               "연준은 공식적으로 PCE 물가 2%를 목표로 하지만, 매월 중순 발표되는 CPI 가 먼저 나오기 때문에 시장 영향력이 큽니다."],
              _cpi, ["fed-funds", "unemployment"]),
    Indicator("unemployment", "미국 실업률", "미국 실업률",
              ["미국 실업률", "고용보고서", "삼의 법칙", "Sahm rule"], "%", "FRED UNRATE (BLS)",
              ["미국 실업률은 노동통계국(BLS)이 매월 첫째 주 금요일 고용보고서에서 발표합니다.",
               "실업률은 경기 후행 지표이지만, 3개월 평균이 직전 12개월 최저치보다 0.5%p 이상 오르면 침체가 시작됐을 가능성이 높다는 "
               "'Sahm 룰'이 널리 쓰입니다."],
              _unrate, ["core-cpi", "recession-probability"]),
    Indicator("recession-probability", "미국 경기침체 확률 (뉴욕연준 모형)", "미국 침체확률",
              ["경기침체 확률", "뉴욕연준", "리세션", "경기침체"], "%", "Federal Reserve Bank of New York",
              ["뉴욕 연준은 10년-3개월 국채 금리차를 이용해 12개월 뒤 미국이 침체 상태일 확률을 매월 추정해 공개합니다.",
               "과거 1960년대 이후 이 확률이 30%를 넘은 뒤에는 대부분 침체가 뒤따랐지만, 단일 변수 모형이므로 신용·고용 지표와 함께 "
               "해석해야 합니다."],
              _rec, ["yield-curve", "unemployment"]),
    Indicator("nfci", "시카고연준 금융여건지수 (NFCI)", "금융여건지수 NFCI",
              ["NFCI", "금융여건", "신용 스트레스"], "", "FRED NFCI",
              ["NFCI 는 시카고 연준이 머니마켓·채권·주식·은행 시스템의 105개 지표를 종합해 매주 발표하는 금융여건 지수입니다.",
               "0 은 장기 평균이며 음수는 완화적, 양수는 긴축적 여건을 뜻합니다. 2008년 금융위기 때는 +2 를 넘었습니다."],
              _nfci, ["vix", "yield-curve"]),
    Indicator("market-concentration", "미국 증시 쏠림 지표 (시총가중-동일가중)", "증시 쏠림 지표",
              ["대형주 쏠림", "동일가중 S&P500", "RSP SPY", "빅테크 집중"], "%p", "SPY·RSP (Yahoo Finance) 자체 산출",
              ["S&P 500 시가총액 가중 ETF(SPY)와 동일가중 ETF(RSP)의 12개월 수익률 차이입니다.",
               "값이 크면 소수 초대형주가 지수 상승을 주도하고 평균적인 종목은 뒤처지는 쏠림 장세, 음수면 상승이 넓게 퍼진 장세입니다. "
               "격차가 줄어드는 방향 전환 시점이 수준 자체보다 중요합니다."],
              _conc, ["vix", "shiller-cape"]),
    Indicator("kospi", "코스피 지수", "코스피",
              ["코스피", "코스피 지수", "한국 증시"], "pt", "KRX (Yahoo Finance)",
              ["코스피는 유가증권시장 상장 전 종목의 시가총액을 1980년 1월 4일=100 기준으로 나타낸 지수입니다.",
               "반도체 대형주 비중이 높아 미국 필라델피아 반도체지수와 원/달러 환율의 영향을 크게 받습니다."],
              _generic("pt"), ["usd-krw", "sox"]),
    Indicator("sox", "필라델피아 반도체지수 (SOX)", "필라델피아 반도체지수",
              ["필라델피아 반도체지수", "SOX", "반도체 주가"], "pt", "Nasdaq (Yahoo Finance)",
              ["필라델피아 반도체지수는 미국 상장 반도체 설계·제조·장비 기업 30개로 구성된 지수입니다.",
               "글로벌 반도체 업황의 선행 지표로 쓰이며 삼성전자·SK하이닉스 등 국내 반도체주와 상관관계가 높습니다."],
              _generic("pt"), ["kospi", "market-concentration"]),
]
BY_SLUG = {i.slug: i for i in INDICATORS}

PRICE_TICKER = {"vix": "^VIX", "usd-krw": "KRW=X", "gold": "GC=F", "wti": "CL=F", "kospi": "^KS11", "sox": "^SOX"}
FRED_ID = {"yield-curve": "T10Y3M", "us-10y": "DGS10", "fed-funds": "DFF", "unemployment": "UNRATE", "nfci": "NFCI"}


def _metric(payload, name_part):
    for m in payload["stability"]["metrics"]:
        if name_part in m["name"]:
            try:
                return float(m["value"].replace("%p", "").replace("%", "").replace("+", ""))
            except ValueError:
                return None
    return None


async def resolve(slug: str, payload: dict) -> dict:
    ind = BY_SLUG[slug]
    value, asof, series, freq = None, payload["asof"][:10], [], "monthly"

    if slug in PRICE_TICKER:
        it = find_item(payload, PRICE_TICKER[slug])
        if it:
            value, asof = it["last"], it["asof"]
            series = it.get("monthly", [])[-240:]
            daily = it.get("daily", [])
            return _pack(ind, value, asof, series, daily[-260:], it.get("chg"))
    elif slug in FRED_ID:
        try:
            raw = await fred.fred_series(FRED_ID[slug], years=25)
            value, asof = raw[-1][1], raw[-1][0]
            series = fred.to_monthly(raw)
        except Exception:
            fallback = {"yield-curve": "금리차", "us-10y": "10년물", "fed-funds": "실효금리",
                        "unemployment": "실업률", "nfci": "NFCI"}[slug]
            value = _metric(payload, fallback)
    elif slug == "core-cpi":
        try:
            raw = await fred.fred_series("CPILFESL", years=26)
            series = fred.yoy(raw)
            value, asof = series[-1][1], series[-1][0]
        except Exception:
            value = _metric(payload, "근원 CPI")
    elif slug == "shiller-cape":
        value = _metric(payload, "CAPE")
    elif slug == "recession-probability":
        rs = payload["stability"].get("recession_series", [])
        if rs:
            # 뉴욕연준 계열은 '12개월 후 시점' 기준이므로 마지막 값이 현재 추정치
            series, value, asof = rs[-240:], rs[-1][1], rs[-1][0]
    elif slug == "market-concentration":
        c = payload.get("concentration") or {}
        value, asof, series = c.get("last"), c.get("asof", asof), c.get("series", [])
    return _pack(ind, value, asof, series, [], None)


def _pack(ind: Indicator, value, asof, series, daily, chg):
    return {
        "slug": ind.slug, "name": ind.name, "short": ind.short, "keywords": ind.keywords,
        "unit": ind.unit, "source": ind.source, "value": value, "asof": asof,
        "reading": ind.reading(value) if value is not None else "데이터 수집 지연으로 현재값을 표시하지 못했습니다.",
        "explainer": ind.explainer, "series": series, "daily": daily, "chg": chg,
        "related": [{"slug": s, "short": BY_SLUG[s].short} for s in ind.related if s in BY_SLUG],
    }
