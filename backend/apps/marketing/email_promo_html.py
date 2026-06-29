"""Template HTML campagne promo YouHa (menu mis en avant + offres)."""
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

    menu_html = ""
    for item in ctx.get("featured_items", []):
        img = _abs_url(item.get("img", ""))
        img_tag = (
            f'<img src="{_esc(img)}" width="100%" alt="" style="display:block;width:100%;height:110px;object-fit:cover;border-radius:10px 10px 0 0;" />'
            if img
            else '<div style="height:110px;background:linear-gradient(135deg,#f43f5e,#fb7185);border-radius:10px 10px 0 0;"></div>'
        )
        menu_html += f"""
        <td width="33%" style="padding:4px;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #f1f5f9;border-radius:12px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
            <tr><td>{img_tag}</td></tr>
            <tr><td style="padding:10px;text-align:left;">
              <div style="font-size:13px;font-weight:800;color:#0f172a;height:34px;overflow:hidden;line-height:1.2;margin-bottom:4px;">{_esc(item['name'])}</div>
              <div style="font-size:11px;color:#64748b;margin:0 0 8px;line-height:1.3;height:28px;overflow:hidden;">{_esc(item.get('desc', ''))}</div>
              <div style="display:inline-block;padding:2px 8px;background:#fff1f2;border-radius:6px;font-size:12px;font-weight:800;color:#f43f5e;">{_esc(item['price'])} MAD</div>
            </td></tr>
          </table>
        </td>"""

    others_html = ""
    for offer in ctx.get("other_offers", []):
        cover = _abs_url(offer.get("cover", ""))
        img = (
            f'<img src="{_esc(cover)}" width="56" height="56" style="border-radius:10px;object-fit:cover;display:block;" alt="" />'
            if cover
            else '<div style="width:56px;height:56px;border-radius:10px;background:linear-gradient(135deg,#f43f5e,#fb7185);"></div>'
        )
        others_html += f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td width="56">{img}</td>
              <td style="padding-left:14px;text-align:left;">
                <div style="font-size:14px;font-weight:800;color:#0f172a;">{_esc(offer['name'])}</div>
                <div style="font-size:11px;color:#f43f5e;font-weight:700;margin-top:2px;letter-spacing:0.02em;">✨ {_esc(offer.get('promo', ''))}</div>
              </td>
              <td align="right" style="vertical-align:middle;">
                <a href="{_esc(_browse_url(offer['slug']))}" style="display:inline-block;font-size:12px;font-weight:800;color:#ffffff;background:#f43f5e;text-decoration:none;padding:6px 14px;border-radius:8px;">Voir</a>
              </td>
            </tr></table>
          </td>
        </tr>"""

    hero_img = (
        f'<img src="{_esc(hero_cover)}" width="600" alt="" style="display:block;width:100%;max-height:220px;object-fit:cover;" />'
        if hero_cover
        else ""
    )

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
    body {{
      font-family: 'Outfit', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }}
  </style>
</head>
<body style="margin:0;padding:0;background:#faf8f6;font-family:'Outfit','Inter','Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f6;padding:32px 12px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="padding-bottom:24px;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:linear-gradient(135deg,#f43f5e,#e11d48);border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;">
        <span style="color:#ffffff;font-weight:800;font-size:18px;line-height:40px;">YH</span>
      </td>
      <td style="padding-left:12px;text-align:left;">
        <div style="font-size:22px;font-weight:800;color:#0f172a;line-height:1;margin-bottom:2px;letter-spacing:-0.02em;">YouHa</div>
        <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Campus &amp; CHU · Tanger</div>
      </td>
    </tr></table>
  </td></tr>

  <!-- HERO CARD -->
  <tr><td style="background:#ffffff;border-radius:24px;border:1px solid #f1f5f9;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.04);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="height:6px;background:linear-gradient(90deg,#f43f5e,#fb7185,#f43f5e);"></td></tr>
      <tr><td style="padding:28px 24px 20px;text-align:center;">
        <div style="font-size:12px;font-weight:800;color:#f43f5e;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">🔥 Offre de la semaine</div>
        <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;line-height:1.2;">{campaign_title}</h1>
        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.5;">Profitez de la livraison offerte sur tout le campus en quelques clics.</p>
      </td></tr>
      <tr><td>{hero_img}</td></tr>
      <tr><td style="padding:24px;text-align:left;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="text-align:left;">
            <div style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.01em;">{hero_name}</div>
            <div style="margin-top:4px;font-size:12px;color:#64748b;font-weight:600;">⚡ Arrivée {hero_eta} · <span style="color:#10b981;font-weight:700;">Livraison Offerte</span></div>
          </td>
          <td align="right" style="vertical-align:middle;">
            <div style="background:#fff1f2;color:#f43f5e;font-size:12px;font-weight:800;padding:6px 12px;border-radius:8px;">{hero_promo}</div>
          </td>
        </tr></table>
        <div style="margin-top:24px;text-align:center;">
          <a href="{_esc(hero_link)}" style="display:inline-block;background:#f43f5e;color:#ffffff;
            font-size:15px;font-weight:800;text-decoration:none;padding:14px 32px;border-radius:14px;
            box-shadow:0 8px 20px rgba(244,63,94,0.25);letter-spacing:0.01em;">Commander chez {hero_name}</a>
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- MENU LIST -->
  <tr><td style="padding:28px 0 8px;text-align:left;">
    <div style="font-size:16px;font-weight:800;color:#0f172a;padding-left:4px;margin-bottom:12px;letter-spacing:-0.01em;">🍽️ Plats à la une</div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>{menu_html}</tr></table>
  </td></tr>

  <!-- OTHER OFFERS -->
  <tr><td style="background:#ffffff;border-radius:24px;border:1px solid #f1f5f9;padding:4px;box-shadow:0 10px 30px rgba(15,23,42,0.03);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:20px 20px 8px;font-size:16px;font-weight:800;color:#0f172a;text-align:left;letter-spacing:-0.01em;">D'autres envies cette semaine ?</td></tr>
      <tr><td style="padding:0 20px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">{others_html}</table>
      </td></tr>
      <tr><td style="padding:0 20px 20px;text-align:center;">
        <a href="{_esc(_browse_url())}" style="display:inline-block;border:2px solid #0f172a;color:#0f172a;font-size:13px;font-weight:800;
          text-decoration:none;padding:11px 24px;border-radius:12px;letter-spacing:0.02em;">Découvrir tous les restaurants</a>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:32px 8px 16px;text-align:center;font-size:11px;color:#94a3b8;line-height:1.6;font-weight:500;">
    Vous recevez cet e-mail car vous êtes membre de la communauté YouHa.<br/>
    <a href="{unsubscribe}" style="color:#f43f5e;text-decoration:none;font-weight:700;">Se désinscrire</a> · © 2026 YouHa Tanger
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def render_promo_email_text(ctx: dict) -> str:
    hero = ctx["hero"]
    lines = [
        f"{ctx.get('title', 'Offres YouHa')}",
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
        "",
        f"Se désinscrire : {ctx.get('unsubscribe_url', '')}",
    ])
    return "\n".join(lines)
