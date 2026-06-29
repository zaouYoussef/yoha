"""Templates HTML e-mail YoHa (inline CSS, compatible clients mail)."""
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

    steps_html = ""
    for i, (_status, label) in enumerate(ctx["steps"]):
        active = i <= step_index
        dot_bg = accent if active and i == step_index else ("#10b981" if active else "#e2e8f0")
        dot_color = "#ffffff" if active else "#94a3b8"
        label_color = "#0f172a" if active else "#94a3b8"
        steps_html += f"""
        <td align="center" style="padding:0 2px;vertical-align:top;width:20%;">
          <div style="width:28px;height:28px;border-radius:999px;background:{dot_bg};color:{dot_color};
            font-size:11px;font-weight:700;line-height:28px;text-align:center;margin:0 auto;">{i + 1}</div>
          <div style="font-size:10px;color:{label_color};margin-top:6px;font-weight:600;">{_esc(label)}</div>
        </td>"""

    progress_pct = int(((step_index + 1) / len(ctx["steps"])) * 100)

    lines_html = ""
    for line in ctx.get("line_preview", []):
        lines_html += f"""
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">
            <strong style="color:#f97316;">{line.quantity}×</strong> {_esc(line.item_name)}
          </td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;font-weight:600;">
            {line.line_total_mad:.2f} MAD
          </td>
        </tr>"""

    offers_html = ""
    for offer in ctx.get("offers", []):
        cover = _abs_url(offer.get("cover", ""))
        promo = _esc(offer.get("promo", ""))
        oname = _esc(offer.get("name", ""))
        eta = _esc(offer.get("eta", ""))
        link = _browse_url(offer.get("slug", ""))
        img_cell = (
            f'<img src="{_esc(cover)}" alt="" width="72" height="72" '
            f'style="display:block;width:72px;height:72px;border-radius:12px;object-fit:cover;" />'
            if cover
            else f'<div style="width:72px;height:72px;border-radius:12px;background:linear-gradient(135deg,#f97316,#ec4899);"></div>'
        )
        offers_html += f"""
        <td width="33%" style="padding:8px;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;overflow:hidden;">
            <tr><td style="padding:10px;">{img_cell}</td></tr>
            <tr><td style="padding:0 12px 4px;font-size:14px;font-weight:700;color:#0f172a;">{oname}</td></tr>
            <tr><td style="padding:0 12px 4px;font-size:11px;color:#ea580c;font-weight:700;">🔥 {promo}</td></tr>
            <tr><td style="padding:0 12px 10px;font-size:11px;color:#64748b;">⚡ {eta}</td></tr>
            <tr><td style="padding:0 12px 12px;">
              <a href="{_esc(link)}" style="font-size:12px;font-weight:700;color:#f97316;text-decoration:none;">Commander →</a>
            </td></tr>
          </table>
        </td>"""

    if not offers_html:
        offers_html = """
        <td colspan="3" style="padding:12px;text-align:center;color:#64748b;font-size:13px;">
          Découvrez nos restaurants partenaires sur YoHa.
        </td>"""

    courier_row = ""
    if courier:
        courier_row = f"""
        <tr>
          <td colspan="2" style="padding-top:12px;font-size:13px;color:#64748b;">
            Livreur : <strong style="color:#0f172a;">{courier}</strong>
          </td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{headline} · YoHa</title>
</head>
<body style="margin:0;padding:0;background:#fff7ed;font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding:8px 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:44px;height:44px;vertical-align:middle;">
                    <img src="{logo_url}" width="44" height="44" alt="YoHa" style="display:block;border-radius:12px;object-fit:contain;background:#ffffff;" />
                  </td>
                  <td style="padding-left:12px;">
                    <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">YoHa</div>
                    <div style="font-size:12px;color:#64748b;">Livraison campus &amp; CHU · Tanger</div>
                  </td>
                </tr></table>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Hero -->
        <tr><td style="background:#ffffff;border-radius:24px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height:6px;background:linear-gradient(90deg,#f97316,#ec4899,#8b5cf6,#10b981);"></td></tr>
            <tr><td style="padding:32px 28px 20px;text-align:center;">
              <div style="font-size:48px;line-height:1;margin-bottom:12px;">{emoji}</div>
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;letter-spacing:-0.03em;color:#0f172a;">{headline}</h1>
              <p style="margin:0;font-size:16px;line-height:1.6;color:#475569;max-width:420px;display:inline-block;">Bonjour {name}, {body}</p>
            </td></tr>

            <!-- Progress -->
            <tr><td style="padding:0 28px 28px;">
              <div style="background:#f1f5f9;border-radius:999px;height:8px;overflow:hidden;margin-bottom:16px;">
                <div style="width:{progress_pct}%;height:8px;background:linear-gradient(90deg,#f97316,#ec4899,#10b981);border-radius:999px;"></div>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0"><tr>{steps_html}</tr></table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Order recap -->
        <tr><td style="padding:20px 0 8px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;padding:4px;">
            <tr><td style="padding:20px 24px;">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-bottom:12px;">
                Récapitulatif · #{order_id}
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:15px;color:#64748b;padding-bottom:4px;">Restaurant</td>
                  <td align="right" style="font-size:15px;font-weight:700;color:#0f172a;padding-bottom:4px;">{restaurant}</td>
                </tr>
                <tr>
                  <td style="font-size:15px;color:#64748b;padding-bottom:12px;">Articles</td>
                  <td align="right" style="font-size:15px;font-weight:700;color:#0f172a;padding-bottom:12px;">{items_count}</td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">{lines_html}</table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                <tr>
                  <td style="font-size:16px;font-weight:800;color:#0f172a;">Total</td>
                  <td align="right" style="font-size:20px;font-weight:800;color:#f97316;">{total} MAD</td>
                </tr>
                {courier_row}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Offers -->
        <tr><td style="padding:12px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;">
            <tr><td style="padding:24px 20px 8px;">
              <div style="font-size:20px;font-weight:800;color:#0f172a;">🔥 Offres du moment</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">Pendant que vous attendez, profitez de ces promos campus</div>
            </td></tr>
            <tr><td style="padding:8px 12px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>{offers_html}</tr></table>
            </td></tr>
            <tr><td style="padding:0 20px 24px;text-align:center;">
              <a href="{_esc(browse_url)}" style="display:inline-block;border:2px solid #f97316;color:#f97316;
                font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:12px;">
                Voir tous les restaurants
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 12px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;line-height:1.6;">
            YoHa · Livraison intelligente pour les résidences universitaires et les hôpitaux.<br/>
            Conçu sur le campus, livré chez vous.
          </p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;">
            © 2026 YoHa · Fait avec ❤️ à Tanger
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def render_order_email_text(ctx: dict) -> str:
    track = _tracking_url(ctx["id"])
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
        f"Suivre en direct : {track}",
        "",
        "— Offres du moment —",
    ]
    for offer in ctx.get("offers", []):
        lines.append(f"• {offer['name']} — {offer.get('promo', '')} ({offer.get('eta', '')})")
        lines.append(f"  {_browse_url(offer.get('slug', ''))}")
    lines.extend(["", "— YoHa · Livraison campus & CHU"])
    return "\n".join(lines)
