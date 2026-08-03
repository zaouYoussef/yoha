"""Applique les photos réelles locales à Pizzeria Les Amis (hors Glovo)."""
from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.restaurants.models import MenuItem, Restaurant

SLUG = "pizzeria-les-amis"
BASE = "/media/restaurants/pizzeria-les-amis"

ITEM_IMAGES = {
    "f1": "salade.webp",
    "f2": "salade.webp",
    "f3": "salade.webp",
    "f4": "salade.webp",
    "f5": "salade.webp",
    "f6": "salade.webp",
    "f7": "table.webp",
    "f8": "table.webp",
    "s1": "chawarma-wrap.webp",
    "s2": "plat-frites.webp",
    "s3": "chawarma-wrap.webp",
    "s4": "chawarma-wrap.webp",
    "s5": "cuisine.webp",
    "s6": "cuisine.webp",
    "s7": "cuisine.webp",
    "s8": "panini2.webp",
    "s9": "panini2.webp",
    "s10": "panini2.webp",
    "s11": "panini2.webp",
    "s12": "panini2.webp",
    "s13": "panini2.webp",
    "s14": "plat-frites.webp",
    "s15": "plat-frites.webp",
    "s16": "plat-frites.webp",
    "s17": "plat-frites.webp",
    "c1": "plat-frites.webp",
    "c2": "table.webp",
    "c3": "table.webp",
    "c4": "cuisine.webp",
    "p1": "table.webp",
    "p2": "table.webp",
    "p3": "table.webp",
    "p4": "table.webp",
    "g1": "cuisine.webp",
    "g2": "cuisine.webp",
    "g3": "cuisine.webp",
    "g4": "cuisine.webp",
    "g5": "cuisine.webp",
    "g6": "plat-frites.webp",
    "b1": "jus2.webp",
    "b2": "jus2.webp",
    "b3": "jus2.webp",
    "b4": "jus2.webp",
    "b5": "jus2.webp",
    "b6": "jus2.webp",
    "b7": "jus2.webp",
    "b8": "jus2.webp",
    "b9": "jus2.webp",
    "b10": "jus2.webp",
    "b11": "jus2.webp",
    "b12": "jus2.webp",
    "d1": "table.webp",
    "d2": "table.webp",
    "d3": "salade.webp",
    "z1": "pizza2.webp",
    "z2": "pizza2.webp",
    "z3": "pizza2.webp",
    "z4": "pizza2.webp",
    "z5": "pizza2.webp",
    "z6": "pizza2.webp",
    "z7": "pizza2.webp",
    "z8": "pizza2.webp",
    "z9": "pizza2.webp",
    "z10": "pizza2.webp",
    "z11": "pizza2.webp",
    "z12": "pizza2.webp",
    "z13": "pizza2.webp",
}


class Command(BaseCommand):
    help = "Remplace les photos Unsplash de Pizzeria Les Amis par les médias locaux."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        dry = options["dry_run"]
        resto = Restaurant.objects.get(slug=SLUG)
        if dry:
            self.stdout.write(f"DRY cover={BASE}/cover.webp items={len(ITEM_IMAGES)}")
            return

        resto.cover_url = f"{BASE}/cover.webp"
        resto.logo_url = f"{BASE}/logo.webp"
        resto.save(update_fields=["cover_url", "logo_url", "updated_at"])

        n = 0
        for item in MenuItem.objects.filter(restaurant=resto):
            fname = ITEM_IMAGES.get(item.external_id)
            if not fname:
                continue
            item.image_url = f"{BASE}/{fname}"
            item.save(update_fields=["image_url"])
            n += 1

        left = MenuItem.objects.filter(restaurant=resto, image_url__icontains="unsplash").count()
        self.stdout.write(self.style.SUCCESS(f"OK — {n} plats mis à jour, unsplash restants={left}"))
