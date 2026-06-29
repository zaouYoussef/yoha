"""Alertes e-mail aux livreurs — nouvelle course disponible (premier confirmé gagne)."""
from __future__ import annotations

import html
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from .models import CourierProfile, Order

logger = logging.getLogger(__name__)


def get_courier_notify_emails() -> list[str]:
    """E-mails depuis .env + comptes livreurs actifs en base."""
    configured = getattr(settings, "YOHA_COURIER_NOTIFY_EMAILS", []) or []
    emails: list[str] = []
    for raw in configured:
        addr = str(raw).strip().lower()
        if addr and "@" in addr:
            emails.append(addr)

    for cp in CourierProfile.objects.filter(is_active=True).select_related("user"):
        if cp.user_id and cp.user.email:
            addr = cp.user.email.strip().lower()
            if addr and addr not in emails:
                emails.append(addr)

    return emails


def _delivery_dashboard_url() -> str:
    base = getattr(settings, "YOHA_FRONTEND_URL", "http://localhost:3002").rstrip("/")
    return f"{base}/delivery"


def _build_courier_email(order: Order) -> tuple[str, str, str]:
    order = (
        Order.objects.select_related("restaurant")
        .prefetch_related("lines")
        .get(pk=order.pk)
    )
    lines = list(order.lines.all())
    items_lines = "\n".join(
        f"  • {line.quantity}× {line.item_name} — {line.line_total_mad:.2f} MAD"
        for line in lines
    ) or "  • (détail indisponible)"
    dash_url = _delivery_dashboard_url()
    subject = f"🛵 Nouvelle course #{order.public_id} · YoHa"
    text = (
        f"Nouvelle commande disponible — #{order.public_id}\n\n"
        f"Restaurant : {order.restaurant.name}\n"
        f"Client : {order.customer_name}\n"
        f"Adresse : {order.customer_address}\n"
        f"Total : {order.total_mad:.2f} MAD\n\n"
        f"Articles :\n{items_lines}\n\n"
        f"⚡ Le premier livreur qui confirme dans le dashboard prend la course.\n"
        f"Dashboard livreur : {dash_url}\n"
    )
    esc = html.escape
    lines_html = "".join(
        f"<li><strong>{line.quantity}×</strong> {esc(line.item_name)} "
        f"— {line.line_total_mad:.2f} MAD</li>"
        for line in lines
    ) or "<li>Détail indisponible</li>"
    html_body = f"""
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
      <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;padding:24px;border-radius:16px 16px 0 0;">
        <div style="font-size:13px;opacity:.85;font-weight:600;">YoHa · Course disponible</div>
        <div style="font-size:26px;font-weight:800;margin-top:8px;">#{esc(order.public_id)}</div>
      </div>
      <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
        <p style="font-size:15px;line-height:1.6;">
          <strong>⚡ Premier confirmé, premier servi.</strong> Connectez-vous au dashboard livreur
          et cliquez sur <strong>Confirmer la course</strong> avant les autres.
        </p>
        <p style="margin:16px 0;"><strong>Restaurant :</strong> {esc(order.restaurant.name)}<br>
        <strong>Client :</strong> {esc(order.customer_name)}<br>
        <strong>Adresse :</strong> {esc(order.customer_address)}<br>
        <strong>Total :</strong> {order.total_mad:.2f} MAD</p>
        <ul style="padding-left:18px;line-height:1.7;">{lines_html}</ul>
        <a href="{esc(dash_url)}" style="display:inline-block;margin-top:20px;padding:14px 24px;
          background:#7c3aed;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;">
          Ouvrir le dashboard livreur →
        </a>
      </div>
    </div>
    """
    return subject, text, html_body


def notify_couriers_new_order(order: Order) -> int:
    """Envoie l'alerte à tous les livreurs configurés. Retourne le nombre d'e-mails envoyés."""
    recipients = get_courier_notify_emails()
    if not recipients:
        logger.warning("courier_notify_skip no_recipients public_id=%s", order.public_id)
        return 0

    subject, text_body, html_body = _build_courier_email(order)
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "YoHa <no-reply@yoha.ma>")

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_email,
            to=recipients,
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        logger.info(
            "courier_notify_sent public_id=%s count=%s to=%s",
            order.public_id,
            len(recipients),
            ",".join(recipients[:3]),
        )
        return len(recipients)
    except Exception:
        logger.exception("courier_notify_failed public_id=%s", order.public_id)
        return 0
