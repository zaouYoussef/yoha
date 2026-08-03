"""`python manage.py glovo_harvest <slug>` — extrait le menu Glovo brut en JSON.

Utile pour vérifier ce que renvoie l'API ou pour construire un seed :

    python manage.py glovo_harvest mr-tacos-tanger --out menu.json
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.restaurants.glovo_sync import _fetch_menu, build_sync_targets


class Command(BaseCommand):
    help = "Récupère le menu complet d'un store Glovo et l'écrit en JSON."

    def add_arguments(self, parser):
        parser.add_argument("slug", help="Slug du store configuré (ex: mr-tacos-tanger)")
        parser.add_argument("--out", default=None, help="Fichier JSON de sortie")

    def handle(self, *args, **options):
        targets = [t for t in build_sync_targets() if t.slug == options["slug"]]
        if not targets:
            raise CommandError(f"Aucun store Glovo « {options['slug']} » configuré.")
        store = targets[0]

        try:
            sections = _fetch_menu(store)
        except Exception as exc:  # noqa: BLE001
            raise CommandError(f"Récupération du menu : {exc}")

        payload = {
            "slug": store.slug,
            "glovo_slug": store.glovo_slug,
            "store_id": store.store_id,
            "address_id": store.address_id,
            "sections": [
                {
                    "title": s.title,
                    "products": [
                        {
                            "external_id": p.external_id,
                            "name": p.name,
                            "description": p.description,
                            "price_mad": p.price_mad,
                            "image_url": p.image_url,
                            "out_of_stock": p.out_of_stock,
                        }
                        for p in s.products
                    ],
                }
                for s in sections
            ],
        }

        out = options["out"]
        if out:
            Path(out).write_text(
                json.dumps(payload, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            self.stdout.write(self.style.SUCCESS(f"Écrit {len(sections)} sections → {out}"))
        else:
            self.stdout.write(json.dumps(payload, ensure_ascii=False, indent=2))
