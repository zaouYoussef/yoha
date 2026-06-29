from django.conf import settings
from django.core.cache import cache
from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Sonde liveness/readiness pour orchestrateurs (K8s, Docker)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        db_ok = True
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            db_ok = False

        cache_ok = True
        try:
            cache.set("yoha:health", "1", timeout=5)
            cache_ok = cache.get("yoha:health") == "1"
        except Exception:
            cache_ok = False

        healthy = db_ok
        payload = {
            "status": "ok" if healthy else "degraded",
            "database": db_ok,
            "cache": cache_ok,
            "debug": settings.DEBUG,
        }
        code = status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(payload, status=code)


class ReadyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"ready": True})


class RootView(APIView):
    """Page d'accueil API — évite le 404 sur /."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        base = request.build_absolute_uri("/").rstrip("/")
        return Response(
            {
                "name": "YoHa API",
                "version": "1.0.0",
                "status": "running",
                "links": {
                    "docs": f"{base}/api/docs/",
                    "schema": f"{base}/api/schema/",
                    "health": f"{base}/api/v1/health/",
                    "admin": f"{base}/admin/",
                    "auth": f"{base}/api/v1/auth/",
                    "restaurants": f"{base}/api/v1/restaurants/",
                },
            }
        )


from django.http import JsonResponse


def bad_request_handler(request, exception=None):
    return JsonResponse(
        {"error": True, "detail": "Requête incorrecte."},
        status=400
    )


def permission_denied_handler(request, exception=None):
    return JsonResponse(
        {"error": True, "detail": "Accès refusé."},
        status=403
    )


def not_found_handler(request, exception=None):
    return JsonResponse(
        {"error": True, "detail": "Ressource non trouvée."},
        status=404
    )


def server_error_handler(request):
    return JsonResponse(
        {"error": True, "detail": "Une erreur interne est survenue. Veuillez réessayer plus tard."},
        status=500
    )
