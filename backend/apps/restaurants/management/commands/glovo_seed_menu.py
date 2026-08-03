"""`python manage.py glovo_seed_menu <slug>` — crée/remplit le menu d'un store.

Equivalent d'une synchronisation forcée pour un seul store : crée le
restaurant s'il manque puis écrit le menu complet depuis l'API Glovo.

    python manage.py glovo_seed_menu mr-tacos-tanger
"""
from django.core.management.base import BaseCommand, CommandError

from apps.restaurants.glovo_sync import build_sync_targets, sync_glovo_menu


class Command(BaseCommand):
    help = "Crée/remplit le menu d'un store Glovo en base (synchro forcée)."

    def add_arguments(self, parser):
        parser.add_argument("slug", help="Slug du store (ex: mr-tacos-tanger)")

    def handle(self, *args, **options):
        targets = [t for t in build_sync_targets() if t.slug == options["slug"]]
        if not targets:
            raise CommandError(f"Aucun store Glovo « {options['slug']} » configuré.")

        report = sync_glovo_menu(targets[0], force=True)
        for msg in report.messages[:20]:
            self.stdout.write(f"  · {msg}")
        if report.status == "error":
            self.stderr.write(self.style.ERROR(report.summary()))
            raise CommandError(report.summary())
        self.stdout.write(self.style.SUCCESS(report.summary()))
