import type { Metadata } from "next";
import StaticDoc from "@/components/StaticDoc";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "서비스 소개", alternates: { canonical: "/about/" }, description: `${SITE.name}의 데이터 출처와 산출 방법을 안내합니다.` };

export default function About() {
  return (
    <StaticDoc title="서비스 소개">
      <p>{SITE.name}은 주식 투자자가 매일 아침 확인해야 하는 거시경제 지표를 한 화면에 모은 무료 정보 서비스입니다. 미국 정규장 마감 이후인 한국 시간 오전 7시에 공개 데이터를 자동으로 수집해 갱신합니다.</p>
      <h2>제공 정보</h2>
      <ul>
        <li>경제 안정성 점수 : 경기침체 확률, 근원 물가, 금융여건, 수익률곡선, 변동성, 실업률, 밸류에이션 7개 축을 0~100점으로 환산한 종합 점수</li>
        <li>FOMC 금리 결정 반영 확률 : 연방기금 선물 가격에서 직접 환산한 근사치</li>
        <li>주요 지수·원자재·환율·미국/한국 섹터·리츠 시세와 기간별 등락률</li>
        <li>버크셔 해서웨이·블랙록·국민연금·뱅가드의 SEC 13F 상위 보유 종목</li>
        <li>지표별 해설과 데이터 기반 자동 브리핑</li>
      </ul>
      <h2>데이터 출처</h2>
      <p>FRED(세인트루이스 연방준비은행), 뉴욕 연방준비은행, 시카고 연방준비은행, 미국 노동통계국, SEC EDGAR, Zillow Research, multpl.com, Yahoo Finance</p>
      <h2>유의 사항</h2>
      <p>본 서비스는 투자 자문업 또는 유사투자자문업이 아니며 특정 종목의 매수·매도를 권유하지 않습니다. 점수와 해설은 공개 지표를 정해진 규칙으로 환산한 결과로 미래 수익을 보장하지 않습니다.</p>
    </StaticDoc>
  );
}
