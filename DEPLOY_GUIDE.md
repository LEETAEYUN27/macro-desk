# 글로벌 경제 관제실 웹 서비스 - 구축·배포·검색 등록·수익화 가이드

작성일 2026. 9. 15.

---

## 0. 결론 요약 (먼저 확인할 사항)

| 구분 | 요청 원안 | 확인 결과 | 적용안 |
|---|---|---|---|
| 프런트 호스팅 | Vercel 무료(Hobby) | **Hobby 요금제는 애드센스 등 광고 게재를 '상업적 이용'으로 규정하여 금지** (Vercel Fair Use Guidelines) | **Cloudflare Pages 정적 배포(무료)** 기본. Vercel 사용 시 Pro(월 $20, 약 2만 7천 원) 필요 |
| 백엔드 호스팅 | Render 무료 | 15분 무요청 시 정지, 재기동 약 1분, Render 문서상 "운영용 사용 금지" | 정적 빌드 방식으로 **방문자는 Render 를 직접 호출하지 않음** → 무료로도 문제 없음. 실시간 API 공개 시 Starter(월 $7, 약 9천 원) |
| 도메인 | 미정 | **애드센스는 `*.vercel.app`·`*.pages.dev` 같은 하위 도메인 신청 불가**(사이트 소유 요건) | `.com`/`.kr` 도메인 구입 필수 (연 비용은 등록업체·확장자별 상이) |
| 유사투자자문업 | - | 금융위원회 법령해석 : **광고수익만 발생하고 누구나 무료로 보는 경우 신고 불필요**. 유료 회원제·개별 상담 시 신고·등록 대상 | 매수·매도 권유 문구를 넣지 않고, 유료 멤버십을 운영하지 않음 |
| 네이버 노출 | - | 등록 후 수집까지 통상 2주 이상, 노출은 보장되지 않음 | 서치어드바이저 등록 + 사이트맵·RSS 제출 + 지표별 해설 페이지 15종으로 키워드 유입 확보 |

**추가 유의 사항**

- Yahoo Finance 시세는 약관상 상업적 재배포가 제한됩니다. 트래픽이 커지면 시세 원천을 공식 유료 API(예 : Financial Modeling Prep, 한국투자증권 Open API)로 교체하는 것을 권장합니다. FRED·뉴욕연준·SEC 는 공공 데이터입니다. 단, FRED 내 일부 제3자 저작권 계열(S&P/케이스-실러 등)은 출처 표기가 필요합니다.
- 재직 중 광고 수익 발생은 회사 취업규칙의 겸업 조항 해당 여부를 사전에 확인하시기 바랍니다.

---

## 1단계. 전체 프로젝트 폴더 구조

```
macro-web/
├─ .github/workflows/
│  └─ deploy-frontend.yml        매일 07:40 KST 정적 빌드 → Cloudflare Pages 배포
├─ backend/                      FastAPI (Render 배포)
│  ├─ app/
│  │  ├─ main.py                 라우터 : dashboard · markets · indicators · report · disclosures · cache
│  │  ├─ config.py               환경 변수 (TTL·API 키·CORS)
│  │  ├─ cache.py                TTL 캐시 + 장애 시 직전 값 반환 + 동시요청 1회 호출
│  │  ├─ sources/
│  │  │  ├─ payload.py           기존 수집기 payload.json 수신 (1차 원천)
│  │  │  ├─ fred.py              FRED CSV 직접 조회 (API 키 불필요)
│  │  │  ├─ dart.py              Open DART 주요 공시 필터링
│  │  │  └─ http.py              공용 비동기 HTTP 클라이언트
│  │  └─ services/
│  │     ├─ transform.py         대용량 원자료 → 화면용 경량 응답 (672KB → 34KB)
│  │     ├─ indicators.py        지표 15종 정의 : 현재값·추이·규칙 해석·상시 설명문
│  │     └─ insight.py           데이터 기반 자동 해설 (LLM 미사용, 비용 0)
│  ├─ data/payload.sample.json   원천 장애 시 비상 스냅샷
│  ├─ tests/test_api.py
│  ├─ requirements.txt · render.yaml · .env.example
└─ frontend/                     Next.js + Tailwind (Cloudflare Pages 배포)
   ├─ app/
   │  ├─ layout.tsx              공통 메타태그·소유확인·OG·애드센스 스크립트·JSON-LD
   │  ├─ page.tsx                메인 대시보드 (동적 title/description/OG)
   │  ├─ report/                 오늘의 거시경제 브리핑
   │  ├─ indicators/[slug]/      지표 해설 15종 (검색 유입 핵심)
   │  ├─ markets/[slug]/         지수·원자재·환율·섹터·리츠 6종
   │  ├─ about · privacy · terms · contact   애드센스 심사 필수 페이지
   │  ├─ sitemap.ts · robots.ts · rss.xml/ · ads.txt/
   ├─ components/                Shell · AdSlot · charts(Gauge·LineChart·Sparkline) · MarketTable
   ├─ lib/                       api.ts(재시도·ISR) · site.ts · format.ts · types.ts
   └─ public/                    og.png · icon.svg
```

