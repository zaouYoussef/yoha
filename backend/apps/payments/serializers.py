from rest_framework import serializers

from .models import LedgerEntry, Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source="order.public_id")

    class Meta:
        model = Payment
        fields = ("id", "order_id", "amount_mad", "method", "status", "created_at", "captured_at")
        read_only_fields = fields


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = ("id", "entry_type", "amount_mad", "metadata", "created_at")
        read_only_fields = fields
