"""Templates HTML e-mail YoHa — Design premium glass morphism."""
from __future__ import annotations

import html
from urllib.parse import quote

from django.conf import settings


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

    # ── Progress steps ──
    if is_cancelled:
        progress_section_html = """
        <tr><td style="padding:0 32px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f2;
            border-radius:16px;border:1px solid #fecdd3;">
            <tr><td style="padding:16px 20px;text-align:center;">
              <div style="font-size:14px;font-weight:800;color:#e11d48;">
                ❌ Statut : Commande annulée
              </div>
              <div style="font-size:12px;color:#9f1239;margin-top:4px;">
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
                dot_bg = f"background:linear-gradient(135deg,{accent},#ec4899);box-shadow:0 0 0 4px {accent}33;"
                dot_color = "#ffffff"
                label_color = "#0f172a"
                label_weight = "800"
            elif active:
                dot_bg = "background:linear-gradient(135deg,#10b981,#059669);"
                dot_color = "#ffffff"
                label_color = "#475569"
                label_weight = "600"
            else:
                dot_bg = "background:#e2e8f0;"
                dot_color = "#94a3b8"
                label_color = "#94a3b8"
                label_weight = "500"
            steps_html += f"""
            <td align="center" style="padding:0 1px;vertical-align:top;width:25%;">
              <div style="width:32px;height:32px;border-radius:999px;{dot_bg}color:{dot_color};
                font-size:12px;font-weight:700;line-height:32px;text-align:center;margin:0 auto;
                transition:all .3s;">{i + 1}</div>
              <div style="font-size:10px;color:{label_color};margin-top:8px;font-weight:{label_weight};
                letter-spacing:0.01em;">{_esc(label)}</div>
            </td>"""

        progress_pct = int(((step_index + 1) / len(ctx["steps"])) * 100)
        progress_section_html = f"""
        <tr><td style="padding:0 32px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;
            border-radius:16px;border:1px solid #f1f5f9;">
            <tr><td style="padding:20px 20px 8px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;
                  letter-spacing:0.08em;color:#94a3b8;">Progression</span>
                <span style="font-size:10px;font-weight:800;color:{accent};">{progress_pct}%</span>
              </div>
              <div style="background:#e2e8f0;border-radius:999px;height:8px;overflow:hidden;">
                <div style="width:{progress_pct}%;height:8px;background:linear-gradient(90deg,{accent},#ec4899);
                  border-radius:999px;box-shadow:0 0 12px {accent}40;"></div>
              </div>
            </td></tr>
            <tr><td style="padding:16px 12px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>{steps_html}</tr></table>
            </td></tr>
          </table>
        </td></tr>"""

    # ── Order lines ──
    lines_html = ""
    for line in ctx.get("line_preview", []):
        lines_html += f"""
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f920;font-size:13px;color:#334155;">
            <span style="display:inline-block;background:linear-gradient(135deg,{accent}18,{accent}08);
              color:{accent};font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;
              margin-right:8px;">{line.quantity}×</span>
            {_esc(line.item_name)}
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #f1f5f920;font-size:13px;
            color:#334155;font-weight:700;font-variant-numeric:tabular-nums;">
            {line.line_total_mad:.2f} <span style="color:#94a3b8;font-weight:500;">MAD</span>
          </td>
        </tr>"""

    # ── Offers grid ──
    offers_html = ""
    for offer in ctx.get("offers", []):
        cover = _abs_url(offer.get("cover", ""))
        offers_html += f"""
        <td style="padding:8px;vertical-align:top;width:33.33%;">
          <a href="{_esc(_browse_url(offer.get('slug', '')))}" style="text-decoration:none;display:block;">
            <div style="height:100px;border-radius:14px;overflow:hidden;background:#f8fafc;
              position:relative;margin-bottom:8px;">
              {'<img src="' + _esc(cover) + '" style="width:100%;height:100%;object-fit:cover;display:block;"/>' if cover else '<div style="height:100%;background:#e2e8f0;"></div>'}
            </div>
            <div style="font-size:12px;font-weight:800;color:#0f172a;margin-bottom:2px;
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{_esc(offer['name'])}</div>
            <div style="font-size:10px;color:#f97316;font-weight:700;">{_esc(offer.get('promo', ''))}</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:2px;">⚡ {_esc(offer.get('eta', ''))}</div>
          </a>
        </td>"""

    if not offers_html:
        offers_html = """
        <td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;font-size:13px;">
          Découvrez nos restaurants partenaires sur YoHa.
        </td>"""

    courier_row = f"""
    <tr>
      <td style="font-size:12px;color:#94a3b8;padding-top:4px;">Livreur</td>
      <td align="right" style="font-size:12px;font-weight:700;color:#0f172a;padding-top:4px;">{courier}</td>
    </tr>""" if courier else ""

    cta_button_html = f"""
    <a href="{_esc(browse_url)}" style="display:inline-block;
      background:linear-gradient(135deg,#f97316,#ec4899);color:#ffffff;
      font-size:15px;font-weight:800;text-decoration:none;padding:16px 40px;
      border-radius:16px;box-shadow:0 8px 24px rgba(249,115,22,0.3);letter-spacing:0.01em;">
      <span style="mso-text-raise:14pt;">🛒 Découvrir d'autres restaurants</span>
    </a>""" if is_cancelled else f"""
    <a href="{tracking_url}" style="display:inline-block;
      background:linear-gradient(135deg,{accent},#ec4899);color:#ffffff;
      font-size:15px;font-weight:800;text-decoration:none;padding:16px 40px;
      border-radius:16px;box-shadow:0 8px 24px {accent}35;letter-spacing:0.01em;">
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
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;color:#0f172a;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#faf8f5;">
  {emoji} {headline} — Commande #{order_id} · {total} MAD
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:32px 16px;">
  <tr><td align="center">

    <!-- Outer wrapper -->
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

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
              background:linear-gradient(135deg,#f97316,#ec4899);-webkit-background-clip:text;
              -webkit-text-fill-color:transparent;background-clip:text;">YoHa</div>
            <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.04em;
              text-transform:uppercase;">Campus &amp; CHU · Tanger</div>
          </td>
        </tr></table>
      </td></tr>

      <!-- ═══ HERO CARD ═══ -->
      <tr><td style="background:#ffffff;border-radius:28px;border:1px solid #f1f5f9;
        overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.06),0 1px 3px rgba(15,23,42,0.04);">

        <!-- Gradient accent bar -->
        <div style="height:5px;background:linear-gradient(90deg,{accent},#ec4899,#8b5cf6,#10b981);
          font-size:0;line-height:0;">&nbsp;</div>
        <table width="100%" cellpadding="0" cellspacing="0">

          <!-- Hero section -->
          <tr><td style="padding:36px 32px 24px;text-align:center;position:relative;">

            <!-- Decorative dots -->
            <div style="position:absolute;top:20px;right:24px;width:60px;height:60px;
              background:radial-gradient(circle,{accent}12 1px,transparent 1px);
              background-size:8px 8px;opacity:0.6;"></div>

            <!-- Emoji badge -->
            <div style="display:inline-block;width:72px;height:72px;border-radius:22px;
              background:linear-gradient(135deg,{accent}15,#ec489910);line-height:72px;
              font-size:36px;text-align:center;margin-bottom:16px;
              box-shadow:0 8px 24px {accent}15;">{emoji}</div>

            <h1 style="margin:0 0 10px;font-size:28px;font-weight:900;letter-spacing:-0.03em;
              color:#0f172a;line-height:1.15;">{headline}</h1>
            <p style="margin:0;font-size:15px;line-height:1.65;color:#64748b;max-width:420px;
              margin-left:auto;margin-right:auto;">Bonjour <strong style="color:#0f172a;">{name}</strong>,
              {body}</p>
          </td></tr>

          <!-- ═══ PROGRESS / STATUS BAR ═══ -->
          {progress_section_html}

        </table>
      </td></tr>

      <!-- ═══ ORDER RECAP ═══ -->
      <tr><td style="padding:20px 0 8px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;
          border-radius:22px;border:1px solid #f1f5f9;overflow:hidden;
          box-shadow:0 8px 24px rgba(15,23,42,0.04);">
          <tr><td style="padding:24px 24px 8px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
              <div style="display:inline-block;width:8px;height:8px;border-radius:4px;
                background:linear-gradient(135deg,{accent},#ec4899);"></div>
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                letter-spacing:0.1em;color:#94a3b8;">Récapitulatif</div>
              <div style="font-size:12px;font-weight:800;color:#0f172a;margin-left:4px;">#{order_id}</div>
            </div>

            <!-- Info rows -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#94a3b8;padding-bottom:6px;">Restaurant</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#0f172a;padding-bottom:6px;">{restaurant}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#94a3b8;padding-bottom:12px;">Articles</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#0f172a;padding-bottom:12px;">{items_count}</td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);
              margin:0 0 12px;"></div>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0">{lines_html}</table>

            <!-- Total -->
            <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);
              margin:12px 0;"></div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:15px;font-weight:800;color:#0f172a;">Total</td>
                <td align="right" style="font-size:22px;font-weight:900;
                  background:linear-gradient(135deg,{accent},#ec4899);-webkit-background-clip:text;
                  -webkit-text-fill-color:transparent;background-clip:text;">{total} <span style="font-size:14px;font-weight:600;">MAD</span></td>
              </tr>
              {courier_row}
            </table>
          </td></tr>
        </table>
      </td></tr>

      <!-- ═══ CTA BUTTON ═══ -->
      <tr><td style="padding:24px 0 8px;text-align:center;">
        {cta_button_html}
      </td></tr>

      <!-- ═══ OFFERS ═══ -->
      <tr><td style="padding:16px 0 8px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;
          border-radius:22px;border:1px solid #f1f5f9;overflow:hidden;
          box-shadow:0 8px 24px rgba(15,23,42,0.04);">
          <tr><td style="padding:28px 24px 8px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-size:20px;">🔥</span>
              <div style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-0.01em;">Offres du moment</div>
            </div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px;">{offers_subtitle}</div>
          </td></tr>
          <tr><td style="padding:12px 12px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>{offers_html}</tr></table>
          </td></tr>
          <tr><td style="padding:0 24px 28px;text-align:center;">
            <a href="{_esc(browse_url)}" style="display:inline-block;
              border:2px solid #f1f5f9;color:#64748b;font-size:13px;font-weight:700;
              text-decoration:none;padding:12px 28px;border-radius:12px;
              transition:all .2s;">Voir tous les restaurants →</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- ═══ FOOTER ═══ -->
      <tr><td style="padding:40px 16px 24px;text-align:center;">
        <!-- Divider -->
        <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);
          margin:0 auto 24px;max-width:200px;"></div>

        <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;line-height:1.6;font-weight:500;">
          YoHa · Livraison intelligente pour les résidences universitaires et les hôpitaux.
        </p>
        <p style="margin:0 0 16px;font-size:11px;color:#cbd5e1;">
          Conçu sur le campus, livré chez vous. 🎓
        </p>
        <p style="margin:0;font-size:10px;color:#cbd5e1;letter-spacing:0.02em;">
          © 2026 YoHa · Fait avec ❤️ à Tanger
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""


def render_order_email_text(ctx: dict) -> str:
    is_cancelled = ctx.get("status") == "cancelled" or "annul" in ctx.get("headline", "").lower()
    browse = _browse_url()
    lines = [
        f"{ctx.get('headline', 'YoHa')} {ctx.get('emoji', '')}",
        "",
        f"Bonjour {ctx['name']},",
        ctx["body"],
        "",
        f"Commande : {ctx['id']}",
        f"Restaurant : {ctx['restaurant']}",
        f"Total : {ctx['total']} MAD",
        "",
    ]
    if is_cancelled:
        lines.append(f"Découvrir d'autres restaurants : {browse}")
    else:
        track = _tracking_url(ctx["id"])
        lines.append(f"Suivre en direct : {track}")

    lines.extend([
        "",
        "— Offres du moment —",
    ])
    for offer in ctx.get("offers", []):
        lines.append(f"• {offer['name']} — {offer.get('promo', '')} ({offer.get('eta', '')})")
        lines.append(f"  {_browse_url(offer.get('slug', ''))}")
    lines.extend(["", "— YoHa · Livraison campus & CHU"])
    return "\n".join(lines)
