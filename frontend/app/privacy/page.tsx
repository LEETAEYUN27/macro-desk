import type { Metadata } from "next";
import StaticDoc from "@/components/StaticDoc";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "개인정보처리방침", alternates: { canonical: "/privacy/" } };

export default function Privacy() {
  return (
    <StaticDoc title="개인정보처리방침" updated="2026. 9. 15.">
      <p>{SITE.name}(이하 &quot;서비스&quot;)은 회원가입 없이 이용하는 서비스로, 이용자의 이름·연락처 등 개인정보를 직접 수집하지 않습니다.</p>
      <h2>1. 자동 수집 정보</h2>
      <p>서비스 이용 과정에서 접속 IP, 브라우저 종류, 방문 일시, 쿠키 등이 서버 로그 및 제3자 도구에 의해 자동 생성·수집될 수 있습니다.</p>
      <h2>2. 광고 및 쿠키</h2>
      <ul>
        <li>본 서비스는 Google AdSense 광고를 게재합니다. Google 을 포함한 제3자 공급업체는 쿠키를 사용하여 이용자의 본 사이트 또는 다른 웹사이트 방문 기록을 바탕으로 광고를 게재합니다.</li>
        <li>Google 은 광고 쿠키를 사용하여 이용자의 본 사이트 및 인터넷상의 다른 사이트 방문 기록에 기반한 맞춤 광고를 제공할 수 있습니다.</li>
        <li>이용자는 <a className="text-brand-700 underline" href="https://adssettings.google.com" rel="noopener" target="_blank">Google 광고 설정</a>에서 맞춤 광고를 해제할 수 있으며, <a className="text-brand-700 underline" href="https://www.aboutads.info" rel="noopener" target="_blank">aboutads.info</a>에서 제3자 공급업체의 쿠키 사용을 해제할 수 있습니다.</li>
        <li>자세한 내용은 <a className="text-brand-700 underline" href="https://policies.google.com/technologies/ads?hl=ko" rel="noopener" target="_blank">Google 광고 정책</a>을 참고하시기 바랍니다.</li>
      </ul>
      <h2>3. 쿠키 거부 방법</h2>
      <p>브라우저 설정에서 쿠키 저장을 거부할 수 있습니다. 쿠키를 거부해도 서비스 이용에는 제한이 없으나 맞춤 광고가 표시되지 않을 수 있습니다.</p>
      <h2>4. 문의</h2>
      <p>개인정보 관련 문의 : {SITE.email || "문의 페이지 참조"}</p>
    </StaticDoc>
  );
}
