"""Alertes e-mail aux livreurs — nouvelle course disponible (premier confirmé gagne)."""
from __future__ import annotations

import html
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from .models import CourierProfile, Order

logger = logging.getLogger(__name__)


def get_courier_notify_emails() -> list[str]:
    """E-mails depuis .env + comptes livreurs actifs en base (exclut les faux e-mails de test)."""
    configured = getattr(settings, "YOHA_COURIER_NOTIFY_EMAILS", []) or []
    emails: list[str] = []
    for raw in configured:
        addr = str(raw).strip().lower()
        if addr and "@" in addr and not addr.endswith("@yoha.ma"):
            emails.append(addr)

    for cp in CourierProfile.objects.filter(is_active=True).select_related("user"):
        if cp.user_id and cp.user.email:
            addr = cp.user.email.strip().lower()
            if addr and addr not in emails and not addr.endswith("@yoha.ma"):
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
    logo_url = html.escape(
        _abs_url("/logo.png"), quote=True
    )

    subject = f"🛵 Nouvelle course #{order.public_id} · YoHa"
    resto_phone = (order.restaurant.phone or "").strip() if order.restaurant_id else ""
    client_phone = (order.customer_phone or "").strip()
    text_parts = [
        f"Nouvelle commande disponible — #{order.public_id}",
        "",
        f"Restaurant : {order.restaurant.name}",
    ]
    if resto_phone:
        text_parts.append(f"Tél restaurant : {resto_phone}")
    text_parts.extend([
        f"Client : {order.customer_name}",
        f"Adresse : {order.customer_address}",
    ])
    if client_phone:
        text_parts.append(f"Tél client : {client_phone}")
    text_parts.extend([
        f"Total : {order.total_mad:.2f} MAD",
        "",
        "Articles :",
        items_lines,
        "",
        "⚡ Le premier livreur qui confirme dans le dashboard prend la course.",
        f"Dashboard livreur : {dash_url}",
    ])
    text = "\n".join(text_parts) + "\n"
    esc = html.escape
    items_html = ""
    for line in lines:
        items_html += f"""
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f920;font-size:13px;color:#334155;">
            <span style="display:inline-block;background:linear-gradient(135deg,#7c3aed18,#7c3aed08);
              color:#7c3aed;font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;
              margin-right:8px;">{line.quantity}×</span>
            {esc(line.item_name)}
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #f1f5f920;font-size:13px;
            color:#334155;font-weight:700;font-variant-numeric:tabular-nums;">
            {line.line_total_mad:.2f} <span style="color:#94a3b8;font-weight:500;">MAD</span>
          </td>
        </tr>"""

    if not items_html:
        items_html = '<tr><td style="padding:12px 0;color:#94a3b8;font-size:13px;">Détail indisponible</td></tr>'

    html_body = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>Nouvelle course #{esc(order.public_id)} · YoHa</title>
