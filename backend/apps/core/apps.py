from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    verbose_name = "Noyau YoHa"

    def ready(self):
        from django.contrib import admin

        from apps.core.scheduler import ensure_scheduler

        ensure_scheduler()

        try:
            from rest_framework_simplejwt.token_blacklist.models import (
                BlacklistedToken,
                OutstandingToken,
            )

            admin.site.unregister(OutstandingToken)
            admin.site.unregister(BlacklistedToken)
        except admin.sites.NotRegistered:
            pass
