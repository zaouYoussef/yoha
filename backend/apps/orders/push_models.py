"""Abonnements push par commande (clients invités sans compte)."""

from django.db import models


class OrderPushSubscription(models.Model):
    public_id = models.CharField(max_length=40, db_index=True)
    expo_push_token = models.CharField(max_length=255, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "abonnement push commande"
        verbose_name_plural = "abonnements push commande"
        constraints = [
            models.UniqueConstraint(
                fields=["public_id", "expo_push_token"],
                name="orders_push_sub_public_token_uniq",
            ),
        ]

    def __str__(self):
        return f"{self.public_id} · {self.expo_push_token[:24]}…"
