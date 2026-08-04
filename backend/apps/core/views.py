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

        data = []
        seen_emails: set[str] = set()

        # 1) Comptes inscrits (role=client)
        clients = User.objects.filter(role="client").order_by("-created_at")
        for c in clients:
            email_key = (c.email or "").strip().lower()
            if email_key:
                seen_emails.add(email_key)

            orders_qs = Order.objects.filter(Q(client=c) | Q(customer_email__iexact=email_key)) if email_key else Order.objects.filter(client=c)
            total_orders = orders_qs.count()
            total_spent = orders_qs.aggregate(s=Sum("total_mad"))["s"] or Decimal("0")
            last_order = orders_qs.select_related("restaurant").order_by("-created_at").first()
            restaurant_counts = list(
                orders_qs.values(restaurant_name=F("restaurant__name"))
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

            phone = ""
            try:
                phone = (c.phone or "").strip()
            except Exception:
                phone = ""
            if not phone and last_order:
                try:
                    phone = (last_order.customer_phone or "").strip()
                except Exception:
                    phone = ""

            data.append({
                "id": str(c.id),
                "email": c.email,
                "display_name": c.display_name or (last_order.customer_name if last_order else ""),
                "phone": phone,
                "is_active": c.is_active,
                "is_guest": False,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "last_login": c.last_login.isoformat() if c.last_login else None,
                "total_orders": total_orders,
                "total_spent_mad": float(total_spent),
                "avg_order_mad": round(float(total_spent) / total_orders, 2) if total_orders else 0,
                "last_order_date": last_order.created_at.isoformat() if last_order else None,
                "last_order_status": last_order.status if last_order else None,
                "last_order_restaurant": (
                    last_order.restaurant.name if last_order and last_order.restaurant_id else None
                ),
                "favorite_restaurants": restaurant_counts,
                "total_page_views": total_views,
                "total_time_seconds": round(total_time / 1000, 1),
                "restaurants_viewed": list(restaurant_views),
            })

        # 2) Clients invités (commandes sans compte) — groupés par e-mail ou téléphone/nom
        guest_orders = (
            Order.objects.filter(client__isnull=True)
            .select_related("restaurant")
            .order_by("-created_at")
        )
        guests: dict[str, dict] = {}
        for o in guest_orders:
            email = (o.customer_email or "").strip().lower()
            if email and email in seen_emails:
                continue
            try:
                phone = (o.customer_phone or "").strip()
            except Exception:
                phone = ""
            name = (o.customer_name or "").strip()
            if email:
                key = f"email:{email}"
            elif phone:
                key = f"phone:{phone}"
            elif name:
                key = f"name:{name.lower()}"
            else:
                key = f"order:{o.public_id}"

            g = guests.get(key)
            if not g:
                guests[key] = {
                    "id": f"guest:{key}",
                    "email": email or "",
                    "display_name": name or email or "Client invité",
                    "phone": phone,
                    "is_active": True,
                    "is_guest": True,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                    "last_login": None,
                    "total_orders": 1,
                    "total_spent_mad": float(o.total_mad or 0),
                    "last_order_date": o.created_at.isoformat() if o.created_at else None,
                    "last_order_status": o.status,
                    "last_order_restaurant": o.restaurant.name if o.restaurant_id else None,
                    "favorite_restaurants": {},
                    "total_page_views": 0,
                    "total_time_seconds": 0,
                    "restaurants_viewed": [],
                    "_orders": [o],
                }
            else:
                g["total_orders"] += 1
                g["total_spent_mad"] += float(o.total_mad or 0)
                g["_orders"].append(o)
                if not g["phone"] and phone:
                    g["phone"] = phone
                if name and (not g["display_name"] or g["display_name"] == "Client invité"):
                    g["display_name"] = name

        for g in guests.values():
            resto_map = g.pop("favorite_restaurants")
            orders_list = g.pop("_orders")
            for o in orders_list:
                rname = o.restaurant.name if o.restaurant_id else "—"
                resto_map[rname] = resto_map.get(rname, 0) + 1
            fav = sorted(
                [{"restaurant_name": k, "cnt": v} for k, v in resto_map.items()],
                key=lambda x: -x["cnt"],
            )[:5]
            total_orders = g["total_orders"]
            total_spent = g["total_spent_mad"]
            g["avg_order_mad"] = round(total_spent / total_orders, 2) if total_orders else 0
            g["favorite_restaurants"] = fav
            data.append(g)

        data.sort(key=lambda x: x.get("last_order_date") or x.get("created_at") or "", reverse=True)
        return Response(data)


class ClientDetailAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        from apps.orders.models import Order

        pk_str = str(pk)

        # Détail client invité
        if pk_str.startswith("guest:"):
            key = pk_str[len("guest:"):]
            qs = Order.objects.filter(client__isnull=True).select_related("restaurant").order_by("-created_at")
            matched = []
            display_name = "Client invité"
            email = ""
            phone = ""
            created_at = None

            for o in qs:
                o_email = (o.customer_email or "").strip().lower()
                try:
                    o_phone = (o.customer_phone or "").strip()
                except Exception:
                    o_phone = ""
                o_name = (o.customer_name or "").strip()
                if key.startswith("email:") and o_email == key[6:]:
                    matched.append(o)
                elif key.startswith("phone:") and o_phone == key[6:]:
                    matched.append(o)
                elif key.startswith("name:") and o_name.lower() == key[5:]:
                    matched.append(o)
                elif key.startswith("order:") and o.public_id == key[6:]:
                    matched.append(o)

            if not matched:
                return Response({"error": "Client non trouvé"}, status=404)

            first = matched[-1]
            last = matched[0]
            display_name = (last.customer_name or first.customer_name or "Client invité").strip()
            email = (last.customer_email or first.customer_email or "").strip().lower()
            try:
                phone = (last.customer_phone or first.customer_phone or "").strip()
            except Exception:
                phone = ""
            created_at = first.created_at

            orders_list = []
            for o in matched:
                orders_list.append({
                    "public_id": o.public_id,
                    "restaurant_name": o.restaurant.name if o.restaurant_id else None,
                    "status": o.status,
                    "total_mad": o.total_mad,
                    "customer_name": o.customer_name,
                    "customer_address": o.customer_address,
                    "delivery_instructions": o.delivery_instructions,
                    "created_at": o.created_at,
                    "eta_minutes": o.eta_minutes,
                })

            return Response({
                "client": {
                    "id": pk_str,
                    "email": email,
                    "display_name": display_name,
                    "phone": phone,
                    "is_active": True,
                    "is_guest": True,
                    "role": "guest",
                    "created_at": created_at.isoformat() if created_at else None,
                    "last_login": None,
                },
                "orders": orders_list,
                "events": [],
                "page_views_by_day": [],
                "restaurants_viewed": [],
            })

        try:
            client = User.objects.get(pk=pk, role="client")
        except User.DoesNotExist:
            return Response({"error": "Client non trouvé"}, status=404)
        except Exception:
            return Response({"error": "Client non trouvé"}, status=404)

        email_key = (client.email or "").strip().lower()
        orders_qs = (
            Order.objects.filter(Q(client=client) | Q(customer_email__iexact=email_key))
            if email_key
            else Order.objects.filter(client=client)
        ).order_by("-created_at")

        orders_list = list(
            orders_qs.annotate(restaurant_name=F("restaurant__name")).values(
                "public_id",
                "restaurant_name",
                "status",
                "total_mad",
                "customer_name",
                "customer_address",
                "delivery_instructions",
                "created_at",
                "eta_minutes",
            )
        )

        events = AnalyticsEvent.objects.filter(user=client).order_by("-created_at")[:100]
        events_list = list(
            events.values("category", "label", "path", "metadata", "duration_ms", "created_at")
        )

        page_views_by_day = list(
            AnalyticsEvent.objects.filter(user=client, category="pageview")
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        restaurants_viewed = list(
            AnalyticsEvent.objects.filter(user=client, category="restaurant_view")
            .values("label")
            .annotate(cnt=Count("id"))
            .order_by("-cnt")[:10]
        )

        phone = ""
        try:
            phone = (client.phone or "").strip()
        except Exception:
            phone = ""

        return Response({
            "client": {
                "id": str(client.id),
                "email": client.email,
                "display_name": client.display_name,
                "phone": phone,
                "is_active": client.is_active,
                "role": client.role,
                "is_guest": False,
                "created_at": client.created_at.isoformat() if client.created_at else None,
                "last_login": client.last_login.isoformat() if client.last_login else None,
            },
            "orders": orders_list,
            "events": events_list,
            "page_views_by_day": page_views_by_day,
            "restaurants_viewed": restaurants_viewed,
        })
