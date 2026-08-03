"""Contenu, données et templates HTML pour les e-mails commande YoHa — Design premium glass morphism."""
from __future__ import annotations

import html
from urllib.parse import quote

from django.conf import settings

from apps.restaurants.models import Restaurant
from .models import Order


# ==========================================
# 1. LOGIQUE DE DONNÉES & TEXTES (COPY)
# ==========================================

STATUS_COPY = {
    Order.Status.PLACED: {
        "subject": "Commande confirmée #{id} · YoHa",
        "headline": "Commande confirmée !",
        "emoji": "🎉",
        "body": "Merci {name} — nous avons bien reçu votre commande. Préparez-vous, c'est parti !",
        "accent": "#f97316", # Orange YoHa
    },
    Order.Status.PICKUP_CONFIRMED: {
        "subject": "Livreur en route vers le restaurant · #{id}",
        "headline": "Livreur en route",
        "emoji": "🛵",
        "body": "Bonne nouvelle {name} — un livreur YoHa se dirige vers {restaurant} pour récupérer votre commande.",
        "accent": "#0ea5e9", # Bleu
    },
    Order.Status.DELIVERING: {
        "subject": "En route vers vous · #{id}",
        "headline": "Votre repas arrive",
        "emoji": "📦",
        "body": "Le livreur a récupéré votre commande et se dirige vers vous. Bon appétit bientôt !",
        "accent": "#ec4899", # Rose
    },
    Order.Status.DELIVERED: {
        "subject": "Commande livrée · #{id}",
        "headline": "Bon appétit !",
        "emoji": "✅",
        "body": "Votre commande a été livrée. Merci d'avoir choisi YoHa — à très bientôt !",
        "accent": "#10b981", # Vert
    },
    Order.Status.CANCELLED: {
        "subject": "Commande annulée · #{id}",
        "headline": "Commande annulée",
        "emoji": "✕",
        "body": "Bonjour {name} — votre commande a été annulée. Contactez-nous si vous avez des questions.",
        "accent": "#64748b", # Gris/Ardoise
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
    on_ticket = bool(lines) and all(
        (getattr(l, "line_total_mad", 0) or 0) <= 0 for l in lines
    )
    ctx = {
        "id": order.public_id,
        "status": status,
        "name": order.customer_name or "Client YoHa",
        "restaurant": order.restaurant.name,
        "total": f"{order.total_mad:.2f}".replace(".", ","),
        "items_count": items_count,
        "courier": order.courier.display_name if order.courier_id else "",
        "step_index": status_step_index(status),
        "steps": TRACK_STEPS,
        "offers": get_offers(exclude_restaurant_id=order.restaurant_id),
        "line_preview": lines[:8],
        "on_ticket": on_ticket,
    }
    ctx.update(copy)
    ctx["subject"] = copy["subject"].format(id=order.public_id)
    ctx["body"] = copy["body"].format(name=ctx["name"], restaurant=ctx["restaurant"])
    return ctx


# ==========================================
# 2. RENDU HTML / TEXTE (GLASSMORPHISM)
# ==========================================

def _abs_url(path: str) -> str:
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    base = getattr(settings, "YOHA_FRONTEND_URL", "http://localhost:3002").rstrip("/")
    return f"{base}{path if path.startswith('/') else '/' + path}"


def _tracking_url(order_id: str) -> str:
    base = getattr(settings, "YOHA_FRONTEND_URL", "http://localhost:3002").rstrip("/")
    return f"{base}/success?orderId={quote(order_id)}"


def _browse_url(slug: str = "") -> str:
    base = getattr(settings, "YOHA_FRONTEND_URL", "http://localhost:3002").rstrip("/")
    return f"{base}/restaurant/{slug}" if slug else f"{base}/browse"


def _esc(value) -> str:
    return html.escape(str(value or ""), quote=True)


def render_order_email_html(ctx: dict) -> str:
    order_id = _esc(ctx["id"])
    name = _esc(ctx["name"])
    restaurant = _esc(ctx["restaurant"])
    headline = _esc(ctx["headline"])
    emoji = ctx.get("emoji", "")
    body = _esc(ctx["body"])
    total = _esc(ctx["total"])
    items_count = ctx["items_count"]
    accent = ctx.get("accent", "#f97316")
    browse_url = _browse_url()
    step_index = ctx["step_index"]
    courier = _esc(ctx.get("courier", ""))
    logo_url = _esc(_abs_url("/logo.png"))
    tracking_url = _esc(_tracking_url(order_id))
    is_cancelled = ctx.get("status") == "cancelled" or "annul" in headline.lower()
    total_extra = (
        ' <span style="font-size:14px;font-weight:800;color:#f97316;">+ achats</span>'
        if ctx.get("on_ticket")
        else ""
    )

    # ── Progress steps (Glassmorphism adapted) ──
    if is_cancelled:
        progress_section_html = """
        <tr><td style="padding:0 32px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,228,230,0.6);
            border-radius:20px;border:1px solid rgba(255,255,255,0.8);box-shadow:0 8px 24px rgba(225,29,72,0.06);">
            <tr><td style="padding:20px 20px;text-align:center;">
              <div style="font-size:14px;font-weight:900;color:#e11d48;letter-spacing:-0.01em;">
                ❌ Statut : Commande annulée
              </div>
              <div style="font-size:13px;color:#9f1239;margin-top:6px;font-weight:600;">
                Cette commande ne donnera lieu à aucun débit.
              </div>
            </td></tr>
          </table>
        </td></tr>"""
    else:
        steps_html = ""
        for i, (_status, label) in enumerate(ctx["steps"]):
            active = i <= step_index
            current = i == step_index
            if current:
                dot_bg = f"background:linear-gradient(135deg,{accent},#ffffff);box-shadow:0 0 0 4px {accent}33, 0 4px 12px {accent}40;"
                dot_color = "#ffffff"
                label_color = "#0f172a"
                label_weight = "900"
            elif active:
                dot_bg = f"background:linear-gradient(135deg,{accent},{accent});opacity:0.8;"
                dot_color = "#ffffff"
                label_color = "#475569"
                label_weight = "700"
            else:
                dot_bg = "background:rgba(255,255,255,0.8);border:1px solid #cbd5e1;"
                dot_color = "#94a3b8"
                label_color = "#94a3b8"
                label_weight = "600"
            steps_html += f"""
            <td align="center" style="padding:0 1px;vertical-align:top;width:25%;">
              <div style="width:32px;height:32px;border-radius:999px;{dot_bg}color:{dot_color};
                font-size:12px;font-weight:800;line-height:32px;text-align:center;margin:0 auto;
                transition:all .3s;">{i + 1}</div>
              <div style="font-size:10px;color:{label_color};margin-top:10px;font-weight:{label_weight};
                letter-spacing:0.02em;">{_esc(label)}</div>
            </td>"""

        progress_pct = int(((step_index + 1) / len(ctx["steps"])) * 100)
        progress_section_html = f"""
        <tr><td style="padding:0 24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.5);
            border-radius:24px;border:1px solid rgba(255,255,255,0.8);box-shadow:0 8px 24px rgba(15,23,42,0.03);">
            <tr><td style="padding:24px 24px 12px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:14px;">
                <span style="font-size:11px;font-weight:800;text-transform:uppercase;
                  letter-spacing:0.1em;color:#64748b;">Progression</span>
                <span style="font-size:12px;font-weight:900;color:{accent};text-shadow:0 2px 8px {accent}40;">{progress_pct}%</span>
              </div>
              <div style="background:rgba(226,232,240,0.6);border-radius:999px;height:10px;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,0.05);">
                <div style="width:{progress_pct}%;height:10px;background:linear-gradient(90deg,{accent},#ffffff);
                  border-radius:999px;box-shadow:0 0 16px {accent}60;"></div>
              </div>
            </td></tr>
            <tr><td style="padding:16px 12px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>{steps_html}</tr></table>
            </td></tr>
          </table>
        </td></tr>"""

    # ── Order lines ──
    from .email_html import format_line_price_html

    lines_html = ""
    for line in ctx.get("line_preview", []):
        price_html = format_line_price_html(line)
        lines_html += f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid rgba(15,23,42,0.05);font-size:14px;color:#334155;font-weight:600;">
            <span style="display:inline-block;background:linear-gradient(135deg,#ffffff,{accent}15);
              color:{accent};font-size:12px;font-weight:900;padding:4px 10px;border-radius:8px;
              margin-right:10px;border:1px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px {accent}20;">{line.quantity}×</span>
            {_esc(line.item_name)}
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid rgba(15,23,42,0.05);font-size:14px;
            color:#0f172a;font-weight:800;font-variant-numeric:tabular-nums;">
            {price_html}
          </td>
        </tr>"""

    # ── Offers grid ──
    offers_html = ""
    for offer in ctx.get("offers", []):
        cover = _abs_url(offer.get("cover", ""))
        offers_html += f"""
        <td style="padding:8px;vertical-align:top;width:33.33%;">
          <a href="{_esc(_browse_url(offer.get('slug', '')))}" style="text-decoration:none;display:block;">
            <div style="height:110px;border-radius:18px;overflow:hidden;background:rgba(255,255,255,0.5);
              position:relative;margin-bottom:10px;box-shadow:0 4px 12px rgba(15,23,42,0.04);border:1px solid rgba(255,255,255,0.8);">
              {'<img src="' + _esc(cover) + '" style="width:100%;height:100%;object-fit:cover;display:block;"/>' if cover else '<div style="height:100%;background:#e2e8f0;"></div>'}
            </div>
            <div style="font-size:13px;font-weight:900;color:#0f172a;margin-bottom:4px;
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-0.01em;">{_esc(offer['name'])}</div>
            <div style="font-size:11px;color:#f43f5e;font-weight:800;">{_esc(offer.get('promo', ''))}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px;font-weight:600;">⚡ {_esc(offer.get('eta', ''))}</div>
          </a>
        </td>"""

    if not offers_html:
        offers_html = """
        <td colspan="3" style="padding:20px;text-align:center;color:#64748b;font-size:14px;font-weight:500;">
          Découvrez nos restaurants partenaires sur YoHa.
        </td>"""

    courier_row = f"""
    <tr>
      <td style="font-size:13px;color:#64748b;padding-top:10px;font-weight:600;">Livreur assigné</td>
      <td align="right" style="font-size:13px;font-weight:800;color:#0f172a;padding-top:10px;">{courier}</td>
    </tr>""" if courier else ""

    cta_button_html = f"""
    <a href="{_esc(browse_url)}" style="display:inline-block;
      background:linear-gradient(135deg,#f43f5e,#e11d48);color:#ffffff;
      font-size:16px;font-weight:900;text-decoration:none;padding:18px 48px;
      border-radius:20px;box-shadow:0 12px 32px rgba(244,63,94,0.3);letter-spacing:0.02em;
      border:1px solid rgba(255,255,255,0.2);">
      <span style="mso-text-raise:14pt;">🛒 Découvrir d'autres restaurants</span>
    </a>""" if is_cancelled else f"""
    <a href="{tracking_url}" style="display:inline-block;
      background:linear-gradient(135deg,{accent},#1e293b);color:#ffffff;
      font-size:16px;font-weight:900;text-decoration:none;padding:18px 48px;
      border-radius:20px;box-shadow:0 12px 32px {accent}40;letter-spacing:0.02em;
      border:1px solid rgba(255,255,255,0.2);">
      <span style="mso-text-raise:14pt;">📱 Suivre ma commande en direct</span>
    </a>"""

    offers_subtitle = "Découvrez d'autres délices sur le campus" if is_cancelled else "Pendant que vous attendez, profitez de ces promos campus"

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>{headline} · YoHa</title>
  <!--[if mso]>
  <style>table,td,div,a {{font-family:Arial,sans-serif!important;}}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#fdfbfb;background-image:linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%, #ffdde1 100%);
  background: radial-gradient(at 0% 0%, #ffe4e6 0px, transparent 50%), radial-gradient(at 100% 0%, #e0e7ff 0px, transparent 50%), radial-gradient(at 100% 100%, #fbcfe8 0px, transparent 50%), radial-gradient(at 0% 100%, #fce7f3 0px, transparent 50%);
  font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#0f172a;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#fdfbfb;">
  {emoji} {headline} — Commande #{order_id} · {total} MAD
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
  <tr><td align="center">

    <!-- Outer wrapper -->
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- ═══ LOGO ═══ -->
      <tr><td style="padding:8px 0 32px;">
        <table cellpadding="0" cellspacing="0" align="center"><tr>
          <td style="width:56px;height:56px;vertical-align:middle;">
            <img src="{logo_url}" width="56" height="56" alt="YoHa"
              style="display:block;border-radius:18px;object-fit:contain;background:#ffffff;
              box-shadow:0 8px 24px rgba(244,63,94,0.15);" />
          </td>
          <td style="padding-left:16px;">
            <div style="font-size:28px;font-weight:900;letter-spacing:-0.04em;
              background:linear-gradient(135deg,#f43f5e,#ec4899);-webkit-background-clip:text;
              -webkit-text-fill-color:transparent;background-clip:text;">YoHa</div>
            <div style="font-size:11px;color:#64748b;font-weight:800;letter-spacing:0.08em;
              text-transform:uppercase;">Campus &amp; CHU · Tanger</div>
          </td>
        </tr></table>
      </td></tr>

      <!-- ═══ HERO CARD (GLASSMORPHISM) ═══ -->
      <tr><td style="background:rgba(255,255,255,0.7);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
        border-radius:36px;border-top:1px solid rgba(255,255,255,0.9);border-left:1px solid rgba(255,255,255,0.9);
        border-right:1px solid rgba(255,255,255,0.3);border-bottom:1px solid rgba(255,255,255,0.3);
        overflow:hidden;box-shadow:0 24px 48px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04);">

        <table width="100%" cellpadding="0" cellspacing="0">
          <!-- Hero section -->
          <tr><td style="padding:48px 32px 32px;text-align:center;position:relative;">

            <!-- Floating Glow Orbs based on status accent -->
            <div style="position:absolute;top:-20px;left:-20px;width:140px;height:140px;background:{accent};
              filter:blur(80px);-webkit-filter:blur(80px);opacity:0.15;border-radius:50%;"></div>
            <div style="position:absolute;bottom:-20px;right:-20px;width:140px;height:140px;background:#ffffff;
              filter:blur(80px);-webkit-filter:blur(80px);opacity:0.5;border-radius:50%;"></div>

            <!-- Emoji badge -->
            <div style="display:inline-block;width:88px;height:88px;border-radius:28px;
              background:linear-gradient(135deg,#ffffff,{accent}15);line-height:88px;
              font-size:42px;text-align:center;margin-bottom:24px;border:1px solid rgba(255,255,255,0.8);
              box-shadow:0 12px 32px {accent}20;text-shadow:0 4px 12px rgba(0,0,0,0.1);">{emoji}</div>

            <h1 style="margin:0 0 12px;font-size:32px;font-weight:900;letter-spacing:-0.04em;
              color:#0f172a;line-height:1.15;text-shadow:0 2px 10px rgba(255,255,255,0.8);">{headline}</h1>
            <p style="margin:0;font-size:16px;line-height:1.65;color:#475569;max-width:440px;font-weight:500;
              margin-left:auto;margin-right:auto;">Bonjour <strong style="color:#0f172a;font-weight:800;">{name}</strong>,<br/>
              {body}</p>
          </td></tr>

          <!-- ═══ PROGRESS / STATUS BAR ═══ -->
          {progress_section_html}
        </table>
      </td></tr>

      <!-- ═══ ORDER RECAP (GLASS) ═══ -->
      <tr><td style="padding:24px 0 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.65);
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border-radius:32px;border-top:1px solid rgba(255,255,255,0.9);border-left:1px solid rgba(255,255,255,0.9);
          border-right:1px solid rgba(255,255,255,0.3);border-bottom:1px solid rgba(255,255,255,0.3);
          overflow:hidden;box-shadow:0 16px 40px rgba(15,23,42,0.06);">
          <tr><td style="padding:32px 32px 16px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
              <div style="display:inline-block;width:12px;height:12px;border-radius:6px;
                background:linear-gradient(135deg,{accent},#ffffff);box-shadow:0 2px 8px {accent}60;"></div>
              <div style="font-size:13px;font-weight:900;text-transform:uppercase;
                letter-spacing:0.15em;color:#475569;">Récapitulatif</div>
              <div style="font-size:14px;font-weight:900;color:#0f172a;margin-left:auto;
                background:rgba(255,255,255,0.8);padding:4px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.9);">#{order_id}</div>
            </div>

            <!-- Info rows -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:14px;color:#64748b;font-weight:600;padding-bottom:8px;">Restaurant</td>
                <td align="right" style="font-size:14px;font-weight:900;color:#0f172a;padding-bottom:8px;">{restaurant}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#64748b;font-weight:600;padding-bottom:16px;">Articles</td>
                <td align="right" style="font-size:14px;font-weight:900;color:#0f172a;padding-bottom:16px;">{items_count}</td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="height:2px;background:linear-gradient(90deg,transparent,rgba(15,23,42,0.05),transparent);
              margin:0 0 16px;"></div>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0">{lines_html}</table>

            <!-- Total -->
            <div style="height:2px;background:linear-gradient(90deg,transparent,rgba(15,23,42,0.05),transparent);
              margin:16px 0;"></div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:16px;font-weight:900;color:#0f172a;">Total</td>
                <td align="right" style="font-size:26px;font-weight:900;
                  background:linear-gradient(135deg,{accent},#0f172a);-webkit-background-clip:text;
                  -webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.02em;">{total} <span style="font-size:16px;font-weight:800;-webkit-text-fill-color:#64748b;">MAD</span>{total_extra}</td>
              </tr>
              {courier_row}
            </table>
          </td></tr>
        </table>
      </td></tr>

      <!-- ═══ CTA BUTTON ═══ -->
      <tr><td style="padding:24px 0 16px;text-align:center;">
        {cta_button_html}
      </td></tr>

      <!-- ═══ OFFERS (GLASS) ═══ -->
      <tr><td style="padding:16px 0 8px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.55);
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border-radius:32px;border-top:1px solid rgba(255,255,255,0.9);border-left:1px solid rgba(255,255,255,0.9);
          border-right:1px solid rgba(255,255,255,0.3);border-bottom:1px solid rgba(255,255,255,0.3);
          overflow:hidden;box-shadow:0 16px 32px rgba(15,23,42,0.06);">
          <tr><td style="padding:32px 28px 12px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
              <span style="font-size:22px;text-shadow:0 4px 12px rgba(0,0,0,0.1);">✨</span>
              <div style="font-size:20px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">Offres du moment</div>
            </div>
            <div style="font-size:13px;color:#64748b;margin-top:4px;font-weight:500;">{offers_subtitle}</div>
          </td></tr>
          <tr><td style="padding:12px 16px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>{offers_html}</tr></table>
          </td></tr>
          <tr><td style="padding:0 28px 32px;text-align:center;">
            <a href="{_esc(browse_url)}" style="display:inline-block;
              background:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.9);
              color:#475569;font-size:14px;font-weight:800;text-decoration:none;
              padding:14px 32px;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.04);">Voir tous les restaurants →</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- ═══ FOOTER ═══ -->
      <tr><td style="padding:48px 16px 32px;text-align:center;">
        <!-- Divider -->
        <div style="height:2px;background:linear-gradient(90deg,transparent,rgba(15,23,42,0.1),transparent);
          margin:0 auto 28px;max-width:240px;"></div>

        <p style="margin:0 0 10px;font-size:12px;color:#64748b;line-height:1.6;font-weight:600;">
          YoHa · Livraison intelligente pour les résidences universitaires et les hôpitaux.
        </p>
        <p style="margin:0 0 16px;font-size:12px;color:#94a3b8;font-weight:500;">
          Conçu sur le campus, livré chez vous. 🎓
        </p>
        <p style="margin:0;font-size:11px;color:#cbd5e1;letter-spacing:0.02em;font-weight:500;">
          © 2026 YoHa · Fait avec ❤️ à Tanger
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""


def render_order_email_text(ctx: dict) -> str:
    from .email_html import format_line_price_text

    is_cancelled = ctx.get("status") == "cancelled" or "annul" in ctx.get("headline", "").lower()
    browse = _browse_url()
    total_label = f"{ctx['total']} MAD"
    if ctx.get("on_ticket"):
        total_label += " + achats"
    lines = [
        f"{ctx.get('headline', 'YoHa')} {ctx.get('emoji', '')} ✨",
        "",
        f"Bonjour {ctx['name']},",
        ctx["body"],
        "",
        f"Commande : #{ctx['id']}",
        f"Restaurant : {ctx['restaurant']}",
        "Articles :",
    ]
    for line in ctx.get("line_preview", []):
        lines.append(f"  • {line.quantity}× {line.item_name} — {format_line_price_text(line)}")
    lines.extend([
        f"Total : {total_label}",
        "",
    ])
    if is_cancelled:
        lines.append(f"Découvrir d'autres restaurants : {browse}")
    else:
        track = _tracking_url(ctx["id"])
        lines.append(f"📱 Suivre ma commande en direct : {track}")

    lines.extend([
        "",
        "— ✨ Offres du moment —",
    ])
    for offer in ctx.get("offers", []):
        lines.append(f"• {offer['name']} — {offer.get('promo', '')} ({offer.get('eta', '')})")
        lines.append(f"  {_browse_url(offer.get('slug', ''))}")
    lines.extend(["", "— YoHa · Livraison campus & CHU"])
    return "\n".join(lines)