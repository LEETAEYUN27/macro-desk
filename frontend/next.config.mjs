/** @type {import('next').NextConfig} */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig = {
  // STATIC_EXPORT=1 → out/ 폴더에 순수 HTML 생성 (Cloudflare Pages 등 정적 호스팅용)
  // 미지정 → ISR 서버 모드 (Vercel Pro·Node 서버용)
  ...(staticExport ? { output: "export" } : {}),
  trailingSlash: true, // 네이버·구글 모두 URL 하나로 통일 (canonical 일치)
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