</head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#faf8f5;">
  🛵 Nouvelle course #{esc(order.public_id)} — {esc(order.restaurant.name)} — {order.total_mad:.2f} MAD
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- ═══ LOGO ═══ -->
  <tr><td style="padding:8px 0 28px;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="width:48px;height:48px;vertical-align:middle;">
        <img src="{logo_url}" width="48" height="48" alt="YoHa"
          style="display:block;border-radius:14px;object-fit:contain;background:#ffffff;
          box-shadow:0 4px 12px rgba(0,0,0,0.08);" />
      </td>
      <td style="padding-left:14px;">
        <div style="font-size:24px;font-weight:900;letter-spacing:-0.03em;
          background:linear-gradient(135deg,#7c3aed,#ec4899);-webkit-background-clip:text;
          -webkit-text-fill-color:transparent;background-clip:text;">YoHa</div>
        <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.04em;
          text-transform:uppercase;">Espace livreur</div>
      </td>
    </tr></table>
  </td></tr>

  <!-- ═══ HERO CARD ═══ -->
  <tr><td style="background:#ffffff;border-radius:28px;border:1px solid #f1f5f9;
    overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.06),0 1px 3px rgba(15,23,42,0.04);">

    <!-- Gradient accent bar -->
    <div style="height:5px;background:linear-gradient(90deg,#7c3aed,#ec4899,#f97316);
      font-size:0;line-height:0;">&nbsp;</div>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:36px 32px 24px;text-align:center;position:relative;">
        <!-- Decorative dots -->
        <div style="position:absolute;top:24px;right:24px;width:48px;height:48px;
          background:radial-gradient(circle,#7c3aed10 1px,transparent 1px);
          background-size:8px 8px;opacity:0.5;"></div>

        <!-- Emoji badge -->
        <div style="display:inline-block;width:80px;height:80px;border-radius:24px;
          background:linear-gradient(135deg,#7c3aed15,#ec489910);line-height:80px;
          font-size:40px;text-align:center;margin-bottom:20px;
          box-shadow:0 8px 24px rgba(124,58,237,0.12);">🛵</div>

        <div style="display:inline-block;padding:6px 16px;
          background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1px solid #ddd6fe;
          border-radius:20px;font-size:11px;font-weight:800;color:#7c3aed;
          text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;">⚡ Course disponible</div>

        <h1 style="margin:0 0 10px;font-size:32px;font-weight:900;color:#0f172a;
          letter-spacing:-0.03em;line-height:1.15;">#{esc(order.public_id)}</h1>
        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;max-width:400px;
          margin-left:auto;margin-right:auto;">
          <strong style="color:#7c3aed;">Premier confirmé, premier servi.</strong>
          Connectez-vous au dashboard et confirmez avant les autres.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- ═══ ORDER INFO ═══ -->
  <tr><td style="padding:20px 0 8px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;
      border-radius:22px;border:1px solid #f1f5f9;overflow:hidden;
      box-shadow:0 8px 24px rgba(15,23,42,0.04);">
      <tr><td style="padding:24px 24px 8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <div style="display:inline-block;width:8px;height:8px;border-radius:4px;
            background:linear-gradient(135deg,#7c3aed,#ec4899);"></div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
            letter-spacing:0.1em;color:#94a3b8;">Détails de la course</div>
        </div>

        <!-- Info grid -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 12px;background:linear-gradient(135deg,#faf5ff,#f5f3ff);
              border-radius:12px;border:1px solid #ede9fe;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;
                color:#a78bfa;margin-bottom:4px;">🏪 Restaurant</div>
              <div style="font-size:14px;font-weight:800;color:#0f172a;">{esc(order.restaurant.name)}</div>
              {f'<div style="font-size:12px;color:#059669;font-weight:700;margin-top:4px;">📞 {esc(resto_phone)}</div>' if resto_phone else ''}
            </td>
            <td width="12"></td>
            <td style="padding:10px 12px;background:linear-gradient(135deg,#faf5ff,#f5f3ff);
              border-radius:12px;border:1px solid #ede9fe;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;
                color:#a78bfa;margin-bottom:4px;">💰 Total</div>
              <div style="font-size:16px;font-weight:900;
                color:#7c3aed;">{order.total_mad:.2f} MAD</div>
            </td>
          </tr>
        </table>

        <!-- Address -->
        <div style="margin-top:12px;padding:12px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);
          border-radius:12px;border:1px solid #bbf7d0;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;
            color:#10b981;margin-bottom:4px;">📍 Livrer à</div>
          <div style="font-size:13px;font-weight:700;color:#0f172a;">{esc(order.customer_name)}</div>
          <div style="font-size:12px;color:#475569;margin-top:2px;">{esc(order.customer_address)}</div>
          {f'<div style="font-size:12px;color:#7c3aed;font-weight:700;margin-top:4px;">📞 {esc(client_phone)}</div>' if client_phone else ''}
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- ═══ ITEMS ═══ -->
  <tr><td style="padding:12px 0 8px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;
      border-radius:22px;border:1px solid #f1f5f9;overflow:hidden;
      box-shadow:0 8px 24px rgba(15,23,42,0.04);">
      <tr><td style="padding:20px 24px 8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:16px;">📋</span>
          <div style="font-size:13px;font-weight:800;color:#0f172a;">Articles</div>
        </div>
      </td></tr>
      <tr><td style="padding:0 24px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">{items_html}</table>
      </td></tr>
    </table>
  </td></tr>

  <!-- ═══ CTA ═══ -->
  <tr><td style="padding:24px 0 8px;text-align:center;">
    <a href="{esc(dash_url)}" style="display:inline-block;
      background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#ffffff;
      font-size:16px;font-weight:800;text-decoration:none;padding:18px 48px;
      border-radius:16px;box-shadow:0 8px 24px rgba(124,58,237,0.3);
      letter-spacing:0.01em;">Ouvrir le dashboard livreur 🏍️</a>
  </td></tr>

  <!-- ═══ FOOTER ═══ -->
  <tr><td style="padding:40px 16px 24px;text-align:center;">
    <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);
      margin:0 auto 24px;max-width:200px;"></div>
    <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;line-height:1.6;font-weight:500;">
      YoHa · Espace livreur — Tanger
    </p>
    <p style="margin:0;font-size:10px;color:#cbd5e1;">© 2026 YoHa · Fait avec ❤️ à Tanger</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""
    return subject, text, html_body


def _abs_url(path: str) -> str:
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    base = getattr(settings, "YOHA_FRONTEND_URL", "http://localhost:3002").rstrip("/")
    return f"{base}{path if path.startswith('/') else '/' + path}"


def notify_couriers_new_order(order: Order) -> int:
    """Alerte livreurs : les e-mails aux livreurs sont désactivés à 100%. Seuls les WebPushes/WebSockets/Pushs mobiles restent actifs."""
    logger.info("courier_email_notifications_disabled public_id=%s", order.public_id)

    # Web Push aux livreurs connectes
    try:
        from .web_push_sender import send_courier_new_order_web_push
        wp_count = send_courier_new_order_web_push(order)
        logger.info("courier_web_push_sent public_id=%s count=%s", order.public_id, wp_count)
    except Exception:
        logger.exception("courier_web_push_failed public_id=%s", order.public_id)

    # Push Mobile Expo aux livreurs
    try:
        from .push_notifications import send_courier_new_order_push
        send_courier_new_order_push(order)
    except Exception:
        logger.exception("courier_expo_push_failed public_id=%s", order.public_id)

    return 0
