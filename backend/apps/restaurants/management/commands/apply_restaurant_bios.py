"""Applique les bios marketing (conserve l'adresse après « — »).

Usage:
  python manage.py apply_restaurant_bios
  python manage.py apply_restaurant_bios --dry-run
"""
from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.restaurants.management.commands.apply_restaurant_contacts import (
    _description_with_address,
)
from apps.restaurants.models import Restaurant
from apps.restaurants.restaurant_bios import RESTAURANT_BIOS
from apps.restaurants.serializers import split_restaurant_description


class Command(BaseCommand):
    help = "Écrit une bio client pour chaque restaurant (adresse conservée)."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--slug", type=str, default="")

    def handle(self, *args, **options):
        dry = options["dry_run"]
        slug = (options.get("slug") or "").strip()
        qs = Restaurant.objects.all().order_by("name")
        if slug:
            qs = qs.filter(slug=slug)

        updated = 0
        for resto in qs:
            bio = RESTAURANT_BIOS.get(resto.slug, "").strip()
            if not bio:
                self.stdout.write(self.style.WARNING(f"skip {resto.slug}: pas de bio"))
                continue
            raw = resto.description or ""
            _old_bio, addr = split_restaurant_description(raw, resto.name)
            # Noms du type « Mr.Tacos — Tanger » : adresse = segment après le dernier —
            if raw.count("—") >= 2:
                addr = raw.split("—")[-1].strip(" ,")
            elif not addr and "—" in raw:
                addr = raw.split("—")[-1].strip(" ,")
            new_desc = _description_with_address(resto.name, addr, bio=bio)
            if new_desc == raw.strip():
                self.stdout.write(f"= {resto.slug}")
                continue
            if dry:
                self.stdout.write(f"DRY {resto.slug}: {new_desc[:140]}")
            else:
                Restaurant.objects.filter(pk=resto.pk).update(description=new_desc)
                self.stdout.write(self.style.SUCCESS(f"OK {resto.slug}"))
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Done. updated={updated}"))
