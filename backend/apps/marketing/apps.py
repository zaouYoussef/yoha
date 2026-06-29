from django.apps import AppConfig


class MarketingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.marketing"
    verbose_name = "Marketing YoHa"

    def ready(self):
        from .scheduler import start_promo_scheduler
        from . import signals  # noqa

        start_promo_scheduler()
