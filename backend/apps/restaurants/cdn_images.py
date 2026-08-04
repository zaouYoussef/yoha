"""Proxy d'images CDN externes — les clients ne voient que des URLs YoHa.

Les URLs sources (hébergeurs partenaires) restent en base / sync interne ;
l'API publique ne renvoie que `/api/v1/media/i/<token>/` (token chiffré opaque).
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import logging
from urllib.parse import urlparse

from django.conf import settings

logger = logging.getLogger(__name__)

PROXY_PATH_PREFIX = "/api/v1/media/i/"

# Hôtes autorisés en amont du proxy (anti-SSRF).
_ALLOWED_HOST_SUFFIXES = (
    "dhmedia.io",
    "deliveryhero.io",
)

_HOST_MARKERS = (
    "dhmedia.io",
    "deliveryhero.io",
    "glovoapp.com",
)


def _signing_key() -> bytes:
    raw = getattr(settings, "CDN_PROXY_SECRET", None) or settings.SECRET_KEY
    return hashlib.sha256(str(raw).encode("utf-8")).digest()


def is_broken_cdn_url(url: str) -> bool:
    low = (url or "").lower()
    return "cloudfront.net" in low or "d52ouboplz7yg" in low


def needs_cdn_proxy(url: str) -> bool:
    if not url or not isinstance(url, str):
        return False
    if PROXY_PATH_PREFIX in url:
        return False
    if is_broken_cdn_url(url):
        return False
    low = url.lower()
    return any(m in low for m in _HOST_MARKERS)


def is_allowed_upstream(url: str) -> bool:
    """Valide strictement l'URL avant fetch (pas de proxy ouvert)."""
    if not url or not isinstance(url, str):
        return False
    if is_broken_cdn_url(url):
        return False
    try:
        parsed = urlparse(url.strip())
    except Exception:  # noqa: BLE001
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.hostname or "").lower()
    if not host:
        return False
    return any(host == s or host.endswith("." + s) for s in _ALLOWED_HOST_SUFFIXES)


def _xor_stream(data: bytes, key: bytes, iv: bytes) -> bytes:
    out = bytearray(len(data))
    counter = 0
    offset = 0
    while offset < len(data):
        block = hashlib.sha256(key + iv + counter.to_bytes(4, "big")).digest()
        take = min(len(block), len(data) - offset)
        for i in range(take):
            out[offset + i] = data[offset + i] ^ block[i]
        offset += take
        counter += 1
    return bytes(out)


def encode_cdn_token(url: str) -> str:
    """Token opaque déterministe : HMAC + IV dérivé + XOR (cache navigateur OK)."""
    key = _signing_key()
    plain = url.encode("utf-8")
    # IV dérivé de l'URL → même image = même token (cache HTTP / CDN).
    iv = hmac.new(key, b"cdn-iv:" + plain, hashlib.sha256).digest()[:8]
    cipher = _xor_stream(plain, key, iv)
    sig = hmac.new(key, iv + cipher, hashlib.sha256).digest()[:8]
    return base64.urlsafe_b64encode(sig + iv + cipher).decode("ascii").rstrip("=")


def decode_cdn_token(token: str) -> str | None:
    if not token or not isinstance(token, str):
        return None
    token = token.strip().rstrip("/")
    pad = "=" * (-len(token) % 4)
    try:
        raw = base64.urlsafe_b64decode(token + pad)
    except Exception:  # noqa: BLE001
        return None
    # sig(8) + iv(8) + cipher
    if len(raw) < 17:
        return None
    sig, iv, cipher = raw[:8], raw[8:16], raw[16:]
    key = _signing_key()
    expected = hmac.new(key, iv + cipher, hashlib.sha256).digest()[:8]
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        url = _xor_stream(cipher, key, iv).decode("utf-8")
    except UnicodeDecodeError:
        return None
    if not is_allowed_upstream(url):
        return None
    return url


def _normalize_upstream(url: str, *, kind: str | None = None) -> str:
    """Normalise les URLs image partenaires avant signature / fetch."""
    try:
        from apps.restaurants.glovo import normalize_glovo_image_url

        fixed = normalize_glovo_image_url(url, kind=kind)
        return fixed or url
    except Exception:  # noqa: BLE001
        return url


def publicize_image_url(url: str, *, kind: str | None = None) -> str:
    """Réécrit une URL CDN externe en chemin proxy YoHa ; laisse le reste intact."""
    if not url or not isinstance(url, str):
        return ""
    trimmed = url.strip()
    if not trimmed:
        return ""
    if PROXY_PATH_PREFIX in trimmed:
        return trimmed
    if is_broken_cdn_url(trimmed):
        return ""
    if not needs_cdn_proxy(trimmed):
        return trimmed

    normalized = _normalize_upstream(trimmed, kind=kind)
    if not normalized or is_broken_cdn_url(normalized):
        return ""
    if not is_allowed_upstream(normalized):
        return ""

    token = encode_cdn_token(normalized)
    return f"{PROXY_PATH_PREFIX}{token}/"


def absolute_public_image_url(url: str) -> str:
    """Comme publicize_image_url, mais URL absolue (e-mails, push)."""
    path = publicize_image_url(url)
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    base = getattr(settings, "YOHA_FRONTEND_URL", "https://yoha.ma").rstrip("/")
    return f"{base}{path}"


# Slugs dont les photos catalogue portent encore un watermark coin (ex. logo partenaire).
CORNER_CROP_RESTAURANT_SLUGS = frozenset({"beug-s-restaurant"})


def with_corner_crop(proxy_url: str) -> str:
    """Ajoute ?crop=corner au proxy pour zoomer / masquer un watermark coin."""
    if not proxy_url or PROXY_PATH_PREFIX not in proxy_url:
        return proxy_url or ""
    if "crop=corner" in proxy_url:
        return proxy_url
    sep = "&" if "?" in proxy_url else "?"
    return f"{proxy_url}{sep}crop=corner"
