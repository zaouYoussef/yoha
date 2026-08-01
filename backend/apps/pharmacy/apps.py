from django.apps import AppConfig


class PharmacyConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.pharmacy"
    verbose_name = "Pharmacies de garde"

    def ready(self):
        from .scheduler import start_pharmacy_scheduler

        start_pharmacy_scheduler()
