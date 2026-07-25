"""Template HTML campagne promo YoHa — Design premium glass morphism."""
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


def _browse_url(slug: str = "") -> str:
    base = getattr(settings, "YOHA_FRONTEND_URL", "http://localhost:3002").rstrip("/")
    return f"{base}/restaurant/{slug}" if slug else f"{base}/browse"


def _esc(value) -> str:
    return html.escape(str(value or ""), quote=True)


def render_promo_email_html(ctx: dict) -> str:
    hero = ctx["hero"]
    hero_name = _esc(hero["name"])
    hero_promo = _esc(hero.get("promo", ""))
    hero_cover = _abs_url(hero.get("cover", ""))
    hero_link = _browse_url(hero["slug"])
    hero_eta = _esc(hero.get("eta", ""))
    unsubscribe = _esc(ctx.get("unsubscribe_url", ""))
    campaign_title = _esc(ctx.get("title", "Nos offres de la semaine"))
    logo_url = _esc(_abs_url("/logo.png"))

    menu_html = ""
    for item in ctx.get("featured_items", []):
        img = _abs_url(item.get("img", ""))
        img_tag = (
            f'<img src="{_esc(img)}" width="100%" alt="" style="display:block;width:100%;height:120px;object-fit:cover;border-radius:14px 14px 0 0;" />'
            if img
            else '<div style="height:120px;background:linear-gradient(135deg,#f43f5e,#fb7185);border-radius:14px 14px 0 0;"></div>'
        )
        menu_html += f"""
        <td width="33%" style="padding:5px;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;
            border:1px solid #f1f5f9;border-radius:16px;overflow:hidden;
            box-shadow:0 4px 16px rgba(15,23,42,0.04);">
            <tr><td>{img_tag}</td></tr>
            <tr><td style="padding:12px 12px 6px;text-align:left;">
              <div style="font-size:13px;font-weight:800;color:#0f172a;height:34px;
                overflow:hidden;line-height:1.25;margin-bottom:4px;">{_esc(item['name'])}</div>
              <div style="font-size:11px;color:#94a3b8;margin:0 0 10px;line-height:1.3;
                height:28px;overflow:hidden;">{_esc(item.get('desc', ''))}</div>
              <div style="display:inline-block;padding:3px 10px;
                background:linear-gradient(135deg,#fff1f2,#ffe4e6);border-radius:8px;
                font-size:12px;font-weight:800;color:#f43f5e;">{_esc(item['price'])} MAD</div>
            </td></tr>
          </table>
        </td>"""

    others_html = ""
    for offer in ctx.get("other_offers", []):
        cover = _abs_url(offer.get("cover", ""))
        img = (
            f'<img src="{_esc(cover)}" width="56" height="56" style="border-radius:12px;object-fit:cover;display:block;" alt="" />'
            if cover
            else '<div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#f43f5e,#fb7185);"></div>'
        )
        others_html += f"""
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td width="56">{img}</td>
              <td style="padding-left:14px;text-align:left;">
                <div style="font-size:14px;font-weight:800;color:#0f172a;letter-spacing:-0.01em;">{_esc(offer['name'])}</div>
                <div style="font-size:11px;color:#f43f5e;font-weight:700;margin-top:3px;letter-spacing:0.01em;">✨ {_esc(offer.get('promo', ''))}</div>
              </td>
              <td align="right" style="vertical-align:middle;">
                <a href="{_esc(_browse_url(offer['slug']))}" style="display:inline-block;font-size:11px;font-weight:800;color:#ffffff;
                  background:linear-gradient(135deg,#f43f5e,#e11d48);text-decoration:none;padding:8px 16px;
                  border-radius:10px;box-shadow:0 2px 8px rgba(244,63,94,0.25);">Voir</a>
              </td>
            </tr></table>
          </td>
        </tr>"""

    hero_img = (
        f'<img src="{_esc(hero_cover)}" width="600" alt="" style="display:block;width:100%;max-height:240px;object-fit:cover;" />'
        if hero_cover
        else ""
    )

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>{campaign_title} · YoHa</title>
</head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#faf8f5;">
  🔥 {campaign_title} — Profitez des offres campus YoHa
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:32px 16px;">
<tr><td align="center">
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
          background:linear-gradient(135deg,#f43f5e,#ec4899);-webkit-background-clip:text;
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
    <div style="height:5px;background:linear-gradient(90deg,#f43f5e,#ec4899,#8b5cf6);
      font-size:0;line-height:0;">&nbsp;</div>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:36px 32px 24px;text-align:center;position:relative;">
        <!-- Decorative dots -->
        <div style="position:absolute;top:24px;left:24px;width:48px;height:48px;
          background:radial-gradient(circle,#f43f5e12 1px,transparent 1px);
          background-size:8px 8px;opacity:0.5;"></div>

        <!-- Badge -->
        <div style="display:inline-block;padding:6px 16px;
          background:linear-gradient(135deg,#fff1f2,#ffe4e6);border:1px solid #fecdd3;
          border-radius:20px;font-size:11px;font-weight:800;color:#e11d48;
          text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;">🔥 Offre de la semaine</div>

        <h1 style="margin:0 0 10px;font-size:28px;font-weight:900;color:#0f172a;
          letter-spacing:-0.03em;line-height:1.15;">{campaign_title}</h1>
        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;max-width:420px;
          margin-left:auto;margin-right:auto;">Profitez de la livraison offerte sur tout le campus en quelques clics.</p>
      </td></tr>

      <!-- Hero image -->
      <tr><td style="padding:0 24px;">{hero_img}</td></tr>

      <!-- Hero info + CTA -->
      <tr><td style="padding:28px 28px 32px;text-align:left;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="text-align:left;">
            <div style="font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">{hero_name}</div>
            <div style="margin-top:6px;font-size:12px;color:#64748b;font-weight:600;">
              ⚡ Arrivée {hero_eta} · <span style="color:#10b981;font-weight:800;">Livraison Offerte</span>
            </div>
          </td>
          <td align="right" style="vertical-align:middle;">
            <div style="background:linear-gradient(135deg,#fff1f2,#ffe4e6);color:#e11d48;
              font-size:13px;font-weight:800;padding:8px 14px;border-radius:10px;
              border:1px solid #fecdd3;">{hero_promo}</div>
          </td>
        </tr></table>
        <div style="margin-top:28px;text-align:center;">
          <a href="{_esc(hero_link)}" style="display:inline-block;
            background:linear-gradient(135deg,#f43f5e,#e11d48);color:#ffffff;
            font-size:15px;font-weight:800;text-decoration:none;padding:16px 40px;
            border-radius:16px;box-shadow:0 8px 24px rgba(244,63,94,0.3);
            letter-spacing:0.01em;">Commander chez {hero_name} 🚀</a>
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- ═══ MENU GRID ═══ -->
  <tr><td style="padding:28px 0 8px;text-align:left;">
    <div style="display:flex;align-items:center;gap:8px;padding-left:4px;margin-bottom:14px;">
      <span style="font-size:18px;">🍽️</span>
      <div style="font-size:17px;font-weight:900;color:#0f172a;letter-spacing:-0.01em;">Plats à la une</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>{menu_html}</tr></table>
  </td></tr>

  <!-- ═══ OTHER OFFERS ═══ -->
  <tr><td style="background:#ffffff;border-radius:22px;border:1px solid #f1f5f9;
    padding:4px;box-shadow:0 8px 24px rgba(15,23,42,0.04);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 24px 8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">✨</span>
          <div style="font-size:17px;font-weight:900;color:#0f172a;letter-spacing:-0.01em;">D'autres envies cette semaine ?</div>
        </div>
      </td></tr>
      <tr><td style="padding:0 24px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">{others_html}</table>
      </td></tr>
      <tr><td style="padding:0 24px 24px;text-align:center;">
        <a href="{_esc(_browse_url())}" style="display:inline-block;
          border:2px solid #f1f5f9;color:#64748b;font-size:13px;font-weight:700;
          text-decoration:none;padding:12px 28px;border-radius:12px;">Découvrir tous les restaurants →</a>
      </td></tr>
    </table>
  </td></tr>

  <!-- ═══ FOOTER ═══ -->
  <tr><td style="padding:40px 16px 24px;text-align:center;">
    <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);
      margin:0 auto 24px;max-width:200px;"></div>
    <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;line-height:1.6;font-weight:500;">
      Vous recevez cet e-mail car vous êtes membre de la communauté YoHa.
    </p>
    {f'<a href="{unsubscribe}" style="font-size:11px;color:#f43f5e;text-decoration:underline;">Se désabonner</a>' if unsubscribe else ''}
    <p style="margin:8px 0 0;font-size:10px;color:#cbd5e1;">© 2026 YoHa · Fait avec ❤️ à Tanger</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def render_promo_email_text(ctx: dict) -> str:
    hero = ctx["hero"]
    lines = [
        f"{ctx.get('title', 'Offres YoHa')}",
        "",
        f"⭐ {hero['name']} — {hero.get('promo', '')}",
        f"Commander : {_browse_url(hero['slug'])}",
        "",
        "Menu à la une :",
    ]
    for item in ctx.get("featured_items", []):
        lines.append(f"  • {item['name']} — {item['price']} MAD")
    lines.extend(["", "Autres offres :"])
    for offer in ctx.get("other_offers", []):
        lines.append(f"  • {offer['name']} — {offer.get('promo', '')}")
    lines.extend([
        "",
        f"Tous les restaurants : {_browse_url()}",
    ])
    return "\n".join(lines)


def render_new_promo_email_html(*, code: str, discount: int, section_label: str, unsubscribe_url: str) -> str:
    escaped_code = _esc(code)
    escaped_discount = _esc(discount)
    escaped_section = _esc(section_label)
    unsub = _esc(unsubscribe_url)
    logo_url = _esc(_abs_url("/logo.png"))
    site_url = _browse_url()

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>🎁 Code promo · YoHa</title>
</head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#faf8f5;">
  🎁 Votre code promo -{escaped_discount}% est prêt ! Offre valable 24h.
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:40px 16px;">
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
          background:linear-gradient(135deg,#f43f5e,#ec4899);-webkit-background-clip:text;
          -webkit-text-fill-color:transparent;background-clip:text;">YoHa</div>
        <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.04em;
          text-transform:uppercase;">Campus &amp; CHU · Tanger</div>
      </td>
    </tr></table>
  </td></tr>

  <!-- ═══ VOUCHER CARD ═══ -->
  <tr><td style="background:#ffffff;border-radius:28px;border:1px solid #f1f5f9;
    overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.06),0 1px 3px rgba(15,23,42,0.04);">

    <!-- Gradient accent bar -->
    <div style="height:5px;background:linear-gradient(90deg,#f43f5e,#ec4899,#8b5cf6);
      font-size:0;line-height:0;">&nbsp;</div>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:40px 32px 20px;text-align:center;position:relative;">
        <!-- Decorative elements -->
        <div style="position:absolute;top:28px;left:28px;width:48px;height:48px;
          background:radial-gradient(circle,#f43f5e10 1px,transparent 1px);
          background-size:8px 8px;opacity:0.5;"></div>
        <div style="position:absolute;top:28px;right:28px;width:48px;height:48px;
          background:radial-gradient(circle,#ec489910 1px,transparent 1px);
          background-size:8px 8px;opacity:0.5;"></div>

        <!-- Gift badge -->
        <div style="display:inline-block;width:80px;height:80px;border-radius:24px;
          background:linear-gradient(135deg,#fff1f2,#ffe4e6);line-height:80px;
          font-size:40px;text-align:center;margin-bottom:20px;
          box-shadow:0 8px 24px rgba(244,63,94,0.12);">🎁</div>

        <h1 style="margin:0 0 10px;font-size:30px;font-weight:900;color:#0f172a;
          letter-spacing:-0.03em;line-height:1.15;">Rien que pour vous</h1>
        <p style="margin:0 0 28px;font-size:14px;color:#475569;line-height:1.65;max-width:400px;
          margin-left:auto;margin-right:auto;">
          Profitez de <strong style="color:#e11d48;font-size:16px;">-{escaped_discount}%</strong> de réduction
          {escaped_section} sur YoHa.
        </p>
      </td></tr>

      <!-- ═══ VOUCHER BOX ═══ -->
      <tr><td style="padding:0 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <div style="max-width:320px;background:linear-gradient(135deg,#fff5f5,#fff1f2);
              border:2px dashed #f43f5e;border-radius:20px;padding:28px 24px;text-align:center;
              position:relative;box-shadow:0 8px 24px rgba(244,63,94,0.08);">
              <!-- Decorative cutouts -->
              <div style="position:absolute;left:-14px;top:50%;margin-top:-14px;width:28px;height:28px;
                border-radius:50%;background:#ffffff;border:2px dashed #f43f5e;"></div>
              <div style="position:absolute;right:-14px;top:50%;margin-top:-14px;width:28px;height:28px;
                border-radius:50%;background:#ffffff;border:2px dashed #f43f5e;"></div>

              <div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;
                letter-spacing:0.1em;margin-bottom:10px;">Votre code promo</div>
              <div style="font-family:'Courier New',monospace;font-size:30px;font-weight:900;
                color:#e11d48;letter-spacing:0.08em;background:#ffffff;
                border:2px solid #fecdd3;padding:14px 22px;border-radius:14px;
                display:inline-block;box-shadow:0 4px 12px rgba(244,63,94,0.06);
                line-height:1;">{escaped_code}</div>
              <div style="margin-top:14px;font-size:12px;font-weight:700;color:#e11d48;
                display:flex;align-items:center;justify-content:center;gap:4px;">
                ⏴ Offre valable 24h seulement ! ⏵
              </div>
            </div>
          </td></tr>
        </table>
      </td></tr>

      <!-- ═══ CTA ═══ -->
      <tr><td style="padding:32px 32px 40px;text-align:center;">
        <a href="{_esc(site_url)}" style="display:inline-block;
          background:linear-gradient(135deg,#f43f5e,#e11d48);color:#ffffff;
          font-size:15px;font-weight:800;text-decoration:none;padding:16px 44px;
          border-radius:16px;box-shadow:0 8px 24px rgba(244,63,94,0.3);
          letter-spacing:0.01em;">Commander maintenant 🚀</a>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
          Code applicable une seule fois. Non cumulable.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- ═══ FOOTER ═══ -->
  <tr><td style="padding:40px 16px 24px;text-align:center;">
    <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);
      margin:0 auto 24px;max-width:200px;"></div>
    <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;line-height:1.6;font-weight:500;">
      Vous recevez cet e-mail car vous êtes membre de la communauté YoHa.
    </p>
    {f'<a href="{unsub}" style="font-size:11px;color:#f43f5e;text-decoration:underline;">Se désabonner</a>' if unsub else ''}
    <p style="margin:8px 0 0;font-size:10px;color:#cbd5e1;">© 2026 YoHa · Fait avec ❤️ à Tanger</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def render_new_promo_email_text(*, code: str, discount: int, section_label: str, unsubscribe_url: str) -> str:
    return f"""🎁 Un cadeau pour vous sur YoHa !

Profitez de -{discount}% de réduction {section_label} avec le code promo exclusif :

👉 {code}

Ce code est valable pendant 24 heures seulement !
Commander sur YoHa : {_browse_url()}"""
