"""Push mobile client / restaurant — même téléphone en veille ou app fermée."""

import logging

from apps.accounts.push_models import PushDevice
from apps.core.expo_push import send_expo_push

from .models import Order
from .push_models import OrderPushSubscription

logger = logging.getLogger(__name__)

CLIENT_STATUS_LABELS: dict[str, tuple[str, str]] = {
    Order.Status.PLACED: ("Commande confirmée", "Votre commande est bien enregistrée."),
    Order.Status.PICKUP_CONFIRMED: (
        "Livreur en route",
        "Un livreur se dirige vers le restaurant.",
    ),
    Order.Status.PREPARING: ("En préparation", "Le restaurant prépare votre commande."),
    Order.Status.DELIVERING: ("En route vers vous", "Votre livreur arrive bientôt !"),
    Order.Status.DELIVERED: ("Livré ! 🎉", "Bon appétit ! N'oubliez pas de noter votre expérience ★"),
    Order.Status.CANCELLED: ("Commande annulée", "Cette commande a été annulée."),
}


def _tokens_for_user(user_id) -> list[str]:
    if not user_id:
        return []
    return list(
        PushDevice.objects.filter(user_id=user_id).values_list("expo_push_token", flat=True)
    )


def _tokens_for_order(order: Order) -> list[str]:
    """Tokens compte client + abonnements invité pour cette commande."""
    tokens: set[str] = set(_tokens_for_user(order.client_id))
    if order.public_id:
        subs = OrderPushSubscription.objects.filter(public_id=order.public_id).values_list(
            "expo_push_token",
            flat=True,
        )
        tokens.update(subs)
    return [t for t in tokens if t]


def notify_restaurant_new_order(order: Order) -> int:
    """Course confirmée par un livreur — alerte le propriétaire du restaurant."""
    order = Order.objects.select_related("restaurant__owner", "courier").get(pk=order.pk)
    owner_id = order.restaurant.owner_id if order.restaurant_id else None
    count = 0
    if owner_id:
        tokens = _tokens_for_user(owner_id)
        title = "Commande à préparer"
        body = f"#{order.public_id} · {order.customer_name} — livreur en route"
        count = send_expo_push(
            tokens,
            title=f"🔔 {title}",
            body=body,
            data={"orderId": order.public_id, "type": "restaurant_new_order"},
        )
        if count:
            logger.info("push_restaurant_new public_id=%s sent=%s", order.public_id, count)

    # Web Push restaurant
    try:
        from .web_push_sender import send_restaurant_new_order_web_push
        wp_count = send_restaurant_new_order_web_push(order)
        if wp_count:
            logger.info("push_restaurant_web public_id=%s sent=%s", order.public_id, wp_count)
            count += wp_count
    except Exception:
        logger.exception("push_restaurant_web_error public_id=%s", order.public_id)

    return count


def notify_client_order_status(order: Order, status: str) -> int:
    """Changement de statut — alerte le client (compte ou invité abonné)."""
    labels = CLIENT_STATUS_LABELS.get(status)
    if not labels:
        return 0
    title, desc = labels
    tokens = _tokens_for_order(order)
    count = 0
    if tokens:
        count = send_expo_push(
            tokens,
            title=title,
            body=f"{desc} (#{order.public_id})",
            data={"orderId": order.public_id, "status": status, "type": "client_status"},
        )
        if count:
            logger.info("push_client_status public_id=%s status=%s sent=%s", order.public_id, status, count)

    # Web Push pour le client (navigateur, même Chrome fermé)
    try:
        from .web_push_sender import send_client_web_push
        wc = send_client_web_push(
            order=order,
            title=title,
            body=desc,
            data={"orderId": order.public_id, "status": status, "type": "client_status", "url": f"/order/{order.public_id}"},
        )
        if wc:
            logger.info("push_client_web public_id=%s status=%s sent=%s", order.public_id, status, wc)
            count += wc
    except Exception:
        logger.exception("push_client_web_error public_id=%s", order.public_id)

    return count
