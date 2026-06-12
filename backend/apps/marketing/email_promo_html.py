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
            f'<img src="{_esc(img)}" width="100%" alt="" style="display:block;width:100%;height:140px;object-fit:cover;border-radius:12px 12px 0 0;" />'
            if img
            else '<div style="height:140px;background:linear-gradient(135deg,#f97316,#ec4899);border-radius:12px 12px 0 0;"></div>'
        )
        menu_html += f"""
        <td width="33%" style="padding:6px;vertical-align:top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <tr><td>{img_tag}</td></tr>
            <tr><td style="padding:12px;">
              <div style="font-size:14px;font-weight:700;color:#0f172a;">{_esc(item['name'])}</div>
              <div style="font-size:12px;color:#64748b;margin:4px 0 8px;line-height:1.4;">{_esc(item.get('desc', ''))}</div>
              <div style="font-size:16px;font-weight:800;color:#f97316;">{_esc(item['price'])} MAD</div>
            </td></tr>
          </table>
        </td>"""

    others_html = ""
    for offer in ctx.get("other_offers", []):
        cover = _abs_url(offer.get("cover", ""))
        img = (
            f'<img src="{_esc(cover)}" width="56" height="56" style="border-radius:10px;object-fit:cover;display:block;" alt="" />'
            if cover
            else '<div style="width:56px;height:56px;border-radius:10px;background:linear-gradient(135deg,#f97316,#ec4899);"></div>'
        )
        others_html += f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td width="64">{img}</td>
              <td style="padding-left:12px;">
                <div style="font-size:15px;font-weight:700;color:#0f172a;">{_esc(offer['name'])}</div>
                <div style="font-size:12px;color:#ea580c;font-weight:600;margin-top:2px;">🔥 {_esc(offer.get('promo', ''))}</div>
              </td>
              <td align="right" style="vertical-align:middle;">
                <a href="{_esc(_browse_url(offer['slug']))}" style="font-size:13px;font-weight:700;color:#f97316;text-decoration:none;">Commander</a>
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
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#fff7ed;font-family:Inter,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;padding:24px 12px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<tr><td style="padding-bottom:20px;">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="background:linear-gradient(135deg,#f97316,#ec4899,#8b5cf6);border-radius:14px;width:44px;height:44px;text-align:center;">
      <span style="color:#fff;font-weight:800;font-size:16px;line-height:44px;">YN</span>
    </td>
    <td style="padding-left:12px;">
      <div style="font-size:22px;font-weight:800;color:#0f172a;">YouHa</div>
      <div style="font-size:12px;color:#64748b;">Campus &amp; CHU · Tanger</div>
    </td>
  </tr></table>
</td></tr>

<tr><td style="background:#fff;border-radius:24px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="height:6px;background:linear-gradient(90deg,#f97316,#ec4899,#8b5cf6);"></td></tr>
    <tr><td style="padding:28px 24px 16px;text-align:center;">
      <div style="font-size:13px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:0.1em;">Offre du moment</div>
      <h1 style="margin:8px 0;font-size:28px;font-weight:800;color:#0f172a;letter-spacing:-0.03em;">{campaign_title}</h1>
      <p style="margin:0;font-size:15px;color:#475569;line-height:1.6;">Commandez en quelques clics — livraison offerte sur votre campus.</p>
    </td></tr>
    <tr><td>{hero_img}</td></tr>
    <tr><td style="padding:20px 24px;">
      <div style="font-size:22px;font-weight:800;color:#0f172a;">{hero_name}</div>
      <div style="margin-top:6px;font-size:14px;font-weight:700;color:#ea580c;">🔥 {hero_promo}</div>
      <div style="margin-top:4px;font-size:13px;color:#64748b;">⚡ {hero_eta} · Livraison offerte</div>
      <div style="margin-top:20px;text-align:center;">
        <a href="{_esc(hero_link)}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;
          font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:14px;
          box-shadow:0 8px 24px rgba(249,115,22,0.35);">Commander chez {hero_name}</a>
      </div>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:20px 0 8px;">
  <div style="font-size:18px;font-weight:800;color:#0f172a;padding:0 4px 12px;">🍽️ Menu à la une</div>
  <table width="100%" cellpadding="0" cellspacing="0"><tr>{menu_html}</tr></table>
</td></tr>

<tr><td style="background:#fff;border-radius:20px;border:1px solid #e2e8f0;padding:4px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:20px 24px 8px;font-size:18px;font-weight:800;color:#0f172a;">Autres offres cette semaine</td></tr>
    <tr><td style="padding:0 24px 20px;">{others_html}</td></tr>
    <tr><td style="padding:0 24px 24px;text-align:center;">
      <a href="{_esc(_browse_url())}" style="display:inline-block;border:2px solid #f97316;color:#f97316;font-size:14px;font-weight:700;
        text-decoration:none;padding:12px 24px;border-radius:12px;">Voir tous les restaurants</a>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:24px 8px;text-align:center;font-size:12px;color:#94a3b8;line-height:1.6;">
  Vous recevez cet e-mail car vous avez commandé ou créé un compte sur YouHa.<br/>
  <a href="{unsubscribe}" style="color:#64748b;">Se désinscrire</a> · © 2026 YouHa Tanger
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
