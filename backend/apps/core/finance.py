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

# Supplément petite commande (sous-total plats)
SMALL_ORDER_FEE_HIGH = Decimal("10.00")  # < 40 MAD
SMALL_ORDER_FEE_MID = Decimal("5.00")  # 40–69 MAD
SMALL_ORDER_THRESHOLD_LOW = Decimal("40.00")
SMALL_ORDER_THRESHOLD_FREE = Decimal("70.00")

# Frais de service checkout restos (en plus du supplément petite commande)
CHECKOUT_SERVICE_FEE_MAD = _d(getattr(settings, "YOHA_CHECKOUT_SERVICE_FEE_MAD", "9.99"))
GROUP_ORDER_FREE_SERVICE_MAD = _d(getattr(settings, "YOHA_GROUP_ORDER_THRESHOLD_MAD", "200"))


def small_order_surcharge_mad(subtotal: Decimal) -> Decimal:
    """Aucun minimum de commande — supplément si panier léger."""
    s = _d(subtotal)
    if s < SMALL_ORDER_THRESHOLD_LOW:
        return SMALL_ORDER_FEE_HIGH
    if s < SMALL_ORDER_THRESHOLD_FREE:
        return SMALL_ORDER_FEE_MID
    return Decimal("0.00")


def checkout_service_fee_mad(subtotal: Decimal, *, is_custom: bool = False) -> Decimal:
    """9,99 MAD sur les restos classiques ; offert dès 200 MAD (commande groupe)."""
    if is_custom:
        return Decimal("0.00")
    if _d(subtotal) >= GROUP_ORDER_FREE_SERVICE_MAD:
        return Decimal("0.00")
    return CHECKOUT_SERVICE_FEE_MAD


def service_fee_mad(subtotal: Decimal) -> Decimal:
    if subtotal > SERVICE_FEE_THRESHOLD:
        return SERVICE_FEE_HIGH
    return SERVICE_FEE_LOW


def platform_profit_mad(total_dh: Decimal) -> Decimal:
    return (total_dh - PROFIT_FIXED) * PROFIT_FACTOR + PROFIT_FIXED


def platform_net_mad(total_dh: Decimal) -> Decimal:
    brut = platform_profit_mad(total_dh) - DELIVERY_FEE
    return (brut * NET_FACTOR).quantize(Decimal("0.01"))
