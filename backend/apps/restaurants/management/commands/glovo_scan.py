"""`python manage.py glovo_scan` — sonde tous les stores Glovo configurés.

Affiche pour chaque store le nombre de sections et de produits exposés par
l'API Glovo (diagnostic : détecte les layouts LIST/GRID, stores vides, etc.) :

    python manage.py glovo_scan
"""
from django.core.management.base import BaseCommand

from apps.restaurants.glovo import GlovoError
from apps.restaurants.glovo_sync import _fetch_menu, build_sync_targets


class Command(BaseCommand):
    help = "Sonde tous les stores Glovo configurés (sections/produits)."

    def handle(self, *args, **options):
        targets = build_sync_targets()
        if not targets:
            self.stderr.write(self.style.WARNING("Aucun store Glovo configuré."))
            return

        for store in targets:
            try:
                sections = _fetch_menu(store)
            except GlovoError as exc:
                self.stderr.write(self.style.ERROR(f"{store.slug}: {exc}"))
                continue
            total = sum(len(s.products) for s in sections)
            label = f"{store.slug}: {len(sections)} sections, {total} produits"
            if sections:
                self.stdout.write(self.style.SUCCESS(label))
                for section in sections[:6]:
                    self.stdout.write(f"  · « {section.title} » — {len(section.products)} produits")
                if len(sections) > 6:
                    self.stdout.write(f"  … (+{len(sections) - 6} sections)")
            else:
                self.stderr.write(self.style.WARNING(f"{label} — menu vide !"))
