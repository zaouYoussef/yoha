"""Applique overrides contacts + adresses Glovo + horaires OSM (si absents).

Usage:
  python manage.py apply_restaurant_contacts
  python manage.py apply_restaurant_contacts --dry-run
  python manage.py apply_restaurant_contacts --slug l-assiette-verte
"""
from __future__ import annotations

import time

from django.core.management.base import BaseCommand

from apps.restaurants.contact_overrides import get_contact_override, load_contact_overrides
from apps.restaurants.glovo import GlovoError
from apps.restaurants.glovo_sync import GlovoStoreConfig, _client_api
from apps.restaurants.models import Restaurant
from apps.restaurants.opening_hours import (
    DAY_KEYS,
    default_opening_hours,
    fetch_osm_opening_hours,
    normalize_opening_hours,
)


def _is_default_hours(raw) -> bool:
    hours = normalize_opening_hours(raw)
    default = default_opening_hours()
    for day in DAY_KEYS:
        a, b = hours[day], default[day]
        if a.get("is_closed") or a.get("is_24h"):
            return False
        if a.get("open") != b.get("open") or a.get("close") != b.get("close"):
            return False
    return True


def _description_with_address(name: str, address: str) -> str:
    addr = " ".join((address or "").replace("\n", ", ").split()).strip(" ,")
    base = (name or "").strip() or "Restaurant"
    if not addr:
        return base[:500]
    return f"{base} — {addr}"[:500]


class Command(BaseCommand):
    help = "Applique contacts vérifiés, adresses Glovo, et horaires OSM si besoin."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--slug", type=str, default="")
        parser.add_argument("--delay", type=float, default=0.35)
        parser.add_argument(
            "--skip-osm",
            action="store_true",
            help="Ne tente pas Overpass/OSM pour les horaires manquants.",
        )
        parser.add_argument(
            "--skip-glovo-address",
            action="store_true",
            help="Ne rafraîchit pas les adresses depuis Glovo.",
        )

    def handle(self, *args, **options):
        dry = options["dry_run"]
        delay = float(options["delay"])
        slug = (options.get("slug") or "").strip()
        skip_osm = options["skip_osm"]
        skip_addr = options["skip_glovo_address"]

        load_contact_overrides(force=True)
        qs = Restaurant.objects.filter(is_active=True).order_by("name")
        if slug:
            qs = qs.filter(slug=slug)

        updated = 0
        for i, resto in enumerate(qs.iterator(), start=1):
            fields: dict = {}
            override = get_contact_override(resto.slug) or {}

            if (override.get("phone") or "").strip():
                phone = override["phone"].strip()[:30]
                if phone != (resto.phone or ""):
                    fields["phone"] = phone

            if isinstance(override.get("opening_hours"), dict) and override["opening_hours"]:
                hours = normalize_opening_hours(override["opening_hours"])
                if hours != normalize_opening_hours(resto.opening_hours):
                    fields["opening_hours"] = hours

            addr_override = (override.get("address") or "").strip()
            profile = None
            if resto.glovo_store_id and (not skip_addr or (not addr_override and _is_default_hours(resto.opening_hours))):
                try:
                    store = GlovoStoreConfig(
                        slug=resto.slug,
                        store_id=int(resto.glovo_store_id),
                        address_id=int(resto.glovo_address_id or 0),
                        glovo_slug=resto.glovo_slug or resto.slug,
                        name=resto.name or resto.slug,
                    )
                    api = _client_api(store, store.store_id, store.address_id or 0)
                    profile = api.fetch_store_profile()
                except GlovoError as exc:
                    self.stdout.write(self.style.WARNING(f"[{i}] GLOVO fail {resto.slug}: {exc}"))
                except Exception as exc:  # noqa: BLE001
                    self.stdout.write(self.style.WARNING(f"[{i}] GLOVO error {resto.slug}: {exc}"))
                time.sleep(delay)

            address = addr_override or ((profile.address if profile else "") or "").strip()
            if address:
                desc = _description_with_address(resto.name, address)
                if desc != (resto.description or "").strip():
                    # Ne pas écraser une description marketing longue (Mr.Tacos…)
                    current = (resto.description or "").strip()
                    looks_like_address = (
                        not current
                        or " — " in current
                        or current.lower().startswith((resto.name or "").lower()[:12])
                        or len(current) < 160
                    )
                    if looks_like_address or addr_override:
                        fields["description"] = desc

            # Horaires OSM seulement si pas d'override et encore le défaut 10–23
            if (
                not skip_osm
                and "opening_hours" not in fields
                and not override.get("opening_hours")
                and _is_default_hours(resto.opening_hours)
                and profile
                and profile.latitude is not None
                and profile.longitude is not None
            ):
                try:
                    osm = fetch_osm_opening_hours(
                        float(profile.latitude),
                        float(profile.longitude),
                        name=profile.name or resto.name,
                        radius_m=180,
                    )
                    if osm:
                        fields["opening_hours"] = osm
                except Exception as exc:  # noqa: BLE001
                    self.stdout.write(self.style.WARNING(f"[{i}] OSM fail {resto.slug}: {exc}"))

            if not fields:
                self.stdout.write(f"[{i}] = {resto.slug}")
                continue

            msg = ", ".join(
                f"{k}={'…' if k == 'opening_hours' else v}" for k, v in fields.items()
            )
            if dry:
                self.stdout.write(f"[{i}] DRY {resto.slug}: {msg}")
            else:
                Restaurant.objects.filter(pk=resto.pk).update(**fields)
                self.stdout.write(self.style.SUCCESS(f"[{i}] OK {resto.slug}: {msg}"))
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Terminé — {updated} restaurant(s) mis à jour."))
