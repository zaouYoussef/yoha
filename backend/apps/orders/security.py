"""Helpers sécurité commandes — prix serveur, IDs, contrôle d'accès invité."""
from __future__ import annotations

import re
from decimal import Decimal

SHORT_PUBLIC_ID_RE = re.compile(r"^YH-\d{4}$", re.I)

# Cuisines où le panier peut créer des articles ad-hoc (pharmacie / ticket, etc.)
CLIENT_PRICE_CUISINES = frozenset(
    {"medical", "dessert", "supermarket", "shop", "parapharmacy"}
)

MAX_CLIENT_UNIT_PRICE = Decimal("10000.00")


def is_short_public_id(public_id: str) -> bool:
    return bool(SHORT_PUBLIC_ID_RE.match((public_id or "").strip()))


def emails_match(a: str, b: str) -> bool:
    return (a or "").strip().lower() == (b or "").strip().lower() and bool((a or "").strip())


def guest_may_access_order(order, *, email: str = "") -> bool:
    """Accès invité : ID long = secret ; ancien YH-#### exige l'e-mail de la commande."""
    pid = (order.public_id or "").strip()
    if not is_short_public_id(pid):
        return True
    return emails_match(email, order.customer_email or "")


def compute_catalog_unit_price(menu_item, option_names) -> Decimal:
    """Prix catalogue + impacts options (jamais le prix client)."""
    base = Decimal(str(menu_item.price_mad or 0))
    names = {
        str(n).strip().lower()
        for n in (option_names or [])
        if str(n).strip()
    }
    if not names:
        return base

    extras = Decimal("0.00")
    # Prefetch-friendly : parcourir les groupes déjà chargés si possible
    groups = getattr(menu_item, "_prefetched_objects_cache", {}).get("modifier_groups")
    if groups is None:
        groups = menu_item.modifier_groups.prefetch_related("options").all()

    matched = set()
    for group in groups:
        for opt in group.options.all():
            key = (opt.name or "").strip().lower()
            if key in names and key not in matched:
                extras += Decimal(str(opt.price_impact or 0))
                matched.add(key)
    return base + extras


def clamp_client_unit_price(raw) -> Decimal:
    price = Decimal(str(raw or 0))
    if price < 0:
        price = Decimal("0.00")
    if price > MAX_CLIENT_UNIT_PRICE:
        price = MAX_CLIENT_UNIT_PRICE
    return price.quantize(Decimal("0.01"))
