"""
Calculs financiers — Decimal uniquement, alignés sur le frontend YoHa.
"""
from decimal import Decimal

from django.conf import settings


def _d(value) -> Decimal:
    return Decimal(str(value))


PROFIT_FACTOR = _d(getattr(settings, "YOHA_PROFIT_FACTOR", "0.20"))
PROFIT_FIXED = _d(getattr(settings, "YOHA_PROFIT_FIXED_MAD", "12.00"))
SERVICE_FEE_LOW = _d(getattr(settings, "YOHA_SERVICE_FEE_LOW_MAD", "12.00"))
SERVICE_FEE_HIGH = _d(getattr(settings, "YOHA_SERVICE_FEE_HIGH_MAD", "30.00"))
SERVICE_FEE_THRESHOLD = _d(getattr(settings, "YOHA_SERVICE_FEE_THRESHOLD_MAD", "3000.00"))
DELIVERY_FEE = _d(getattr(settings, "YOHA_DELIVERY_FEE_MAD", "0.00"))
NET_FACTOR = Decimal("0.99")


def service_fee_mad(subtotal: Decimal) -> Decimal:
    if subtotal > SERVICE_FEE_THRESHOLD:
        return SERVICE_FEE_HIGH
    return SERVICE_FEE_LOW


def platform_profit_mad(total_dh: Decimal) -> Decimal:
    return (total_dh - PROFIT_FIXED) * PROFIT_FACTOR + PROFIT_FIXED


def platform_net_mad(total_dh: Decimal) -> Decimal:
    brut = platform_profit_mad(total_dh) - DELIVERY_FEE
    return (brut * NET_FACTOR).quantize(Decimal("0.01"))
