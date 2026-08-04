"""Endpoints d'administration de la synchro catalogue (/catalog-import/*, alias historiques).

Accès : JWT admin YoHa, ou token outil en en-tête `X-Catalog-Token` / `X-Glovo-Token`
(comparaison constant-time). Outils désactivés par défaut en production.
"""
from __future__ import annotations

import hmac
import logging
import threading

from django.conf import settings
from django.db import close_old_connections
from django.utils.text import slugify
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.restaurants.glovo import GlovoError, discover_store
from apps.restaurants.glovo_sync import build_sync_targets, sync_all_glovo
from apps.restaurants.models import GlovoSyncLog, Restaurant

logger = logging.getLogger(__name__)


def _tools_enabled(name: str) -> bool:
    return bool(getattr(settings, "GLOVO_TOOLS", {}).get(name, False))


def _token_ok(request) -> bool:
    expected = (getattr(settings, "GLOVO_TOOLS", {}) or {}).get("token", "") or ""
    if not expected:
        return False
    provided = (
        request.headers.get("X-Catalog-Token")
        or request.headers.get("X-Glovo-Token")
        or ""
    )
    return hmac.compare_digest(str(provided), str(expected))


def _authorized(request) -> bool:
    user = getattr(request, "user", None)
    if user is not None and user.is_authenticated and (
        getattr(user, "role", None) == "admin" or user.is_staff or user.is_superuser
    ):
        return True
    return _token_ok(request)


def _denied() -> Response:
    return Response({"detail": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)


def _tool_off() -> Response:
    return Response({"detail": "Outil désactivé."}, status=status.HTTP_403_FORBIDDEN)


def _run_sync_in_thread(slug: str | None) -> None:
    def _job():
        close_old_connections()
        try:
            sync_all_glovo(force=True, slug=slug or None)
        except Exception:  # noqa: BLE001
            logger.exception("catalog_import_thread_failed")
        finally:
            close_old_connections()

    threading.Thread(target=_job, daemon=True).start()


class _CatalogToolView(APIView):
    """JWT admin ou token outil — pas d'accès anonyme silencieux."""

    authentication_classes = [JWTAuthentication]
    permission_classes = []

class AddGlovoStoreView(_CatalogToolView):
    """Découvre un store catalogue et le crée/active dans YoHa (menu synchronisé)."""

    def post(self, request):
        if not _tools_enabled("add"):
            return _tool_off()
        if not _authorized(request):
            return _denied()

        data = request.data
        glovo_slug = (data.get("glovoSlug") or data.get("glovo_slug") or "").strip()
        if not glovo_slug:
            return Response({"detail": "glovoSlug requis."}, status=status.HTTP_400_BAD_REQUEST)

        slug = (data.get("slug") or "").strip().lower()
        if not slug:
            slug = slugify(data.get("name") or glovo_slug)

        restaurant = Restaurant.objects.filter(slug=slug).first()
        store_id = data.get("storeId") or data.get("store_id")
        address_id = data.get("addressId") or data.get("address_id")

        info = None
        if not store_id or not address_id:
            try:
                info = discover_store(
                    glovo_slug,
                    city_code=getattr(settings, "GLOVO_CITY_CODE", "TAN"),
                    city_slug=getattr(settings, "GLOVO_CITY_SLUG", "tanger"),
                    country_code=getattr(settings, "GLOVO_COUNTRY_CODE", "ma"),
                    language=getattr(settings, "GLOVO_LANGUAGE", "fr"),
                )
            except GlovoError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
            store_id = store_id or info.store_id
            address_id = address_id or info.address_id

        if not store_id or not address_id:
            return Response(
                {"detail": "store/address introuvables — vérifiez le slug."},
                status=status.HTTP_404_NOT_FOUND,
            )

        name = (data.get("name") or (info.name if info else "") or slug.replace("-", " ").title()).strip()
        cuisine = (data.get("cuisine") or (restaurant.cuisine if restaurant else "tacos")).strip()
        valid_cuisines = [c.value for c in Restaurant.Cuisine]
        if cuisine not in valid_cuisines:
            return Response(
                {"detail": f"cuisine invalide — attendu: {', '.join(valid_cuisines)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        defaults = {
            "name": name,
            "cuisine": cuisine,
            "tags": data.get("tags") or (restaurant.tags if restaurant else [cuisine.capitalize()]),
            "glovo_store_id": int(store_id),
            "glovo_address_id": int(address_id),
            "glovo_slug": glovo_slug,
            "glovo_enabled": True,
            "is_active": True,
        }
        if info:
            if info.cover_url:
                defaults["cover_url"] = info.cover_url
            if info.logo_url:
                defaults["logo_url"] = info.logo_url

        restaurant, _ = Restaurant.objects.update_or_create(slug=slug, defaults=defaults)
        _run_sync_in_thread(slug)

        return Response(
            {
                "id": slug,
                "slug": slug,
                "storeName": restaurant.name,
                "storeId": restaurant.glovo_store_id,
                "addressId": restaurant.glovo_address_id,
                "glovoSlug": restaurant.glovo_slug,
                "nextRunMinutes": getattr(settings, "GLOVO_NEXT_RUN_MINUTES", 60),
                "syncedAt": restaurant.glovo_synced_at,
            }
        )


class GlovoStoresView(_CatalogToolView):
    """Liste des stores synchronisés avec leur dernier état."""

    def get(self, request):
        if not _tools_enabled("discover"):
            return _tool_off()
        if not _authorized(request):
            return _denied()

        payload = []
        for target in build_sync_targets():
            restaurant = Restaurant.objects.filter(slug=target.slug).first()
            last_log = restaurant.glovo_sync_logs.first() if restaurant else None
            payload.append(
                {
                    "slug": target.slug,
                    "name": target.name,
                    "storeId": target.store_id,
                    "addressId": target.address_id,
                    "glovoSlug": target.glovo_slug,
                    "enabled": target.enabled,
                    "syncedAt": restaurant.glovo_synced_at if restaurant else None,
                    "lastStatus": last_log.status if last_log else None,
                    "lastRun": last_log.started_at if last_log else None,
                }
            )
        return Response(payload)


class GlovoLogsView(_CatalogToolView):
    """Historique récent des synchronisations."""

    def get(self, request):
        if not _tools_enabled("logs"):
            return _tool_off()
        if not _authorized(request):
            return _denied()

        logs = GlovoSyncLog.objects.select_related("restaurant")[:50]
        return Response(
            [
                {
                    "slug": log.slug,
                    "restaurantName": log.restaurant.name if log.restaurant else None,
                    "status": log.status,
                    "dryRun": log.dry_run,
                    "startedAt": log.started_at,
                    "finishedAt": log.finished_at,
                    "stats": log.stats,
                    "error": log.error,
                }
                for log in logs
            ]
        )


class GlovoSyncNowView(_CatalogToolView):
    """Déclenche une synchronisation immédiate (tous ou un store)."""

    def post(self, request):
        if not _tools_enabled("sync"):
            return _tool_off()
        if not _authorized(request):
            return _denied()

        slug = (request.data.get("slug") or "").strip() or None
        _run_sync_in_thread(slug)
        return Response({"detail": "Synchro catalogue lancée.", "slug": slug})
