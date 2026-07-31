"""`python manage.py update_pharmacies` — télécharge, parse, synchronise, rapporte.

Exécution quotidienne conseillée (cron, 00:10) :
    0 0 * * * cd /opt/yoha/backend && python manage.py update_pharmacies

En cas d'échec du scraper, les données de la veille restent disponibles.
"""
from django.core.management.base import BaseCommand

from apps.pharmacy.scrapers.infopoint import InfopointScraper, ScrapeError
from apps.pharmacy.services.pharmacy_sync import sync_pharmacies


class Command(BaseCommand):
    help = "Récupère les pharmacies de garde depuis infopoint.ma et synchronise la base."

    def add_arguments(self, parser):
        parser.add_argument("--city", default="tanger", help="Ville à synchroniser (défaut: tanger)")

    def handle(self, *args, **options):
        scraper = InfopointScraper(city=options["city"])

        try:
            data = scraper.scrape()
        except ScrapeError as exc:
            self.stderr.write(self.style.ERROR(f"Échec du scraper : {exc}"))
            self.stderr.write(self.style.WARNING("Conservation des données de la veille."))
            raise

        report = sync_pharmacies(data)

        for msg in report.messages:
            self.stderr.write(self.style.WARNING(f"  ! {msg}"))
        self.stdout.write(self.style.SUCCESS(report.summary()))

        if report.errors:
            self.stderr.write(
                self.style.WARNING(
                    f"{report.errors} erreur(s) sur {report.total} pharmacies — vérifiez les logs."
                )
            )
