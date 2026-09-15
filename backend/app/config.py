"""환경 변수 설정. Render 대시보드의 Environment 에서 값을 넣는다."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # 기존 GitHub Actions 수집기(macro-console)가 매일 07:00 KST 에 발행하는 원자료
    payload_url: str = "https://leetaeyun27.github.io/macro-console/payload.json"
    # 원격 수집 실패 시 사용하는 로컬 스냅샷 (개발·비상용)
    payload_fallback_path: str = "data/payload.sample.json"

    # 캐시 수명(초)
    ttl_payload: int = 60 * 30        # 30분 : 원자료는 하루 1회 갱신
    ttl_fred: int = 60 * 60 * 6       # 6시간 : FRED 는 일·주·월 단위 갱신
    ttl_dart: int = 60 * 10           # 10분 : 공시는 장중 수시 발생

    # Open DART 인증키 (https://opendart.fss.or.kr) — 없으면 공시 API 는 빈 목록 반환
    dart_api_key: str = ""

    # 캐시 강제 갱신용 토큰 (POST /api/cache/refresh 헤더 X-Refresh-Token)
    refresh_token: str = ""

    # CORS 허용 도메인 (쉼표 구분)
    cors_origins: str = "http://localhost:3000"

    contact_ua: str = "macro-web (contact: a01092796847@gmail.com)"


@lru_cache
def get_settings() -> Settings:
    return Settings()
