import type { Metadata } from "next";
import StaticDoc from "@/components/StaticDoc";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "문의", alternates: { canonical: "/contact/" } };

export default function Contact() {
  return (
    <StaticDoc title="문의">
      <p>데이터 오류 제보, 지표 추가 요청, 제휴 문의는 아래 이메일로 보내주시기 바랍니다.</p>
      <p className="text-lg font-semibold">{SITE.email ? <a className="text-brand-700" href={`mailto:${SITE.email}`}>{SITE.email}</a> : "이메일 설정 필요 (NEXT_PUBLIC_CONTACT_EMAIL)"}</p>
    </StaticDoc>
  );
}
