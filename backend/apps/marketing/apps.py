from django.apps import AppConfig


class MarketingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.marketing"
    verbose_name = "Marketing YouHa"

    def ready(self):
        from .scheduler import start_promo_scheduler

        start_promo_scheduler()
