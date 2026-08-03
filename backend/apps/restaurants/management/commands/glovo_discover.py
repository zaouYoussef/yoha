"""`python manage.py glovo_discover <slug>` — découvre un store Glovo.

Récupère store_id / address_id / nom / cover / logo depuis la page web du
store. Utile pour ajouter un nouveau restaurant :

    python manage.py glovo_discover mr-tacos-tgr
"""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.restaurants.glovo import GlovoError, discover_store


class Command(BaseCommand):
    help = "Découvre les identifiants d'un store Glovo à partir de son slug."

    def add_arguments(self, parser):
        parser.add_argument("glovo_slug", help="Slug interne Glovo (ex: mr-tacos-tgr)")

    def handle(self, *args, **options):
        try:
            info = discover_store(
                options["glovo_slug"],
                city_code=getattr(settings, "GLOVO_CITY_CODE", "TAN"),
                country_code=getattr(settings, "GLOVO_COUNTRY_CODE", "ma"),
                language=getattr(settings, "GLOVO_LANGUAGE", "fr"),
            )
        except GlovoError as exc:
            raise CommandError(str(exc))

        if not info.store_id or not info.address_id:
            raise CommandError("Impossible de trouver store/address dans la page.")

        self.stdout.write(self.style.SUCCESS("Store découvert :"))
        self.stdout.write(f"  nom        : {info.name}")
        self.stdout.write(f"  store_id   : {info.store_id}")
        self.stdout.write(f"  address_id : {info.address_id}")
        self.stdout.write(f"  cover_url  : {info.cover_url}")
        self.stdout.write(f"  logo_url   : {info.logo_url}")