**데이터 흐름**

```
[GitHub Actions 07:00]  macro-console 수집기 ─ payload.json ─┐
                                                           ▼
[Render] FastAPI ── TTL 캐시(원자료 30분 · FRED 6시간 · DART 10분) ── /api/*
                                                           ▼
[GitHub Actions 07:40]  Next.js 정적 빌드 (HTML 34페이지) ──▶ [Cloudflare Pages CDN] ──▶ 방문자·네이버 Yeti·Googlebot
```

- 방문자·검색 로봇은 완성된 HTML 만 받습니다. 자바스크립트 실행 없이 본문이 보이므로 네이버 수집에 유리하며, Render 정지·지연의 영향을 받지 않습니다.

---

## 2단계. FastAPI 백엔드

### API 목록

| 경로 | 내용 | 캐시 |
|---|---|---|
| `GET /api/dashboard` | 안정성 점수·7축·지표 10종·자동 해설·금리 확률·쏠림·등락 상위·시장 6그룹·일정·13F | 원자료 30분 |
| `GET /api/markets/{slug}` | indices / commodities / fx-rates / us-sectors / kr-sectors / real-estate | 30분 |
| `GET /api/indicators` · `/{slug}` | 지표 15종 현재값·추이·해석·설명 | FRED 6시간 |
| `GET /api/report/daily` | 일일 브리핑 문안 | 30분 |
| `GET /api/disclosures` | Open DART 코스피·코스닥 주요 공시 (유상증자·CB·자사주·공급계약 등) | 10분 |
| `GET /api/cache` · `POST /api/cache/refresh` | 캐시 상태 조회 · 강제 갱신(토큰) | - |

### 캐싱 구조 (`app/cache.py`)

- 수명 내 요청 : 메모리에서 즉시 반환
- 수명 경과 : 원천 재호출, **실패 시 직전 값 반환**(서비스 무중단)
- 같은 키 동시 요청 : `asyncio.Lock` 으로 1회만 호출 (FRED·DART 호출 한도 보호)
- 원자료 원격 수신 실패 + 캐시 없음 : `data/payload.sample.json` 사용, 화면에 "직전 스냅샷 표시 중" 표기

### 기존 로직 이식 방식

- **시세·13F·침체확률·CAPE** : 기존 `build_console.py` 가 GitHub Actions 에서 수집 (Yahoo 는 Render·클라우드 IP 차단 빈번 → 검증된 경로 유지)
- **FRED 계열**(`fred()` 함수) : 백엔드로 이식하여 25년 추이를 직접 제공
- **안정성 산식** : 기존 7축 단순평균 그대로 사용 (payload 의 결과값 활용)

---

## 3단계. React(Next.js) + Tailwind 대시보드

| 컴포넌트 | 역할 |
|---|---|
| `Shell` | 좌측 세로 내비 + 얇은 상단 바 + 하단 면책·출처 (모바일은 가로 스크롤 메뉴) |
| `Gauge` | 경제 안정성 반원 게이지 (구간별 색상) |
| `ScoreBar` | 7축 점수 막대, 각 축 이름이 해당 지표 해설 페이지로 연결 |
| 자동 해설 카드 | 파란 헤더 1줄 요약 + 본문 5단락 + ✓ 요약 박스 (애드센스 '고유 텍스트' 요건 대응) |
| `LineChart` · `Sparkline` | 서버 렌더링 SVG 차트 (외부 라이브러리 없음, 초기 로딩 경량) |
| `MarketTable` | 현재가·1일·1주·1개월·3개월·연초 대비, 상승 빨강 / 하락 파랑 |
| `AdSlot` | 상단(가로)·측면(세로, 2xl 화면 이상)·본문 삽입형 구좌. **애드센스 ID 미설정 시 아무것도 출력하지 않음**(빈 광고 상자로 인한 심사 불이익 방지), 구좌 높이 사전 확보로 레이아웃 흔들림 방지 |

