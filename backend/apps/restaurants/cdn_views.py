"""Vue proxy images — stream CDN partenaire, anti-SSRF."""
from __future__ import annotations

import io
import ipaddress
import logging
import socket
from urllib.parse import urlparse

import requests
from django.http import HttpResponse, StreamingHttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.restaurants.cdn_images import decode_cdn_token, is_allowed_upstream

logger = logging.getLogger(__name__)

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)
_CHUNK = 64 * 1024
_MAX_BYTES = 8 * 1024 * 1024  # 8 Mo


class CdnProxyThrottle(AnonRateThrottle):
    rate = "120/minute"


def _is_public_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return not (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_reserved
        or addr.is_multicast
        or addr.is_unspecified
    )


def _host_resolves_public(hostname: str) -> bool:
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False
    ips = {info[4][0] for info in infos if info[4]}
    return bool(ips) and all(_is_public_ip(ip) for ip in ips)


def _zoom_crop_corner_logo(raw: bytes) -> tuple[bytes, str] | None:
    """Zoom + crop biaisé pour masquer un watermark en haut à droite."""
    try:
        from PIL import Image
    except ImportError:
        return None
    try:
        im = Image.open(io.BytesIO(raw))
        im.load()
    except Exception:  # noqa: BLE001
        return None

    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGB")

    w, h = im.size
    if w < 40 or h < 40:
        return None

    # Garde ~78 % du cadre, ancré bas-gauche → coupe plus le coin haut-droit.
    keep = 0.78
    zw, zh = max(1, int(w * keep)), max(1, int(h * keep))
    left = max(0, int((w - zw) * 0.22))
    top = max(0, int((h - zh) * 0.62))
    right = min(w, left + zw)
    bottom = min(h, top + zh)
    cropped = im.crop((left, top, right, bottom))

    out = io.BytesIO()
    cropped.save(out, format="WEBP", quality=86, method=4)
    return out.getvalue(), "image/webp"


class CdnImageProxyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [CdnProxyThrottle]

    def get(self, request, token: str):
        url = decode_cdn_token(token)
        if not url or not is_allowed_upstream(url):
            return HttpResponse(status=404)

        parsed = urlparse(url)
        if parsed.scheme != "https":
            return HttpResponse(status=404)
        host = parsed.hostname or ""
        if not host or not _host_resolves_public(host):
            return HttpResponse(status=404)

        want_corner_crop = str(request.query_params.get("crop") or "").strip().lower() == "corner"

        try:
            upstream = requests.get(
                url,
                timeout=12,
                stream=not want_corner_crop,
                allow_redirects=False,
                headers={
                    "User-Agent": _UA,
                    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                },
            )
        except requests.RequestException:
            logger.warning("cdn_proxy_fetch_failed", exc_info=True)
            return HttpResponse(status=502)

        if upstream.status_code != 200:
            upstream.close()
            return HttpResponse(status=404)

        content_type = (upstream.headers.get("Content-Type") or "image/jpeg").split(";")[0].strip()
        if not (
            content_type.startswith("image/")
            or content_type in ("application/octet-stream", "binary/octet-stream")
        ):
            upstream.close()
            return HttpResponse(status=404)

        cl = upstream.headers.get("Content-Length")
        if cl and cl.isdigit() and int(cl) > _MAX_BYTES:
            upstream.close()
            return HttpResponse(status=404)

        if want_corner_crop:
            raw = b""
            try:
                for chunk in upstream.iter_content(chunk_size=_CHUNK):
                    if not chunk:
                        continue
                    raw += chunk
                    if len(raw) > _MAX_BYTES:
                        upstream.close()
                        return HttpResponse(status=404)
            finally:
                upstream.close()

            processed = _zoom_crop_corner_logo(raw)
            if processed:
                body, ctype = processed
                response = HttpResponse(body, content_type=ctype)
                response["Cache-Control"] = "public, max-age=604800, immutable"
                response["X-Content-Type-Options"] = "nosniff"
                response["Content-Disposition"] = "inline"
                return response

            # Fallback : image brute si Pillow échoue
            response = HttpResponse(raw, content_type=content_type or "image/jpeg")
            response["Cache-Control"] = "public, max-age=604800, immutable"
            response["X-Content-Type-Options"] = "nosniff"
            response["Content-Disposition"] = "inline"
            return response

        def _iter():
            total = 0
            try:
                for chunk in upstream.iter_content(chunk_size=_CHUNK):
                    if not chunk:
                        continue
                    total += len(chunk)
                    if total > _MAX_BYTES:
                        break
                    yield chunk
            finally:
                upstream.close()

        response = StreamingHttpResponse(_iter(), content_type=content_type or "image/jpeg")
        response["Cache-Control"] = "public, max-age=604800, immutable"
        response["X-Content-Type-Options"] = "nosniff"
        response["Content-Disposition"] = "inline"
        return response
