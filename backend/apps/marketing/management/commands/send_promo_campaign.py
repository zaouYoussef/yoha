from django.core.management.base import BaseCommand

from apps.marketing.services import run_promo_campaign


class Command(BaseCommand):
    help = "Envoie la campagne promo (rotation restaurant + menu). 2×/semaine via scheduler."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Ignore le délai minimum entre campagnes")
        parser.add_argument("--dry-run", action="store_true", help="Simule sans envoyer")

    def handle(self, *args, **options):
        result = run_promo_campaign(force=options["force"], dry_run=options["dry_run"])
        if result.get("skipped"):
            self.stdout.write(self.style.WARNING(f"Ignoré : {result.get('reason')}"))
            return
        if result.get("dry_run"):
            self.stdout.write(
                self.style.SUCCESS(
                    f"[DRY-RUN] campagne {result['campaign_key']} · "
                    f"restaurant={result['restaurant']} · "
                    f"{result['recipients']} destinataires"
                )
            )
            if result.get("sample"):
                self.stdout.write(f"Exemples : {', '.join(result['sample'])}")
            return
        self.stdout.write(
            self.style.SUCCESS(
                f"Campagne {result['campaign_key']} · {result['restaurant']} · "
                f"{result['sent']} envoyés · {result.get('failed', 0)} échecs"
            )
        )
