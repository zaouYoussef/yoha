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
            f'<img src="{_esc(img)}" width="100%" alt="" style="display:block;width:100%;height:120px;object-fit:cover;border-radius:18px 18px 0 0;" />'
            if img
            else '<div style="height:120px;background:linear-gradient(135deg,#f43f5e,#fb7185);border-radius:18px 18px 0 0;"></div>'
        )
        menu_html += f"""
        <td width="33%" style="padding:6px;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;background:rgba(255,255,255,0.65);
            backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
            border-top:1px solid rgba(255,255,255,0.9);border-left:1px solid rgba(255,255,255,0.9);
            border-right:1px solid rgba(255,255,255,0.3);border-bottom:1px solid rgba(255,255,255,0.3);
            border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.06);">
            <tr><td>{img_tag}</td></tr>
            <tr><td style="padding:14px 12px 10px;text-align:left;">
              <div style="font-size:14px;font-weight:900;color:#0f172a;height:36px;
                overflow:hidden;line-height:1.25;margin-bottom:6px;letter-spacing:-0.02em;">{_esc(item['name'])}</div>
              <div style="font-size:11px;color:#64748b;margin:0 0 12px;line-height:1.4;
                height:30px;overflow:hidden;font-weight:500;">{_esc(item.get('desc', ''))}</div>
              <div style="display:inline-block;padding:5px 12px;
                background:linear-gradient(135deg,#ffffff,#fff1f2);border-radius:10px;
                font-size:12px;font-weight:900;color:#f43f5e;box-shadow:0 2px 8px rgba(244,63,94,0.15);
                border:1px solid rgba(255,255,255,0.8);">{_esc(item['price'])} MAD</div>
            </td></tr>
          </table>
        </td>"""

    others_html = ""
    for offer in ctx.get("other_offers", []):
        cover = _abs_url(offer.get("cover", ""))
        img = (
            f'<img src="{_esc(cover)}" width="60" height="60" style="border-radius:16px;object-fit:cover;display:block;box-shadow:0 4px 12px rgba(0,0,0,0.08);" alt="" />'
            if cover
            else '<div style="width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,#f43f5e,#fb7185);box-shadow:0 4px 12px rgba(244,63,94,0.2);"></div>'
        )
        others_html += f"""
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.4);">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td width="60">{img}</td>
              <td style="padding-left:16px;text-align:left;">
                <div style="font-size:15px;font-weight:900;color:#0f172a;letter-spacing:-0.01em;">{_esc(offer['name'])}</div>
                <div style="font-size:12px;color:#e11d48;font-weight:800;margin-top:4px;letter-spacing:0.01em;">✨ {_esc(offer.get('promo', ''))}</div>
              </td>
              <td align="right" style="vertical-align:middle;">
                <a href="{_esc(_browse_url(offer['slug']))}" style="display:inline-block;font-size:12px;font-weight:800;color:#ffffff;
                  background:linear-gradient(135deg,#f43f5e,#e11d48);text-decoration:none;padding:10px 20px;
                  border-radius:14px;box-shadow:0 4px 12px rgba(244,63,94,0.3);letter-spacing:0.02em;">Voir</a>
              </td>
            </tr></table>
          </td>
        </tr>"""

    hero_img = (
        f'<img src="{_esc(hero_cover)}" width="600" alt="" style="display:block;width:100%;max-height:260px;object-fit:cover;border-radius:24px;box-shadow:0 12px 32px rgba(0,0,0,0.1);" />'
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
<!-- Mesh Gradient Background -->
<body style="margin:0;padding:0;background-color:#fdfbfb;background-image:linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%, #ffdde1 100%);
  background: radial-gradient(at 0% 0%, #ffe4e6 0px, transparent 50%), radial-gradient(at 100% 0%, #e0e7ff 0px, transparent 50%), radial-gradient(at 100% 100%, #fbcfe8 0px, transparent 50%), radial-gradient(at 0% 100%, #fce7f3 0px, transparent 50%);
  font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fdfbfb;">
  🔥 {campaign_title} — Profitez des offres campus YoHa
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
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
  <tr><td style="background:#ffffff;background:rgba(255,255,255,0.65);
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    border-radius:36px;border-top:1px solid rgba(255,255,255,0.9);border-left:1px solid rgba(255,255,255,0.9);
    border-right:1px solid rgba(255,255,255,0.3);border-bottom:1px solid rgba(255,255,255,0.3);
    overflow:hidden;box-shadow:0 24px 48px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04);">

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:40px 32px 24px;text-align:center;position:relative;">
        
        <!-- Floating Glow Orbs (Simulated) -->
        <div style="position:absolute;top:-20px;left:-20px;width:100px;height:100px;background:#f43f5e;
          filter:blur(60px);-webkit-filter:blur(60px);opacity:0.15;border-radius:50%;"></div>
        <div style="position:absolute;bottom:-20px;right:-20px;width:100px;height:100px;background:#8b5cf6;
          filter:blur(60px);-webkit-filter:blur(60px);opacity:0.15;border-radius:50%;"></div>

        <!-- Premium Badge -->
        <div style="display:inline-block;padding:8px 20px;
          background:linear-gradient(135deg,#ffffff,#fff1f2);border:1px solid rgba(255,255,255,0.8);
          border-radius:24px;font-size:12px;font-weight:900;color:#e11d48;
          text-transform:uppercase;letter-spacing:0.1em;margin-bottom:20px;
          box-shadow:0 4px 16px rgba(244,63,94,0.15);">🔥 Offre de la semaine</div>

        <h1 style="margin:0 0 12px;font-size:32px;font-weight:900;color:#0f172a;
          letter-spacing:-0.04em;line-height:1.15;text-shadow:0 2px 10px rgba(255,255,255,0.8);">{campaign_title}</h1>
        <p style="margin:0;font-size:15px;color:#475569;line-height:1.6;max-width:420px;font-weight:500;
          margin-left:auto;margin-right:auto;">Profitez de la livraison offerte sur tout le campus en quelques clics.</p>
      </td></tr>

      <!-- Hero image -->
      <tr><td style="padding:0 24px;">{hero_img}</td></tr>

      <!-- Hero info + CTA -->
      <tr><td style="padding:32px 32px 40px;text-align:left;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="text-align:left;">
            <div style="font-size:24px;font-weight:900;color:#0f172a;letter-spacing:-0.03em;">{hero_name}</div>
            <div style="margin-top:6px;font-size:13px;color:#64748b;font-weight:700;">
              ⚡ Arrivée {hero_eta} · <span style="color:#10b981;font-weight:900;">Livraison Offerte</span>
            </div>
          </td>
          <td align="right" style="vertical-align:middle;">
            <div style="background:linear-gradient(135deg,#ffffff,#fff1f2);color:#e11d48;
              font-size:14px;font-weight:900;padding:10px 16px;border-radius:14px;
              border:1px solid rgba(255,255,255,0.9);box-shadow:0 4px 16px rgba(244,63,94,0.12);">{hero_promo}</div>
          </td>
        </tr></table>
        <div style="margin-top:32px;text-align:center;">
          <a href="{_esc(hero_link)}" style="display:inline-block;
            background:linear-gradient(135deg,#f43f5e,#e11d48);color:#ffffff;
            font-size:16px;font-weight:900;text-decoration:none;padding:18px 48px;
            border-radius:20px;box-shadow:0 12px 32px rgba(244,63,94,0.35);
            letter-spacing:0.02em;border:1px solid rgba(255,255,255,0.2);">Commander chez {hero_name} 🚀</a>
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- ═══ MENU GRID (GLASS) ═══ -->
  <tr><td style="padding:36px 0 12px;text-align:left;">
    <div style="display:flex;align-items:center;gap:10px;padding-left:8px;margin-bottom:16px;">
      <span style="font-size:20px;text-shadow:0 4px 12px rgba(0,0,0,0.1);">🍽️</span>
      <div style="font-size:20px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">Plats à la une</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>{menu_html}</tr></table>
  </td></tr>

  <!-- ═══ OTHER OFFERS (GLASS) ═══ -->
  <tr><td style="background:#ffffff;background:rgba(255,255,255,0.55);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    border-radius:28px;border-top:1px solid rgba(255,255,255,0.9);border-left:1px solid rgba(255,255,255,0.9);
    border-right:1px solid rgba(255,255,255,0.3);border-bottom:1px solid rgba(255,255,255,0.3);
    padding:6px;box-shadow:0 16px 32px rgba(15,23,42,0.06);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:28px 28px 12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;text-shadow:0 4px 12px rgba(0,0,0,0.1);">✨</span>
          <div style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">D'autres envies cette semaine ?</div>
        </div>
      </td></tr>
      <tr><td style="padding:0 28px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">{others_html}</table>
      </td></tr>
      <tr><td style="padding:0 28px 28px;text-align:center;">
        <a href="{_esc(_browse_url())}" style="display:inline-block;
          background:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.9);
          color:#475569;font-size:14px;font-weight:800;text-decoration:none;
          padding:14px 32px;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.04);">Découvrir tous les restaurants →</a>
      </td></tr>
    </table>
  </td></tr>

  <!-- ═══ FOOTER ═══ -->
  <tr><td style="padding:48px 16px 32px;text-align:center;">
    <div style="height:2px;background:linear-gradient(90deg,transparent,rgba(15,23,42,0.1),transparent);
      margin:0 auto 28px;max-width:240px;"></div>
    <p style="margin:0 0 10px;font-size:12px;color:#64748b;line-height:1.6;font-weight:600;">
      Vous recevez cet e-mail car vous êtes membre de la communauté YoHa.
    </p>
    {f'<a href="{unsubscribe}" style="font-size:12px;color:#f43f5e;font-weight:700;text-decoration:none;">Se désabonner</a>' if unsubscribe else ''}
    <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;font-weight:500;">© 2026 YoHa · Fait avec ❤️ à Tanger</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def render_promo_email_text(ctx: dict) -> str:
    hero = ctx["hero"]
    lines = [
        f"{ctx.get('title', 'Offres YoHa')} ✨",
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
<body style="margin:0;padding:0;background-color:#fdfbfb;background-image:linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%, #ffdde1 100%);
  background: radial-gradient(at 0% 0%, #ffe4e6 0px, transparent 50%), radial-gradient(at 100% 0%, #e0e7ff 0px, transparent 50%), radial-gradient(at 100% 100%, #fbcfe8 0px, transparent 50%), radial-gradient(at 0% 100%, #fce7f3 0px, transparent 50%);
  font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fdfbfb;">
  🎁 Votre code promo -{escaped_discount}% est prêt ! Offre valable 24h.
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

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

  <!-- ═══ VOUCHER CARD (GLASS) ═══ -->
  <tr><td style="background:#ffffff;background:rgba(255,255,255,0.7);
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    border-radius:36px;border-top:1px solid rgba(255,255,255,0.9);border-left:1px solid rgba(255,255,255,0.9);
    border-right:1px solid rgba(255,255,255,0.3);border-bottom:1px solid rgba(255,255,255,0.3);
    overflow:hidden;box-shadow:0 24px 48px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04);">

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:48px 32px 24px;text-align:center;position:relative;">
        
        <!-- Glow Orbs -->
        <div style="position:absolute;top:0;left:50%;margin-left:-75px;width:150px;height:150px;background:#f43f5e;
          filter:blur(70px);-webkit-filter:blur(70px);opacity:0.1;border-radius:50%;"></div>

        <!-- Gift badge -->
        <div style="display:inline-block;width:96px;height:96px;border-radius:32px;
          background:linear-gradient(135deg,#ffffff,#fff1f2);line-height:96px;
          font-size:48px;text-align:center;margin-bottom:24px;border:1px solid rgba(255,255,255,0.8);
          box-shadow:0 12px 32px rgba(244,63,94,0.15);text-shadow:0 4px 12px rgba(0,0,0,0.1);">🎁</div>

        <h1 style="margin:0 0 12px;font-size:36px;font-weight:900;color:#0f172a;
          letter-spacing:-0.04em;line-height:1.15;text-shadow:0 2px 10px rgba(255,255,255,0.8);">Rien que pour vous</h1>
        <p style="margin:0 0 36px;font-size:16px;color:#475569;line-height:1.65;max-width:400px;
          margin-left:auto;margin-right:auto;font-weight:500;">
          Profitez de <strong style="color:#e11d48;font-size:18px;font-weight:900;background:rgba(255,255,255,0.6);padding:2px 8px;border-radius:8px;">-{escaped_discount}%</strong> de réduction
          {escaped_section} sur YoHa.
        </p>
      </td></tr>

      <!-- ═══ VOUCHER BOX (FROSTED NEON TICKET) ═══ -->
      <tr><td style="padding:0 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <div style="max-width:340px;background:rgba(255,255,255,0.85);
              border:2px dashed #f43f5e;border-radius:24px;padding:32px 24px;text-align:center;
              position:relative;box-shadow:0 16px 40px rgba(244,63,94,0.15), inset 0 0 20px rgba(255,255,255,0.5);
              backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);">
              
              <!-- Decorative cutouts -->
              <div style="position:absolute;left:-16px;top:50%;margin-top:-16px;width:32px;height:32px;
                border-radius:50%;background:#ffffff;background:rgba(255,255,255,0.4);border-right:2px dashed #f43f5e;
                box-shadow:inset -4px 0 8px rgba(0,0,0,0.03);"></div>
              <div style="position:absolute;right:-16px;top:50%;margin-top:-16px;width:32px;height:32px;
                border-radius:50%;background:#ffffff;background:rgba(255,255,255,0.4);border-left:2px dashed #f43f5e;
                box-shadow:inset 4px 0 8px rgba(0,0,0,0.03);"></div>

              <div style="font-size:11px;font-weight:900;color:#f43f5e;text-transform:uppercase;
                letter-spacing:0.15em;margin-bottom:12px;">Votre code promo exclusif</div>
              <div style="font-family:'Courier New',monospace;font-size:34px;font-weight:900;
                color:#e11d48;letter-spacing:0.1em;background:#ffffff;
                border:2px solid #fecdd3;padding:16px 28px;border-radius:18px;
                display:inline-block;box-shadow:0 8px 24px rgba(244,63,94,0.12);
                line-height:1;text-shadow:0 2px 4px rgba(244,63,94,0.2);">{escaped_code}</div>
              <div style="margin-top:20px;font-size:13px;font-weight:800;color:#e11d48;
                display:flex;align-items:center;justify-content:center;gap:6px;
                background:rgba(255,228,230,0.6);padding:6px 12px;border-radius:12px;display:inline-block;">
                ⏳ Valable 24h seulement !
              </div>
            </div>
          </td></tr>
        </table>
      </td></tr>

      <!-- ═══ CTA ═══ -->
      <tr><td style="padding:40px 32px 48px;text-align:center;">
        <a href="{_esc(site_url)}" style="display:inline-block;
          background:linear-gradient(135deg,#f43f5e,#e11d48);color:#ffffff;
          font-size:16px;font-weight:900;text-decoration:none;padding:18px 52px;
          border-radius:20px;box-shadow:0 12px 32px rgba(244,63,94,0.35);
          letter-spacing:0.02em;border:1px solid rgba(255,255,255,0.2);">Commander maintenant 🚀</a>
        <p style="margin:20px 0 0;font-size:13px;color:#64748b;font-weight:600;">
          Code applicable une seule fois. Non cumulable.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- ═══ FOOTER ═══ -->
  <tr><td style="padding:48px 16px 32px;text-align:center;">
    <div style="height:2px;background:linear-gradient(90deg,transparent,rgba(15,23,42,0.1),transparent);
      margin:0 auto 28px;max-width:240px;"></div>
    <p style="margin:0 0 10px;font-size:12px;color:#64748b;line-height:1.6;font-weight:600;">
      Vous recevez cet e-mail car vous êtes membre de la communauté YoHa.
    </p>
    {f'<a href="{unsub}" style="font-size:12px;color:#f43f5e;font-weight:700;text-decoration:none;">Se désabonner</a>' if unsub else ''}
    <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;font-weight:500;">© 2026 YoHa · Fait avec ❤️ à Tanger</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def render_new_promo_email_text(*, code: str, discount: int, section_label: str, unsubscribe_url: str) -> str:
    return f"""🎁 Un cadeau pour vous sur YoHa ! ✨

Profitez de -{discount}% de réduction {section_label} avec le code promo exclusif :

👉 {code}

⏳ Ce code est valable pendant 24 heures seulement !
Commander sur YoHa : {_browse_url()}"""