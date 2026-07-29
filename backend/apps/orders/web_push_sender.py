"""Envoi de notifications Web Push (VAPID) aux livreurs connectes."""

import json
import logging

from django.conf import settings

from apps.accounts.push_models import WebPushSubscription

logger = logging.getLogger(__name__)

_PEM_HEADER = "-----BEGIN PRIVATE KEY-----"
_PEM_FOOTER = "-----END PRIVATE KEY-----"


def _get_vapid_private_key() -> str:
    """Retourne la cle privee VAPID au format PEM."""
    raw = getattr(settings, "VAPID_PRIVATE_KEY", "")
    if not raw:
        return ""
    if raw.startswith(_PEM_HEADER):
        return raw
    # raw is URL-safe base64 DER without markers -> reconstruire PEM
    try:
        b64 = raw.replace("-", "+").replace("_", "/")
        missing = len(b64) % 4
        if missing:
            b64 += "=" * (4 - missing)
        lines = [b64[i:i+64] for i in range(0, len(b64), 64)]
        return _PEM_HEADER + "\n" + "\n".join(lines) + "\n" + _PEM_FOOTER
    except Exception as exc:
        logger.error("vapid_private_key_parse_error %s", exc)
        return ""


def _send_web_push(sub, payload: str, vapid_private: str, vapid_claims_email: str) -> bool:
    from pywebpush import webpush, WebPushException

    try:
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh_key,
                    "auth": sub.auth_key,
                },
            },
            data=payload,
            vapid_private_key=vapid_private,
            vapid_claims={"sub": f"mailto:{vapid_claims_email}"},
            ttl=86400,
        )
        return True
    except WebPushException as exc:
        status = exc.response.status_code if exc.response else None
        body = exc.response.text if exc.response else None
        logger.warning("web_push_failed user=%s status=%s body=%s", sub.user_id, status, body)
        if status in (410, 404):
            sub.delete()
    except Exception:
        logger.exception("web_push_error user=%s endpoint=%.48s", sub.user_id, sub.endpoint)
    return False


def _vapid_private_raw() -> str:
    """Retourne la cle privee VAPID brute (URL-safe base64, sans PEM)."""
    return getattr(settings, "VAPID_PRIVATE_KEY", "")


def send_courier_web_push(*, title: str, body: str, data: dict | None = None) -> int:
    """Envoie une notification Web Push a tous les livreurs et admins abonnés.

    Retourne le nombre de pushes envoyes avec succes.
    """
    vapid_private = _vapid_private_raw()
    vapid_claims_email = getattr(settings, "VAPID_CLAIMS_EMAIL", "no-reply@yoha.ma")

    if not vapid_private:
        logger.warning("web_push_skip no_vapid_private_key")
        return 0

    payload = json.dumps({
        "title": title,
        "body": body,
        "data": data or {},
    })

    # Notifier tous les livreurs, admins et superadmins inscrits au Web Push
    subs = list(
        WebPushSubscription.objects.select_related("user").filter(
            user__role__in=["courier", "admin", "superadmin"],
        ).iterator()
    )

    if not subs:
        logger.info("web_push_skip no_courier_subscribers")
        return 0

    success = 0
    for sub in subs:
        if _send_web_push(sub, payload, vapid_private, vapid_claims_email):
            success += 1

    logger.info("web_push_sent success=%s total=%s", success, len(subs))
    return success


def send_courier_new_order_web_push(order) -> int:
    """Notifie les livreurs d'une nouvelle commande disponible."""
    title = f"\U0001f6f5 Nouvelle course #{order.public_id}"
    body = f"{order.restaurant.name if order.restaurant_id else 'Commande'} - {order.total_mad:.2f} MAD"
    data = {
        "type": "new_order",
        "orderId": order.public_id,
        "url": "/delivery",
    }
    return send_courier_web_push(title=title, body=body, data=data)


def send_restaurant_new_order_web_push(order) -> int:
    """Notifie les gerants de restaurant d'une nouvelle commande."""
    restaurant_name = order.restaurant.name if order.restaurant_id else "Restaurant"
    title = f"\U0001f354 Nouvelle commande #{order.public_id}"
    body = f"{restaurant_name} · {order.total_mad:.2f} MAD"
    data = {
        "type": "restaurant_new_order",
        "orderId": order.public_id,
        "url": "/restaurant-dash",
    }

    vapid_private = _vapid_private_raw()
    vapid_claims_email = getattr(settings, "VAPID_CLAIMS_EMAIL", "no-reply@yoha.ma")
    if not vapid_private:
        return 0

    payload = json.dumps({
        "title": title,
        "body": body,
        "data": data,
    })

    from django.db.models import Q
    query = Q(user__role__in=["restaurant", "admin", "superadmin"])
    if order.restaurant_id and getattr(order.restaurant, "owner_id", None):
        query |= Q(user_id=order.restaurant.owner_id)

    subs = list(
        WebPushSubscription.objects.filter(query).iterator()
    )
    if not subs:
        return 0

    success = 0
    for sub in subs:
        if _send_web_push(sub, payload, vapid_private, vapid_claims_email):
            success += 1

    logger.info("web_push_restaurant_sent order=%s success=%s", order.public_id, success)
    return success
