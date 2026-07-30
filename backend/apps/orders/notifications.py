"""E-mails de suivi commande YoHa (HTML + texte)."""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from .email_content import STATUS_COPY, build_context
from .email_html import render_order_email_html, render_order_email_text
from .models import Order

logger = logging.getLogger(__name__)


from apps.core.email_checker import is_valid_real_email


def send_order_status_email(order: Order, status: str) -> bool:
    email = order.get_notification_email()
    if not is_valid_real_email(email):
        logger.warning("order_email_skip invalid_or_fake_email public_id=%s email=%s", order.public_id, email)
        return False



    if status not in STATUS_COPY:
        return False

    order = (
        Order.objects.select_related("restaurant", "courier")
        .prefetch_related("lines")
        .get(pk=order.pk)
    )
    ctx = build_context(order, status)
    if not ctx:
        return False

    subject = ctx["subject"]
    text_body = render_order_email_text(ctx)
    html_body = render_order_email_html(ctx)
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "yohadelivery@gmail.com")

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_email,
            to=[email],
            reply_to=["yohadelivery@gmail.com"],
        )

        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=True)

        logger.info("order_email_sent public_id=%s status=%s to=%s", order.public_id, status, email)
        return True
    except Exception:
        logger.exception("order_email_failed public_id=%s status=%s", order.public_id, status)
        return False
