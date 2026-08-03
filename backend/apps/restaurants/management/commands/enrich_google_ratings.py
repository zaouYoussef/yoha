"""Applique notes Google + distances CHU Tanger aux restaurants.

Usage:
  python manage.py enrich_google_ratings
  python manage.py enrich_google_ratings --dry-run
  python manage.py enrich_google_ratings --from-glovo  # recalcule lat/lng via profil Glovo
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.restaurants.models import Restaurant

CHU_LAT = 35.68600
CHU_LNG = -5.92279
DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "google_ratings_tanger.json"


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def format_distance_km(km: float) -> str:
    v = round(km, 1)
    if abs(v - round(v)) < 0.05:
        return f"{int(round(v))} km"
    return f"{v:.1f} km".replace(".", ",")


class Command(BaseCommand):
    help = "Met à jour rating Google + distance_label (depuis CHU Tanger)."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument(
            "--from-glovo",
            action="store_true",
            help="Rafraîchit lat/lng depuis le profil Glovo avant calcul distance.",
        )
        parser.add_argument(
            "--verified-only",
            action="store_true",
            help="N'applique que les notes sans rating_confidence=approx.",
        )

    def handle(self, *args, **options):
        dry = options["dry_run"]
        verified_only = options["verified_only"]
        payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        rows = payload.get("restaurants") or {}

        if options["from_glovo"]:
            self._refresh_coords_from_glovo(rows, dry=dry)

        updated = 0
        for slug, info in rows.items():
            try:
                resto = Restaurant.objects.get(slug=slug)
            except Restaurant.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"skip unknown slug={slug}"))
                continue

            rating = str(info.get("rating") or "").strip()
            confidence = info.get("rating_confidence") or "verified"
            if verified_only and confidence == "approx":
                rating = ""

            lat, lng = info.get("lat"), info.get("lng")
            dist = ""
            if lat is not None and lng is not None:
                dist = format_distance_km(haversine_km(CHU_LAT, CHU_LNG, float(lat), float(lng)))

            fields = []
            if rating and resto.rating != rating:
                fields.append(("rating", rating))
            if dist and resto.distance_label != dist:
                fields.append(("distance_label", dist))

            if not fields:
                self.stdout.write(f"= {slug} rating={resto.rating} dist={resto.distance_label}")
                continue

            msg = ", ".join(f"{k}={v}" for k, v in fields)
            if dry:
                self.stdout.write(f"DRY {slug}: {msg}")
            else:
                for k, v in fields:
                    setattr(resto, k, v)
                resto.save(update_fields=[k for k, _ in fields] + ["updated_at"])
                self.stdout.write(self.style.SUCCESS(f"OK {slug}: {msg}"))
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Terminé — {updated} restaurant(s) mis à jour."))

    def _refresh_coords_from_glovo(self, rows: dict, *, dry: bool) -> None:
        from apps.restaurants.glovo import GlovoClient

        for resto in Restaurant.objects.filter(is_active=True).exclude(glovo_store_id__isnull=True):
            try:
                api = GlovoClient(
                    store_id=int(resto.glovo_store_id),
                    address_id=int(resto.glovo_address_id or 0),
                    city_code=getattr(settings, "GLOVO_CITY_CODE", "TAN"),
                    country_code=getattr(settings, "GLOVO_COUNTRY_CODE", "ma"),
                    latitude=getattr(settings, "GLOVO_LATITUDE", 35.7595),
                    longitude=getattr(settings, "GLOVO_LONGITUDE", -5.8340),
                    language=getattr(settings, "GLOVO_LANGUAGE", "fr"),
                )
                profile = api.fetch_store_profile()
                lat, lng = profile.latitude, profile.longitude
                if not lat or not lng:
                    m = re.search(r"([A-Z0-9]{4}\+[A-Z0-9]{2,3})", profile.address or "", re.I)
                    if m:
                        try:
                            from openlocationcode import openlocationcode as olc

                            full = olc.recoverNearest(m.group(1).upper(), 35.76, -5.83)
                            d = olc.decode(full)
                            lat, lng = d.latitudeCenter, d.longitudeCenter
                        except Exception:
                            pass
                if lat and lng:
                    entry = rows.setdefault(resto.slug, {})
                    entry["lat"] = float(lat)
                    entry["lng"] = float(lng)
                    self.stdout.write(f"GLOVO {resto.slug}: {lat}, {lng}")
            except Exception as exc:
                self.stdout.write(self.style.WARNING(f"GLOVO fail {resto.slug}: {exc}"))

        if not dry:
            DATA_FILE.write_text(
                json.dumps(
                    {"_meta": json.loads(DATA_FILE.read_text(encoding="utf-8")).get("_meta", {}), "restaurants": rows},
                    ensure_ascii=False,
                    indent=2,
                )
                + "\n",
                encoding="utf-8",
            )
