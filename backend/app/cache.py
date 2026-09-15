"""TTL 캐시 + stale-while-error.

- 외부 API(FRED·DART·원자료)를 요청마다 호출하지 않도록 메모리에 보관한다.
- 수명이 지나면 새로 받아오되, 실패하면 직전 값을 그대로 돌려준다(서비스 무중단).
- 같은 키에 동시 요청이 몰리면 한 번만 호출한다(asyncio.Lock).
"""
import asyncio
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable


@dataclass
class Entry:
    value: Any
    fetched_at: float
    ttl: int

    @property
    def fresh(self) -> bool:
        return time.time() - self.fetched_at < self.ttl


class TTLCache:
    def __init__(self) -> None:
        self._store: dict[str, Entry] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self.stats = {"hit": 0, "miss": 0, "stale": 0}

    def _lock(self, key: str) -> asyncio.Lock:
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
        return self._locks[key]

    async def get_or_fetch(self, key: str, ttl: int, fetch: Callable[[], Awaitable[Any]]) -> Any:
        e = self._store.get(key)
        if e and e.fresh:
            self.stats["hit"] += 1
            return e.value
        async with self._lock(key):
            e = self._store.get(key)
            if e and e.fresh:
                self.stats["hit"] += 1
                return e.value
            try:
                value = await fetch()
                self._store[key] = Entry(value, time.time(), ttl)
                self.stats["miss"] += 1
                return value
            except Exception:
                if e is not None:              # 직전 값으로 버틴다
                    self.stats["stale"] += 1
                    return e.value
                raise

    def invalidate(self, prefix: str = "") -> int:
        keys = [k for k in self._store if k.startswith(prefix)]
        for k in keys:
            del self._store[k]
        return len(keys)

    def describe(self) -> dict:
        now = time.time()
        return {
            "stats": self.stats,
            "keys": {k: {"age_sec": round(now - e.fetched_at), "ttl": e.ttl, "fresh": e.fresh}
                     for k, e in self._store.items()},
        }


cache = TTLCache()
