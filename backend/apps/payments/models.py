import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models, transaction


class Payment(models.Model):
    """Enregistrement immuable d'un flux monétaire lié à une commande."""

    class Method(models.TextChoices):
        COD = "cod", "Espèces à la livraison"
        CARD = "card", "Carte (futur)"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        AUTHORIZED = "authorized", "Autorisé"
        CAPTURED = "captured", "Encaissé"
        FAILED = "failed", "Échoué"
        REFUNDED = "refunded", "Remboursé"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey("orders.Order", on_delete=models.PROTECT, related_name="payments")
    amount_mad = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=Method.choices, default=Method.COD)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    idempotency_key = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    captured_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "created_at"])]


class LedgerEntry(models.Model):
    """Journal comptable append-only — jamais modifié, seulement compensé."""

    class EntryType(models.TextChoices):
        ORDER_TOTAL = "order_total", "Total commande"
        SERVICE_FEE = "service_fee", "Frais de service"
        PLATFORM_PROFIT = "platform_profit", "Profit plateforme"
        RESTAURANT_PAYOUT = "restaurant_payout", "Versement restaurant"
        COURIER_PAYOUT = "courier_payout", "Rémunération livreur"
        REFUND = "refund", "Remboursement"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name="ledger_entries")
    entry_type = models.CharField(max_length=30, choices=EntryType.choices)
    amount_mad = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after_mad = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["entry_type", "created_at"])]


class PayoutBatch(models.Model):
    """Lot de versements (restaurants / livreurs) — traçabilité."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        PROCESSING = "processing", "En cours"
        COMPLETED = "completed", "Terminé"
        FAILED = "failed", "Échoué"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    beneficiary_type = models.CharField(max_length=20)
    beneficiary_id = models.CharField(max_length=64)
    total_mad = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
