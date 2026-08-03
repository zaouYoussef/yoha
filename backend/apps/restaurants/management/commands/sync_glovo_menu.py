"""`python manage.py sync_glovo_menu` — synchronise les menus Glovo en base.

Commandes utiles :
    python manage.py sync_glovo_menu                # tous les stores, pas de force
    python manage.py sync_glovo_menu --dry-run      # simulation (aucune écriture)
    python manage.py sync_glovo_menu --slug kamora  # un seul store
    python manage.py sync_glovo_menu --force        # ignore le délai de 2 jours

Le même code tourne via le scheduler toutes les 2 jours.
"""
from django.core.management.base import BaseCommand

from apps.restaurants.glovo_sync import build_sync_targets, sync_all_glovo, sync_glovo_menu


class Command(BaseCommand):
    help = "Synchronise les menus des restaurants Glovo (prix, descriptions, images)."

    def add_arguments(self, parser):
        parser.add_argument("--slug", default=None, help="Slug du store à synchroniser")
        parser.add_argument("--dry-run", action="store_true", help="Simulation — aucune écriture")
        parser.add_argument("--force", action="store_true", help="Ignore le délai de 2 jours")

    def handle(self, *args, **options):
        slug = options["slug"]
        dry_run = options["dry_run"]
        force = options["force"]

        if slug:
            targets = [t for t in build_sync_targets() if t.slug == slug]
            if not targets:
                self.stderr.write(self.style.ERROR(f"Aucun store Glovo « {slug} » configuré."))
                return
            reports = [sync_glovo_menu(targets[0], dry_run=dry_run, force=force)]
        else:
            reports = sync_all_glovo(dry_run=dry_run, force=force)

        if not reports:
            self.stderr.write(self.style.WARNING("Synchro Glovo désactivée (GLOVO_SYNC_ENABLED=False)."))
            return

        for report in reports:
            for msg in report.messages[:20]:
                self.stdout.write(f"  · {msg}")
            if report.status == "error":
                self.stderr.write(self.style.ERROR(report.summary()))
            elif report.status == "up_to_date":
                self.stdout.write(self.style.WARNING(report.summary()))
            else:
                self.stdout.write(self.style.SUCCESS(report.summary()))
