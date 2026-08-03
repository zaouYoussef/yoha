"""Templates HTML e-mail YoHa — Design premium brand (orange → pink → violet)."""
from __future__ import annotations

import html
from decimal import Decimal
from urllib.parse import quote

from django.conf import settings

# Brand palette (email-safe accents)
_ORANGE = "#f97316"
_PINK = "#ec4899"
_VIOLET = "#8b5cf6"


def _line_total(line) -> Decimal:
    try:
        return Decimal(str(getattr(line, "line_total_mad", 0) or 0))
    except Exception:
        return Decimal("0")


def format_line_price_html(line) -> str:
    """0 MAD (commande sur-mesure) → « Sur ticket », sinon montant formaté."""
    amount = _line_total(line)
    if amount <= 0:
        return (
            f'<span style="color:{_ORANGE};font-weight:800;font-size:13px;">Sur ticket</span>'
        )
    formatted = f"{amount:.2f}".replace(".", ",")
    return (
        f'{formatted} <span style="color:#94a3b8;font-weight:600;font-size:12px;">MAD</span>'
    )


def format_line_price_text(line) -> str:
    amount = _line_total(line)
    if amount <= 0:
        return "Sur ticket"
    return f"{amount:.2f} MAD".replace(".", ",")


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
    accent = ctx.get("accent", _ORANGE)
    browse_url = _browse_url()
    step_index = ctx["step_index"]
    courier = _esc(ctx.get("courier", ""))
    logo_url = _esc(_abs_url("/logo.png"))
    tracking_url = _esc(_tracking_url(order_id))
    is_cancelled = ctx.get("status") == "cancelled" or "annul" in headline.lower()
    total_extra = (
        f' <span style="font-size:13px;font-weight:800;color:{_ORANGE};">+ achats</span>'
        if ctx.get("on_ticket")
        else ""
    )
    total_extra_text = " + achats" if ctx.get("on_ticket") else ""

    # ── Progress / status ──
    if is_cancelled:
        progress_section_html = f"""
        <tr><td style="padding:0 28px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:#fff1f2;border-radius:18px;border:1px solid #fecdd3;">
            <tr><td style="padding:20px 22px;text-align:center;">
              <div style="font-size:14px;font-weight:900;color:#be123c;letter-spacing:-0.01em;">
                Commande annulée
              </div>
              <div style="font-size:13px;color:#9f1239;margin-top:6px;font-weight:600;line-height:1.45;">
                Aucun débit ne sera effectué pour cette commande.
              </div>
            </td></tr>
          </table>
        </td></tr>"""
    else:
        n_steps = max(len(ctx["steps"]), 1)
        progress_pct = int(((step_index + 1) / n_steps) * 100)
        # Build connected step rail (tables only)
        steps_cells = ""
        for i, (_status, label) in enumerate(ctx["steps"]):
            active = i <= step_index
            current = i == step_index
            if current:
                dot_style = (
                    f"background:linear-gradient(135deg,{_ORANGE},{_PINK});"
                    f"background-color:{accent};color:#ffffff;"
                    f"box-shadow:0 0 0 4px {accent}28, 0 6px 16px {accent}40;"
                )
                label_color = "#1e1b4b"
                label_weight = "900"
            elif active:
                dot_style = (
                    f"background:linear-gradient(135deg,{_ORANGE},{_PINK});"
                    f"background-color:{_ORANGE};color:#ffffff;"
                )
                label_color = "#64748b"
                label_weight = "700"
            else:
                dot_style = "background:#f1f5f9;color:#94a3b8;border:1px solid #e2e8f0;"
                label_color = "#94a3b8"
                label_weight = "600"

            # Connector line before each step except the first
            connector = ""
            if i > 0:
                prev_done = (i - 1) <= step_index
                conn_bg = (
                    f"background:linear-gradient(90deg,{_ORANGE},{_PINK});background-color:{_ORANGE};"
                    if prev_done
                    else "background:#e2e8f0;"
                )
                connector = f"""
                <td style="vertical-align:top;padding-top:15px;width:8%;">
                  <div style="height:3px;{conn_bg}border-radius:999px;margin:0 -2px;"></div>
                </td>"""

            steps_cells += f"""
            {connector}
            <td align="center" style="padding:0;vertical-align:top;width:{int(92 / n_steps)}%;">
              <div style="width:30px;height:30px;border-radius:999px;{dot_style}
                font-size:12px;font-weight:800;line-height:30px;text-align:center;margin:0 auto;">{i + 1}</div>
              <div style="font-size:10px;color:{label_color};margin-top:10px;font-weight:{label_weight};
                letter-spacing:0.01em;line-height:1.3;">{_esc(label)}</div>
            </td>"""

        progress_section_html = f"""
        <tr><td style="padding:0 24px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:#fffbeb;border-radius:20px;border:1px solid #fed7aa;">
            <tr><td style="padding:22px 22px 10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:11px;font-weight:800;text-transform:uppercase;
                    letter-spacing:0.12em;color:#9a3412;">Progression</td>
                  <td align="right" style="font-size:13px;font-weight:900;
                    background:linear-gradient(90deg,{_ORANGE},{_PINK});
                    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
                    color:{_ORANGE};">{progress_pct}%</td>
                </tr>
              </table>
              <div style="margin-top:12px;background:#ffedd5;border-radius:999px;height:8px;overflow:hidden;">
                <div style="width:{progress_pct}%;height:8px;
                  background:linear-gradient(90deg,{_ORANGE},{_PINK},{_VIOLET});
                  background-color:{_ORANGE};border-radius:999px;"></div>
              </div>
            </td></tr>
            <tr><td style="padding:18px 10px 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>{steps_cells}</tr>
              </table>
            </td></tr>
          </table>
        </td></tr>"""

    # ── Order lines ──
    lines_html = ""
    for line in ctx.get("line_preview", []):
        price_html = format_line_price_html(line)
        lines_html += f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;font-weight:600;">
            <span style="display:inline-block;background:#fff7ed;color:{_ORANGE};font-size:12px;font-weight:900;
              padding:4px 10px;border-radius:8px;margin-right:10px;border:1px solid #fed7aa;">{line.quantity}×</span>
            {_esc(line.item_name)}
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;
            color:#1e1b4b;font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap;">
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
            <div style="height:110px;border-radius:16px;overflow:hidden;background:#fff7ed;
              margin-bottom:10px;border:1px solid #fed7aa;">
              {'<img src="' + _esc(cover) + '" style="width:100%;height:100%;object-fit:cover;display:block;border:0;" alt="" />' if cover else '<div style="height:100%;background:linear-gradient(135deg,#ffedd5,#fce7f3);"></div>'}
            </div>
            <div style="font-size:13px;font-weight:900;color:#1e1b4b;margin-bottom:4px;
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-0.01em;">{_esc(offer['name'])}</div>
            <div style="font-size:11px;color:{_PINK};font-weight:800;">{_esc(offer.get('promo', ''))}</div>
            <div style="font-size:11px;color:#78716c;margin-top:4px;font-weight:600;">⚡ {_esc(offer.get('eta', ''))}</div>
          </a>
        </td>"""

    if not offers_html:
        offers_html = """
        <td colspan="3" style="padding:20px;text-align:center;color:#78716c;font-size:14px;font-weight:500;">
          Découvrez nos restaurants partenaires sur YoHa.
        </td>"""

    courier_row = f"""
    <tr>
      <td style="font-size:13px;color:#78716c;padding-top:12px;font-weight:600;">Livreur assigné</td>
      <td align="right" style="font-size:13px;font-weight:800;color:#1e1b4b;padding-top:12px;">{courier}</td>
    </tr>""" if courier else ""

    # CTA: brand orange → pink (never rose-red / ink)
    cta_label = "Découvrir d'autres restaurants →" if is_cancelled else "Suivre ma commande →"
    cta_href = _esc(browse_url) if is_cancelled else tracking_url
    cta_button_html = f"""
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
      href="{cta_href}" style="height:54px;v-text-anchor:middle;width:300px;" arcsize="30%"
      strokecolor="{_ORANGE}" fillcolor="{_ORANGE}">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">
        {cta_label}
      </center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="{cta_href}" style="display:inline-block;
      background:linear-gradient(135deg,{_ORANGE} 0%,{_PINK} 100%);
      background-color:{_ORANGE};color:#ffffff;
      font-size:16px;font-weight:900;text-decoration:none;padding:18px 44px;
      border-radius:16px;box-shadow:0 14px 32px rgba(249,115,22,0.38);letter-spacing:0.01em;">
      {cta_label}
    </a>
    <!--<![endif]-->"""

    offers_subtitle = (
        "Découvrez d'autres délices sur le campus"
        if is_cancelled
        else "Pendant que vous attendez, profitez de ces promos campus"
    )
    emoji_badge = emoji if emoji else "📦"

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>{headline} · YoHa</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>table,td,div,a {{font-family:Arial,sans-serif!important;}}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#fff7ed;
  font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e1b4b;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#fff7ed;">
  {emoji} {headline} — Commande #{order_id} · {total} MAD{total_extra_text}
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff7ed;">
  <tr>
    <td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,{_ORANGE},{_PINK},{_VIOLET});">&nbsp;</td>
  </tr>
  <tr>
    <td align="center" style="padding:36px 16px 48px;">

    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

      <!-- Brand mark -->
      <tr><td align="center" style="padding:0 0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
          <td style="width:64px;height:64px;vertical-align:middle;">
            <img src="{logo_url}" width="64" height="64" alt="YoHa"
              style="display:block;border:0;border-radius:20px;object-fit:contain;background:#ffffff;
              box-shadow:0 10px 28px rgba(249,115,22,0.28);" />
          </td>
          <td style="padding-left:16px;vertical-align:middle;">
            <div style="font-size:30px;font-weight:900;letter-spacing:-0.045em;line-height:1;
              color:{_ORANGE};">YoHa</div>
            <div style="font-size:11px;color:#9f7aea;font-weight:800;letter-spacing:0.12em;
              text-transform:uppercase;margin-top:6px;">Campus &amp; CHU · Tanger</div>
          </td>
        </tr></table>
      </td></tr>

      <!-- Hero card -->
      <tr><td style="background-color:#ffffff;border-radius:28px;overflow:hidden;
        border:1px solid #fed7aa;
        box-shadow:0 24px 48px rgba(249,115,22,0.10), 0 4px 12px rgba(139,92,246,0.06);">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background:linear-gradient(90deg,{_ORANGE},{_PINK},{_VIOLET});">&nbsp;</td>
          </tr>

          <tr><td style="padding:40px 32px 24px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
              <tr>
                <td align="center" style="width:72px;height:72px;border-radius:22px;
                  background:linear-gradient(145deg,#fff7ed,#fce7f3);
                  border:1px solid #fdba74;font-size:34px;line-height:72px;
                  box-shadow:0 8px 24px rgba(236,72,153,0.18);">{emoji_badge}</td>
              </tr>
            </table>

            <h1 style="margin:0 0 12px;font-size:30px;font-weight:900;letter-spacing:-0.04em;
              color:#1e1b4b;line-height:1.15;">{headline}</h1>
            <p style="margin:0 auto;font-size:15px;line-height:1.65;color:#64748b;max-width:420px;font-weight:500;">
              Bonjour <strong style="color:#1e1b4b;font-weight:800;">{name}</strong>,<br/>{body}
            </p>
          </td></tr>

          {progress_section_html}
        </table>
      </td></tr>

      <!-- Order recap -->
      <tr><td style="padding:20px 0 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background-color:#ffffff;border-radius:24px;border:1px solid #e9d5ff;
          box-shadow:0 12px 32px rgba(139,92,246,0.08);">
          <tr><td style="padding:28px 28px 12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:12px;font-weight:900;text-transform:uppercase;
                  letter-spacing:0.14em;color:{_VIOLET};">Récapitulatif</td>
                <td align="right">
                  <span style="display:inline-block;font-size:13px;font-weight:900;color:#1e1b4b;
                    background:#f5f3ff;padding:5px 12px;border-radius:10px;border:1px solid #ddd6fe;">#{order_id}</span>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;">
              <tr>
                <td style="font-size:14px;color:#78716c;font-weight:600;padding-bottom:8px;">Restaurant</td>
                <td align="right" style="font-size:14px;font-weight:900;color:#1e1b4b;padding-bottom:8px;">{restaurant}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#78716c;font-weight:600;padding-bottom:14px;">Articles</td>
                <td align="right" style="font-size:14px;font-weight:900;color:#1e1b4b;padding-bottom:14px;">{items_count}</td>
              </tr>
            </table>

            <div style="height:1px;background:#f1f5f9;margin:0 0 8px;font-size:0;line-height:0;">&nbsp;</div>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">{lines_html}</table>

            <div style="height:1px;background:#f1f5f9;margin:12px 0;font-size:0;line-height:0;">&nbsp;</div>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:16px;font-weight:900;color:#1e1b4b;padding-bottom:4px;">Total</td>
                <td align="right" style="font-size:26px;font-weight:900;color:{_ORANGE};
                  letter-spacing:-0.02em;padding-bottom:4px;">{total}
                  <span style="font-size:14px;font-weight:800;color:#94a3b8;">MAD</span>{total_extra}</td>
              </tr>
              {courier_row}
            </table>
          </td></tr>
          <tr><td style="padding:8px 28px 28px;"></td></tr>
        </table>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:20px 0 16px;text-align:center;">
        {cta_button_html}
      </td></tr>

      <!-- Offers -->
      <tr><td style="padding:12px 0 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background-color:#ffffff;border-radius:24px;border:1px solid #fbcfe8;
          box-shadow:0 12px 28px rgba(236,72,153,0.07);">
          <tr><td style="padding:28px 26px 10px;">
            <div style="font-size:18px;font-weight:900;color:#1e1b4b;letter-spacing:-0.02em;">
              <span style="color:{_PINK};">✦</span> Offres du moment
            </div>
            <div style="font-size:13px;color:#78716c;margin-top:6px;font-weight:500;">{offers_subtitle}</div>
          </td></tr>
          <tr><td style="padding:8px 14px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>{offers_html}</tr></table>
          </td></tr>
          <tr><td style="padding:0 26px 28px;text-align:center;">
            <a href="{_esc(browse_url)}" style="display:inline-block;
              background:#fff7ed;border:1px solid #fed7aa;
              color:#9a3412;font-size:14px;font-weight:800;text-decoration:none;
              padding:13px 28px;border-radius:14px;">Voir tous les restaurants →</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:40px 16px 8px;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;color:#78716c;line-height:1.6;font-weight:600;">
          YoHa · Livraison intelligente pour les résidences universitaires et les hôpitaux.
        </p>
        <p style="margin:0 0 14px;font-size:12px;color:#a8a29e;font-weight:500;">
          Conçu sur le campus, livré chez vous.
        </p>
        <p style="margin:0;font-size:11px;color:#d6d3d1;letter-spacing:0.02em;font-weight:500;">
          © 2026 YoHa · Tanger
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
    total_label = f"{ctx['total']} MAD"
    if ctx.get("on_ticket"):
        total_label += " + achats"
    lines = [
        f"{ctx.get('headline', 'YoHa')} {ctx.get('emoji', '')}",
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
        lines.append(f"Suivre ma commande : {track}")

    lines.extend([
        "",
        "— Offres du moment —",
    ])
    for offer in ctx.get("offers", []):
        lines.append(f"• {offer['name']} — {offer.get('promo', '')} ({offer.get('eta', '')})")
        lines.append(f"  {_browse_url(offer.get('slug', ''))}")
    lines.extend(["", "— YoHa · Livraison campus & CHU"])
    return "\n".join(lines)
