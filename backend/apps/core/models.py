import uuid
from django.conf import settings
from django.db import models


class AnalyticsEvent(models.Model):
    CATEGORY_CHOICES = [
        ("pageview", "Page vue"),
        ("click", "Clic"),
        ("restaurant_view", "Restaurant visité"),
        ("menu_view", "Menu consulté"),
        ("checkout_start", "Checkout commencé"),
        ("order_placed", "Commande passée"),
        ("search", "Recherche"),
        ("session", "Session"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    session_id = models.CharField(max_length=64, db_index=True, blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, db_index=True)
    label = models.CharField(max_length=200, blank=True)
    path = models.CharField(max_length=500, blank=True)
    referrer = models.CharField(max_length=500, blank=True)
    user_agent = models.TextField(blank=True)
    ip = models.GenericIPAddressField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "événement analytics"
        verbose_name_plural = "événements analytics"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["category", "created_at"]),
            models.Index(fields=["session_id", "created_at"]),
        ]

    def __str__(self):
        return f"{self.category} — {self.label or self.path} [{self.created_at:%H:%M}]"
