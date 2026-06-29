"""Contenu et données pour les e-mails commande YoHa."""
from __future__ import annotations

from apps.restaurants.models import Restaurant

from .models import Order

STATUS_COPY = {
    Order.Status.PLACED: {
        "subject": "Commande confirmée #{id} · YoHa",
        "headline": "Commande confirmée !",
        "emoji": "🎉",
        "body": "Merci {name} — nous avons bien reçu votre commande. Préparez-vous, c'est parti !",
        "accent": "#f97316",
    },
    Order.Status.PICKUP_CONFIRMED: {
        "subject": "Livreur en route vers le restaurant · #{id}",
        "headline": "Livreur en route vers le restaurant",
        "emoji": "🛵",
        "body": "Bonne nouvelle {name} — un livreur YoHa se dirige vers {restaurant} pour récupérer votre commande.",
        "accent": "#0ea5e9",
    },
    Order.Status.DELIVERING: {
        "subject": "En route vers vous · #{id}",
        "headline": "Votre repas arrive",
        "emoji": "📦",
        "body": "Le livreur a récupéré votre commande et se dirige vers vous. Bon appétit bientôt !",
        "accent": "#ec4899",
    },
    Order.Status.DELIVERED: {
        "subject": "Commande livrée · #{id}",
        "headline": "Bon appétit !",
        "emoji": "✅",
        "body": "Votre commande a été livrée. Merci d'avoir choisi YoHa — à très bientôt !",
        "accent": "#10b981",
    },
    Order.Status.CANCELLED: {
        "subject": "Commande annulée · #{id}",
        "headline": "Commande annulée",
        "emoji": "✕",
        "body": "Bonjour {name} — votre commande a été annulée. Contactez-nous si vous avez des questions.",
        "accent": "#64748b",
    },
}

TRACK_STEPS = [
    (Order.Status.PLACED, "Confirmée"),
    (Order.Status.PICKUP_CONFIRMED, "Vers resto"),
    (Order.Status.DELIVERING, "En route"),
    (Order.Status.DELIVERED, "Livré"),
]

STATUS_ORDER = [s[0] for s in TRACK_STEPS]


def status_step_index(status: str) -> int:
    if status == Order.Status.PREPARING:
        return 1
    try:
        return STATUS_ORDER.index(status)
    except ValueError:
        return 0


def get_offers(*, exclude_restaurant_id=None, limit: int = 3) -> list[dict]:
    qs = Restaurant.objects.filter(is_active=True).order_by("name")
    if exclude_restaurant_id:
        qs = qs.exclude(pk=exclude_restaurant_id)
    offers = []
    for r in qs[: limit * 2]:
        promo = (r.promo_label or "").strip() or "Livraison offerte sur le campus"
        cover = r.cover_url or r.logo_url or ""
        offers.append(
            {
                "name": r.name,
                "promo": promo,
                "cover": cover,
                "slug": r.slug,
                "eta": "15–20 min",
            }
        )
        if len(offers) >= limit:
            break
    return offers


def build_context(order: Order, status: str) -> dict | None:
    copy = STATUS_COPY.get(status)
    if not copy:
        return None
    lines = list(order.lines.all())
    items_count = sum(l.quantity for l in lines)
    ctx = {
        "id": order.public_id,
        "name": order.customer_name or "Client YoHa",
        "restaurant": order.restaurant.name,
        "total": f"{order.total_mad:.2f}".replace(".", ","),
        "items_count": items_count,
        "courier": order.courier.display_name if order.courier_id else "",
        "step_index": status_step_index(status),
        "steps": TRACK_STEPS,
        "offers": get_offers(exclude_restaurant_id=order.restaurant_id),
        "line_preview": lines[:4],
    }
    ctx.update(copy)
    ctx["subject"] = copy["subject"].format(id=order.public_id)
    ctx["body"] = copy["body"].format(name=ctx["name"], restaurant=ctx["restaurant"])
    return ctx
