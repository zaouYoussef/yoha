"""Envoi de notifications Web Push (VAPID) aux livreurs connectes."""

import json
import logging

from django.conf import settings

from apps.accounts.push_models import WebPushSubscription

logger = logging.getLogger(__name__)


def send_courier_web_push(*, title: str, body: str, data: dict | None = None) -> int:
    """Envoie une notification Web Push a tous les livreurs abonnes.

    Retourne le nombre de pushes envoyes avec succes.
    """
    from pywebpush import WebPusher, WebPushException

    vapid_private = getattr(settings, "VAPID_PRIVATE_KEY", "")
    vapid_claims_email = getattr(settings, "VAPID_CLAIMS_EMAIL", "no-reply@yoha.ma")

    if not vapid_private:
        logger.warning("web_push_skip no_vapid_private_key")
        return 0

    payload = json.dumps({
        "title": title,
        "body": body,
        "data": data or {},
    })

    subs = list(
        WebPushSubscription.objects.select_related("user").filter(
            user__courier_profile__is_active=True,
            user__role="courier",
        ).iterator()
    )

    if not subs:
        logger.info("web_push_skip no_subscribers")
        return 0

    success = 0
    for sub in subs:
        try:
            WebPusher({
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh_key,
                    "auth": sub.auth_key,
                },
            }).send(
                data=payload,
                vapid_private_key=vapid_private,
                vapid_claims={"sub": f"mailto:{vapid_claims_email}"},
                ttl=86400,
            )
            success += 1
        except WebPushException as exc:
            if exc.response and exc.response.status_code in (410, 404):
                logger.info("web_push_expired user=%s endpoint=%.48s", sub.user_id, sub.endpoint)
                sub.delete()
            else:
                logger.warning(
                    "web_push_fail user=%s endpoint=%.48s status=%s",
                    sub.user_id,
                    sub.endpoint,
                    exc.response.status_code if exc.response else "?",
                )
        except Exception:
            logger.exception("web_push_error user=%s endpoint=%.48s", sub.user_id, sub.endpoint)

    logger.info("web_push_sent success=%s total=%s", success, len(subs))
    return success


def send_courier_new_order_web_push(order) -> int:
    """Notifie les livreurs d'une nouvelle commande disponible."""
    title = f"\U0001f6f5 Nouvelle course #{order.public_id}"
    body = f"{order.restaurant.name} - {order.total_mad:.2f} MAD"
    data = {
        "type": "new_order",
        "orderId": order.public_id,
        "url": "/delivery",
    }
    return send_courier_web_push(title=title, body=body, data=data)


def send_restaurant_new_order_web_push(order) -> int:
    """Notifie le restaurant qu'un livreur a pris la commande."""
    restaurant_name = order.restaurant.name if order.restaurant_id else "?"
    title = f"\U0001f6f5 Course prise #{order.public_id}"
    body = f"Par {order.courier.display_name if order.courier_id else 'un livreur'} - {restaurant_name}"
    data = {
        "type": "restaurant_new_order",
        "orderId": order.public_id,
        "url": "/restaurant-dash",
    }

    vapid_private = getattr(settings, "VAPID_PRIVATE_KEY", "")
    vapid_claims_email = getattr(settings, "VAPID_CLAIMS_EMAIL", "no-reply@yoha.ma")
    if not vapid_private:
        return 0

    payload = json.dumps({
        "title": title,
        "body": body,
        "data": data,
    })

    # Envoyer au proprietaire du restaurant
    owner_id = order.restaurant.owner_id if order.restaurant_id else None
    if not owner_id:
        return 0

    subs = list(
        WebPushSubscription.objects.filter(user_id=owner_id).iterator()
    )
    if not subs:
        return 0

    from pywebpush import WebPusher
    from pywebpush import WebPushException

    success = 0
    for sub in subs:
        try:
            WebPusher({
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh_key,
                    "auth": sub.auth_key,
                },
            }).send(
                data=payload,
                vapid_private_key=vapid_private,
                vapid_claims={"sub": f"mailto:{vapid_claims_email}"},
                ttl=86400,
            )
            success += 1
        except WebPushException as exc:
            if exc.response and exc.response.status_code in (410, 404):
                logger.info("web_push_restaurant_expired user=%s", sub.user_id)
                sub.delete()
            else:
                logger.warning("web_push_restaurant_fail user=%s status=%s", sub.user_id,
                               exc.response.status_code if exc.response else "?")
        except Exception:
            logger.exception("web_push_restaurant_error user=%s", sub.user_id)

    logger.info("web_push_restaurant_sent order=%s success=%s", order.public_id, success)
    return success
