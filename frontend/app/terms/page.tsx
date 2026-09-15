import type { Metadata } from "next";
import StaticDoc from "@/components/StaticDoc";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "이용약관", alternates: { canonical: "/terms/" } };

export default function Terms() {
  return (
    <StaticDoc title="이용약관" updated="2026. 9. 15.">
      <h2>제1조 (목적)</h2>
      <p>본 약관은 {SITE.name}이 제공하는 거시경제 정보 서비스의 이용 조건을 정합니다.</p>
      <h2>제2조 (정보의 성격)</h2>
      <p>서비스가 제공하는 모든 수치·점수·해설은 공개 데이터를 가공한 참고 정보이며 투자 자문, 투자 권유, 매매 신호가 아닙니다. 데이터는 원천 기관의 사정에 따라 지연·오류·누락이 발생할 수 있습니다.</p>
      <h2>제3조 (책임의 한계)</h2>
      <p>이용자가 서비스 정보를 이용하여 내린 투자 판단 및 그 결과에 대하여 서비스는 책임을 지지 않습니다.</p>
      <h2>제4조 (저작권)</h2>
      <p>서비스의 화면 구성·해설 문안의 권리는 서비스에 있으며, 원천 데이터의 권리는 각 제공 기관에 있습니다. 출처를 밝힌 비상업적 인용은 허용합니다.</p>
    </StaticDoc>
  );
}
