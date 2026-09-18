"""데이터 기반 자동 해설.

LLM 을 호출하지 않고 수치 규칙으로 문장을 조립한다(비용 0, 환각 0, 매일 재현 가능).
투자 권유 표현(매수·매도·비중 조절 지시)은 넣지 않는다 — 공개 정보 해설 범위 유지.
"""
from app.services.transform import find_item, movers


def _f(v, digits=2, sign=True):
    if v is None:
        return "-"
    return f"{v:+.{digits}f}" if sign else f"{v:.{digits}f}"


def _short(c):
    return c['name'].split(' (')[0]


def _chg_word(v):
    if v is None:
        return "보합"
    if v >= 1.5:
        return "큰 폭 상승"
    if v >= 0.3:
        return "상승"
    if v > -0.3:
        return "보합"
    if v > -1.5:
        return "하락"
    return "큰 폭 하락"


def build_insight(p: dict, ev: dict | None = None) -> dict:
    st = p["stability"]
    comps = sorted(st["components"], key=lambda c: c["score"])
    weak, strong = comps[0], comps[-1]
    weak_axes = [c for c in comps if c["score"] < 50]

    headline = f"경제 안정성 {st['score']:.1f}점({st['label']}) - 가장 취약한 축은 {_short(weak)}"

    # 1. 종합
    p1 = (f"7개 거시 축을 0~100점으로 환산한 경제 안정성 점수는 {st['score']:.1f}점으로 '{st['label']}' 구간입니다. "
          f"가장 견조한 축은 {_short(strong)} {strong['score']:.0f}점, 가장 취약한 축은 {_short(weak)} {weak['score']:.0f}점입니다. ")
    if len(weak_axes) == 1:
        p1 += "50점 미만 축이 하나뿐이어서 경기 자체보다는 특정 부문의 부담이 점수를 끌어내리는 구조입니다."
    elif len(weak_axes) >= 2:
        p1 += f"50점 미만 축이 {len(weak_axes)}개로, 여러 부문에서 동시에 부담이 커지고 있습니다."
    else:
        p1 += "모든 축이 50점 이상으로 뚜렷한 취약 부문이 없습니다."

    # 2. 시장
    spx = find_item(p, "^GSPC")
    ixic = find_item(p, "^IXIC")
    kospi = find_item(p, "^KS11")
    vix = find_item(p, "^VIX")
    p2_parts = []
    if spx:
        p2_parts.append(f"S&P 500 은 전일 대비 {_f(spx['chg'].get('d1'))}%({_chg_word(spx['chg'].get('d1'))}), "
                        f"1개월 {_f(spx['chg'].get('m1'))}%, 연초 대비 {_f(spx.get('ytd'))}% 입니다")
    if ixic:
        p2_parts.append(f"나스닥 종합은 전일 대비 {_f(ixic['chg'].get('d1'))}% 입니다")
    if kospi:
        p2_parts.append(f"코스피는 전일 대비 {_f(kospi['chg'].get('d1'))}%, 연초 대비 {_f(kospi.get('ytd'))}% 입니다")
    p2 = ". ".join(p2_parts) + "."
    if vix:
        v = vix["last"]
        zone = "공포" if v >= 30 else "경계" if v >= 20 else "평온" if v >= 13 else "과도한 안도"
        p2 += f" VIX 는 {v:.1f}로 {zone} 구간입니다."

    # 3. 금리
    ro = (ev or {}).get("rate_odds") or p.get("rate_odds") or {}
    outs = ro.get("outcomes") or []
    top = max(outs, key=lambda o: o["prob"]) if outs else None
    metrics = {m["name"]: m["value"] for m in st["metrics"]}
    p3 = (f"연방기금 실효금리는 {metrics.get('연방기금 실효금리', '-')}, 미 10년물은 {metrics.get('미 10년물', '-')}, "
          f"10년-3개월 금리차는 {metrics.get('장단기 금리차 10Y−3M', '-')} 입니다. ")
    if top:
        p3 += (f"연방기금 선물 가격 기준으로 다음 FOMC({ro.get('meeting', '-')})에서 '{top['label']}' 가능성이 "
               f"{top['prob']}%로 가장 높게 반영되어 있습니다(CME FedWatch 공식 수치가 아닌 자체 환산치).")

    # 4. 환율·원자재
    krw, gold, wti = find_item(p, "KRW=X"), find_item(p, "GC=F"), find_item(p, "CL=F")
    bits = []
    if krw:
        bits.append(f"원/달러 환율 {krw['last']:,.1f}원(1주 {_f(krw['chg'].get('w1'))}%)")
    if gold:
        bits.append(f"금 {gold['last']:,.1f}달러(1개월 {_f(gold['chg'].get('m1'))}%)")
    if wti:
        bits.append(f"WTI {wti['last']:,.2f}달러(1개월 {_f(wti['chg'].get('m1'))}%)")
    p4 = ("환율·원자재는 " + ", ".join(bits) + " 입니다.") if bits else ""

    # 5. 쏠림
    c = p.get("concentration")
    p5 = ""
    if c:
        p5 = (f"S&P 500 시총가중과 동일가중의 12개월 수익률 격차는 {c['last']:+.1f}%p(역사적 백분위 {c['pctile']:.0f}%)이며, "
              f"최근 3개월 {_f(c.get('chg_3m'), 1)}%p 변해 '{c['trend']}' 흐름입니다.")

    # 임박 이벤트 한 줄
    p6 = ""
    ups = (ev or {}).get("upcoming") or []
    if ups:
        nxt = ups[0]
        p6 = (f"다음 예정 이벤트는 {nxt['date']} {nxt['name']}이며 남은 기간은 {max(nxt.get('days_left', 0), 0)}일입니다. "
              f"{nxt['why']}")

    mv = movers(p)
    bullets = []
    if mv["up"]:
        bullets.append("전일 상승 상위 : " + ", ".join(f"{x['name']} {x['chg']:+.2f}%" for x in mv["up"]))
    if mv["down"]:
        bullets.append("전일 하락 상위 : " + ", ".join(f"{x['name']} {x['chg']:+.2f}%" for x in mv["down"]))
    for ax in weak_axes:
        bullets.append(f"취약 축 : {ax['name']} {ax['score']:.0f}점 - {ax['detail'].replace('—', '-')}")

    return {
        "headline": headline,
        "paragraphs": [x for x in (p1, p2, p3, p4, p5, p6) if x],
        "bullets": bullets,
        "method": "공개 지표를 정해진 규칙으로 문장화한 자동 해설입니다. 투자 권유가 아니며 미래를 예측하지 않습니다.",
    }
