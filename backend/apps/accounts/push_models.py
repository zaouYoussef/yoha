"""Tokens Expo Push — notifications même app fermée."""

from django.conf import settings
from django.db import models


class WebPushSubscription(models.Model):
    """Abonnement Web Push (VAPID) — notifications navigateur même page fermée."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="web_push_subscriptions",
    )
    endpoint = models.TextField()
    p256dh_key = models.TextField()
    auth_key = models.TextField()
    user_agent = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "abonnement Web Push"
        verbose_name_plural = "abonnements Web Push"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "endpoint"],
                name="accounts_webpush_user_endpoint_uniq",
            ),
        ]

    def __str__(self):
        return f"{self.user_id} · {self.endpoint[:48]}\u2026"


class PushDevice(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_devices",
    )
    expo_push_token = models.CharField(max_length=255, unique=True, db_index=True)
    platform = models.CharField(max_length=20, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "appareil push"
        verbose_name_plural = "appareils push"

    def __str__(self):
        return f"{self.user_id} · {self.platform or '?'}"
