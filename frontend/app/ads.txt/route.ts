// 애드센스 승인 후 "승인된 판매자" 확인 파일. pub ID 는 NEXT_PUBLIC_ADSENSE_CLIENT 에서 자동 생성.
export const dynamic = "force-static";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
  const pub = client.replace(/^ca-/, "");
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "# AdSense 승인 후 NEXT_PUBLIC_ADSENSE_CLIENT 설정 시 자동 생성\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
