"""Vue proxy images — stream depuis CDN partenaire, URL opaque côté client."""
from __future__ import annotations

import logging

import requests
from django.http import HttpResponse, StreamingHttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.restaurants.cdn_images import decode_cdn_token

logger = logging.getLogger(__name__)

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)
_CHUNK = 64 * 1024


class CdnImageProxyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token: str):
        url = decode_cdn_token(token)
        if not url:
            return HttpResponse(status=404)

        try:
            upstream = requests.get(
                url,
                timeout=15,
                stream=True,
                headers={
                    "User-Agent": _UA,
                    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                    # Pas de Referer partenaire — le navigateur client ne voit que YoHa.
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

        def _iter():
            try:
                for chunk in upstream.iter_content(chunk_size=_CHUNK):
                    if chunk:
                        yield chunk
            finally:
                upstream.close()

        response = StreamingHttpResponse(_iter(), content_type=content_type or "image/jpeg")
        response["Cache-Control"] = "public, max-age=604800, immutable"
        response["X-Content-Type-Options"] = "nosniff"
        # Ne jamais exposer l'URL amont
        response["Content-Disposition"] = "inline"
        return response