**광고 구좌 배치**

- 대시보드 : 제목 아래 가로 1 · 금리/쏠림 카드 아래 본문형 1 · 우측 세로 1(초광폭 화면)
- 지표 해설 : 차트와 설명문 사이 본문형 1
- 브리핑 : 2단락 뒤 본문형 1
- 초기에는 **애드센스 자동광고를 끄고 수동 구좌만** 사용하는 것을 권장합니다(자동광고는 표·차트 사이에 과도하게 삽입됨).

---

## 4단계. SEO 구성

| 항목 | 구현 위치 | 내용 |
|---|---|---|
| 네이버 소유확인 | `layout.tsx` `verification.other` | `<meta name="naver-site-verification" content="…">` (환경변수 `NAVER_SITE_VERIFICATION`) |
| 구글 소유확인 | `layout.tsx` `verification.google` | `<meta name="google-site-verification" content="…">` |
| 동적 title·description | `page.tsx` 등 `generateMetadata` | 예 : "오늘의 경제 안정성 73.0점(안정)", "장단기 금리차 현재 0.86%p - 추이와 해석" |
| Open Graph·Twitter 카드 | 각 페이지 | 제목·설명 동적, 이미지 `og.png`(1200×630) |
| canonical | 각 페이지 | 끝 슬래시 포함 URL 로 통일 |
| 구조화 데이터 | JSON-LD | WebSite · Article · NewsArticle · BreadcrumbList |
| `sitemap.xml` | `app/sitemap.ts` | 28개 URL, 지표 목록은 API 에서 자동 반영 |
| `robots.txt` | `app/robots.ts` | 전체 허용 + Yeti(네이버)·Mediapartners-Google(애드센스) 명시 + 사이트맵 경로 |
| `rss.xml` | `app/rss.xml/route.ts` | 네이버 RSS 제출용, 매일 브리핑·지표 항목 |
| `ads.txt` | `app/ads.txt/route.ts` | 애드센스 ID 설정 시 `google.com, pub-…, DIRECT, f08c47fec0942fa0` 자동 생성 |

**검증 결과(로컬 빌드)** : 34페이지 생성, 전 경로 200 응답, 가로 스크롤 없음(400px 모바일 포함), 콘솔 오류 0건, 소유확인 태그·애드센스 코드·ads.txt 출력 확인.

---

## 5단계. 배포 및 검색 등록 절차

### 5-1. 사전 준비 (본인 계정·결제 필요)

1. 도메인 구입 : Cloudflare Registrar(원가 판매) 또는 가비아·후이즈. 예 : `macrodesk.kr`
2. 계정 : GitHub(보유) · Cloudflare · Render · 네이버 · Google(서치콘솔·애드센스)
3. Open DART 인증키(선택) : opendart.fss.or.kr → 인증키 신청

### 5-2. GitHub 저장소

1. 새 저장소 `macro-web` 생성 (Private 가능 : 배포를 GitHub Actions 가 수행하므로 무료 한도 월 2,000분 안에서 충분)
2. 압축 파일 내용 전체를 업로드 (`.github`, `.gitignore` 숨김 항목 포함)

### 5-3. 백엔드 - Render

1. render.com → **New + → Blueprint** → `macro-web` 저장소 선택 → `backend/render.yaml` 자동 인식
2. 환경변수 입력
   - `CORS_ORIGINS` = `https://구입도메인,https://www.구입도메인`
   - `DART_API_KEY` = 발급 키(선택)
   - `REFRESH_TOKEN` = 자동 생성값 확인 후 복사
3. 배포 완료 후 `https://macro-console-api.onrender.com/api/health` 가 `{"ok":true}` 이면 정상

### 5-4. 프런트엔드 - Cloudflare Pages

