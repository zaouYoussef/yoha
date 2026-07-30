from decimal import Decimal
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.db.models import Count, Avg, Sum, Q, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AnalyticsEvent
from .serializers import AnalyticsEventSerializer, AnalyticsDashboardSerializer
from apps.core.permissions import IsAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


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


class TrackEventView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data.copy()
        if request.user.is_authenticated:
            data["user"] = request.user.pk
        data["session_id"] = request.data.get("session_id", "")
        data["user_agent"] = request.META.get("HTTP_USER_AGENT", "")[:500]
        data["ip"] = request.META.get("REMOTE_ADDR")
        ser = AnalyticsEventSerializer(data=data)
        if ser.is_valid():
            ser.save()
            return Response({"ok": True}, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class AnalyticsDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        days = int(request.GET.get("days", 7))
        since = timezone.now() - timezone.timedelta(days=days)

        events = AnalyticsEvent.objects.filter(created_at__gte=since)
        pageviews = events.filter(category="pageview")
        total_pageviews = pageviews.count()
        unique_visitors = events.values("session_id").distinct().count()
        total_sessions = events.filter(category="session", label__startswith="start").count()

        avg_duration = (
            events.filter(category="pageview", duration_ms__isnull=False)
            .aggregate(avg=Avg("duration_ms"))["avg"]
            or 0
        ) / 1000.0

        top_pages = list(
            pageviews.values("path")
            .annotate(count=Count("id"))
            .order_by("-count")[:15]
        )

        top_restaurants = list(
            events.filter(category="restaurant_view")
            .values("label")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        daily_views = list(
            pageviews.annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        recent = list(
            events.select_related("user").order_by("-created_at")[:30].values(
                "category", "label", "path", "created_at",
            )
        )

        data = AnalyticsDashboardSerializer({
            "total_pageviews": total_pageviews,
            "unique_visitors": unique_visitors,
            "total_sessions": total_sessions,
            "avg_duration_seconds": round(avg_duration, 1),
            "top_pages": top_pages,
            "top_restaurants": top_restaurants,
            "daily_views": daily_views,
            "recent_events": recent,
        }).data
        return Response(data)


class ClientsAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.orders.models import Order
        clients = User.objects.filter(role="client").order_by("-created_at")
        data = []
        for c in clients:
            orders_qs = Order.objects.filter(client=c)
            total_orders = orders_qs.count()
            total_spent = orders_qs.aggregate(s=Sum("total_mad"))["s"] or Decimal("0")
            last_order = orders_qs.order_by("-created_at").first()
            restaurant_counts = list(
                orders_qs.annotate(restaurant_name=F("restaurant__name"))
                .values("restaurant_name")
                .annotate(cnt=Count("id"))
                .order_by("-cnt")[:5]
            )

            events = AnalyticsEvent.objects.filter(user=c)
            total_views = events.filter(category="pageview").count()
            total_time = (
                events.filter(category="pageview", duration_ms__isnull=False)
                .aggregate(s=Sum("duration_ms"))["s"]
                or 0
            )
            restaurant_views = (
                events.filter(category="restaurant_view")
                .values("label")
                .annotate(cnt=Count("id"))
                .order_by("-cnt")[:5]
            )

            data.append({
                "id": str(c.id),
                "email": c.email,
                "display_name": c.display_name,
                "phone": c.phone,
                "is_active": c.is_active,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "last_login": c.last_login.isoformat() if c.last_login else None,
                "total_orders": total_orders,
                "total_spent_mad": float(total_spent),
                "avg_order_mad": round(float(total_spent) / total_orders, 2) if total_orders else 0,
                "last_order_date": last_order.created_at.isoformat() if last_order else None,
                "last_order_status": last_order.status if last_order else None,
                "last_order_restaurant": last_order.restaurant_name if last_order else None,
                "favorite_restaurants": restaurant_counts,
                "total_page_views": total_views,
                "total_time_seconds": round(total_time / 1000, 1),
                "restaurants_viewed": list(restaurant_views),
            })
        return Response(data)


class ClientDetailAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        from apps.orders.models import Order
        try:
            client = User.objects.get(pk=pk, role="client")
        except User.DoesNotExist:
            return Response({"error": "Client non trouvé"}, status=404)

        orders_qs = Order.objects.filter(client=client).order_by("-created_at")
        orders_list = list(orders_qs.annotate(
            restaurant_name=F("restaurant__name")
        ).values(
            "public_id", "restaurant_name", "status", "total_mad",
            "customer_name", "customer_address", "delivery_instructions",
            "created_at", "eta_minutes",
        ))

        events = AnalyticsEvent.objects.filter(user=client).order_by("-created_at")[:100]
        events_list = list(events.values(
            "category", "label", "path", "metadata", "duration_ms", "created_at"
        ))

        page_views_by_day = list(
            AnalyticsEvent.objects.filter(user=client, category="pageview")
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        return Response({
            "client": {
                "id": str(client.id),
                "email": client.email,
                "display_name": client.display_name,
                "phone": client.phone,
                "is_active": client.is_active,
                "role": client.role,
                "created_at": client.created_at.isoformat() if client.created_at else None,
                "last_login": client.last_login.isoformat() if client.last_login else None,
            },
            "orders": orders_list,
            "events": events_list,
            "page_views_by_day": page_views_by_day,
        })
