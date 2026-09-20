import os
from datetime import datetime, timedelta, timezone
from jose import jwt

SECRET_KEY = os.getenv("SECRET_KEY", "lomustrack-secret-key-change-in-production")
LEGACY_SECRET_KEY = "lomustrack-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 days


def _secret_candidates() -> list[str]:
    candidates = [SECRET_KEY, LEGACY_SECRET_KEY]
    seen = set()
    ordered = []
    for secret in candidates:
        if secret and secret not in seen:
            ordered.append(secret)
            seen.add(secret)
    return ordered


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    if not token:
        return None

    for secret in _secret_candidates():
        try:
            return jwt.decode(token, secret, algorithms=[ALGORITHM])
        except Exception:
            continue

    return None