1. Cloudflare 대시보드 → **Workers & Pages → Create → Pages → Direct Upload** → 프로젝트명 `macro-web` 생성 (배포는 GitHub Actions 가 수행)
2. **Custom domains** → 구입 도메인 연결 (Cloudflare 에서 산 도메인이면 자동 설정)
3. API 토큰 발급 : My Profile → API Tokens → Create Token → "Cloudflare Pages : Edit" 권한
4. GitHub 저장소 → Settings → Secrets and variables → Actions
   - **Secrets** : `API_BASE_URL`(Render 주소) · `REFRESH_TOKEN` · `CLOUDFLARE_API_TOKEN` · `CLOUDFLARE_ACCOUNT_ID`
   - **Variables** : `SITE_URL`(https://구입도메인) · `CF_PROJECT_NAME`(macro-web) · `CONTACT_EMAIL`
5. Actions → 「웹사이트 일일 재배포」 → Run workflow → 초록색 완료 후 도메인 접속 확인

> Vercel 을 쓰실 경우 : Pro 요금제 가입 후 Root Directory `frontend`, 환경변수 동일 입력(`STATIC_EXPORT` 미설정 → ISR 1시간 자동 갱신). 이 경우 위 GitHub Actions 는 삭제합니다.

### 5-5. 네이버 서치어드바이저 등록

1. searchadvisor.naver.com → 로그인 → **웹마스터 도구 → 사이트 관리**
2. 사이트 URL 입력 : `https://구입도메인` (끝 슬래시·파라미터 없이)
3. 소유확인 → **HTML 태그** 선택 → `content="…"` 안의 값만 복사
4. GitHub Variables 에 `NAVER_SITE_VERIFICATION` 추가 → Actions 재실행 → 배포 후 **소유확인** 버튼
   - HTML 파일 방식은 갱신 불필요, 메타태그 방식은 연 1회 재확인이 필요할 수 있습니다.
5. **요청 → 사이트맵 제출** : `https://구입도메인/sitemap.xml`
6. **요청 → RSS 제출** : `https://구입도메인/rss.xml`
7. **요청 → 웹 페이지 수집** : 메인·`/indicators/yield-curve/` 등 핵심 URL 개별 요청
8. **검증 → robots.txt** 에서 수집 허용 확인, **사이트 최적화** 점검 항목 확인
9. 수집·노출까지 통상 2주 이상 소요

### 5-6. 구글 서치콘솔

1. search.google.com/search-console → **URL 접두어** → 도메인 입력
2. HTML 태그 방식 → 값을 `GOOGLE_SITE_VERIFICATION` 변수에 입력 → 재배포 → 확인
3. Sitemaps 메뉴에 `sitemap.xml` 제출

### 5-7. 구글 애드센스 신청

1. **권장 시점** : 도메인 연결 후 2~4주, 검색 수집이 시작된 뒤
2. adsense.google.com → 사이트 추가 → 발급된 `ca-pub-…` 를 `ADSENSE_CLIENT` 변수에 입력 → 재배포 (심사용 코드 삽입 + ads.txt 자동 생성)
3. 심사 통과 후 **광고 → 광고 단위별** 에서 디스플레이 광고 3개 생성 → 슬롯 번호를 `AD_SLOT_TOP` · `AD_SLOT_SIDE` · `AD_SLOT_INARTICLE` 에 입력 → 재배포
4. 승인에 유리한 요소(구현 완료) : 개인정보처리방침(구글 광고 쿠키 고지 포함) · 이용약관 · 소개 · 문의 페이지, 지표별 고유 해설문, 모바일 대응
5. 심사 전 보완 권장 : 문의 이메일 설정, 지표 해설문을 페이지당 1,000자 이상으로 확장

---

## 6. SNS 홍보 실행안

| 채널 | 방식 | 주기 | 유의 |
|---|---|---|---|
| X(트위터)·스레드 | 매일 07:40 "오늘의 안정성 점수 + 한 줄 해설 + 링크" (OG 카드 자동 표시) | 매일 | 해시태그 3개 이내 (#미국증시 #FOMC #환율) |
| 네이버 블로그 | 주 1회 "이번 주 거시지표 정리" 글 + 사이트 링크 | 주 1회 | 블로그 자체도 네이버 검색 유입 창구 |
| 인스타그램 | 주요 지표 4장 카드뉴스 | 주 2회 | 링크는 프로필에만 가능 |
| 주식 커뮤니티 | FOMC·CPI 발표일 등 이벤트 당일 정보성 글 | 이벤트 시 | 대부분 홍보 목적 링크 금지 규정 → 정보 본문 위주, 링크는 허용 게시판만 |
| 텔레그램 채널 | 매일 브리핑 자동 발송 | 매일 | 구독자 누적형 재방문 채널 |

- 핵심 원칙 : 매수·매도 추천이 아니라 **"매일 아침 확인하는 거시 지표 요약"** 으로 포지셔닝 (유사투자자문 논란 회피 + 신뢰 확보)
- FOMC(9/16·10/28·12/9)·CPI 발표일은 검색량이 급증하므로 해당 지표 페이지를 전날 미리 공유
