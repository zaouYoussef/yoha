"""Synchronise les numéros de téléphone Glovo → Restaurant.phone."""
from __future__ import annotations

import logging
import time

from django.core.management.base import BaseCommand

from apps.restaurants.glovo import GlovoError
from apps.restaurants.glovo_sync import GlovoStoreConfig, _client_api
from apps.restaurants.models import Restaurant

logger = logging.getLogger(__name__)


def normalize_phone(raw: str) -> str:
    phone = (raw or "").strip()
    if not phone:
        return ""
    return phone[:30]


def sync_restaurant_phone(restaurant: Restaurant, *, delay: float = 0.4) -> str:
    """Retourne le téléphone trouvé (ou ''). Respecte les overrides vérifiés."""
    from apps.restaurants.contact_overrides import get_contact_override

    override = get_contact_override(restaurant.slug) or {}
    if (override.get("phone") or "").strip():
        phone = normalize_phone(override["phone"])
        if phone and phone != (restaurant.phone or "").strip():
            Restaurant.objects.filter(pk=restaurant.pk).update(phone=phone)
            restaurant.phone = phone
        time.sleep(min(delay, 0.1))
        return phone or (restaurant.phone or "")

    if not restaurant.glovo_store_id:
        return ""
    store = GlovoStoreConfig(
        slug=restaurant.slug,
        store_id=int(restaurant.glovo_store_id),
        address_id=int(restaurant.glovo_address_id or 0),
        glovo_slug=restaurant.glovo_slug or restaurant.slug,
        name=restaurant.name or restaurant.slug,
    )
    try:
        api = _client_api(store, store.store_id, store.address_id or 0)
        profile = api.fetch_store_profile()
    except GlovoError as exc:
        logger.info("glovo_phone_failed %s — %s", restaurant.slug, exc)
        time.sleep(delay)
        return ""
    except Exception:  # noqa: BLE001
        logger.exception("glovo_phone_error %s", restaurant.slug)
        time.sleep(delay)
        return ""

    phone = normalize_phone(getattr(profile, "phone", "") or "")
    if phone:
        Restaurant.objects.filter(pk=restaurant.pk).update(phone=phone)
        restaurant.phone = phone
    time.sleep(delay)
    return phone


class Command(BaseCommand):
    help = "Récupère les téléphones Glovo (/v3/stores/{id}) pour tous les restos Glovo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--only-empty",
            action="store_true",
            help="Ne met à jour que les restaurants sans téléphone.",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=0.45,
            help="Pause entre chaque appel API (anti rate-limit).",
        )
        parser.add_argument("--slug", type=str, default="", help="Limiter à un slug.")

    def handle(self, *args, **options):
        only_empty = options["only_empty"]
        delay = float(options["delay"])
        slug = (options.get("slug") or "").strip()

        qs = Restaurant.objects.filter(glovo_store_id__isnull=False).order_by("name")
        if only_empty:
            qs = qs.filter(phone="")
        if slug:
            qs = qs.filter(slug=slug)

        total = qs.count()
        updated = 0
        missing = 0
        errors = 0

        self.stdout.write(self.style.NOTICE(f"Sync téléphones Glovo — {total} restaurant(s)"))

        for i, resto in enumerate(qs.iterator(), start=1):
            before = (resto.phone or "").strip()
            phone = sync_restaurant_phone(resto, delay=delay)
            if phone:
                updated += 1
                flag = "NEW" if not before else ("SAME" if before == phone else "UPD")
                self.stdout.write(f"[{i}/{total}] {flag} {resto.name}: {phone}")
            else:
                missing += 1
                errors += 1
                self.stdout.write(self.style.WARNING(f"[{i}/{total}] — {resto.name}: aucun numéro"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Terminé — mis à jour: {updated}, sans numéro: {missing}, traités: {total}"
            )
        )
