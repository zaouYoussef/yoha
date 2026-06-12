from decimal import Decimal

from django.db import transaction

from apps.core.finance import platform_profit_mad

from .models import LedgerEntry, Payment


@transaction.atomic
def record_cod_payment(*, order, actor=None) -> Payment:
    """Crée paiement COD + écritures comptables (immuable)."""
    idem = f"pay-{order.id}"
    existing = Payment.objects.filter(idempotency_key=idem).first()
    if existing:
        return existing

    payment = Payment.objects.create(
        order=order,
        amount_mad=order.total_mad,
        method=Payment.Method.COD,
        status=Payment.Status.PENDING,
        idempotency_key=idem,
    )
    _append_ledger(payment, LedgerEntry.EntryType.ORDER_TOTAL, order.total_mad, {"order": order.public_id})
    _append_ledger(
        payment,
        LedgerEntry.EntryType.SERVICE_FEE,
        order.service_fee_mad,
        {"order": order.public_id},
    )
    _append_ledger(
        payment,
        LedgerEntry.EntryType.PLATFORM_PROFIT,
        platform_profit_mad(order.total_mad),
        {"order": order.public_id},
    )
    restaurant_share = order.subtotal_mad - (order.subtotal_mad * Decimal("0.20"))
    _append_ledger(
        payment,
        LedgerEntry.EntryType.RESTAURANT_PAYOUT,
        restaurant_share.quantize(Decimal("0.01")),
        {"restaurant": order.restaurant.slug},
    )
    return payment


def _append_ledger(payment: Payment, entry_type: str, amount: Decimal, metadata: dict):
    LedgerEntry.objects.create(
        payment=payment,
        entry_type=entry_type,
        amount_mad=amount,
        metadata=metadata,
    )


@transaction.atomic
def capture_cod_payment(*, payment: Payment) -> Payment:
    payment = Payment.objects.select_for_update().get(pk=payment.pk)
    if payment.status == Payment.Status.CAPTURED:
        return payment
    from django.utils import timezone

    payment.status = Payment.Status.CAPTURED
    payment.captured_at = timezone.now()
    payment.save(update_fields=["status", "captured_at"])
    return payment
