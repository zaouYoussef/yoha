"""Template HTML campagne promo YoHa — Design premium brand (orange → pink → violet)."""
from __future__ import annotations

import html

from django.conf import settings

_ORANGE = "#f97316"
_PINK = "#ec4899"
_VIOLET = "#8b5cf6"


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
            f'<img src="{_esc(img)}" width="100%" alt="" style="display:block;width:100%;height:120px;object-fit:cover;border-radius:16px 16px 0 0;border:0;" />'
            if img
            else f'<div style="height:120px;background:linear-gradient(135deg,{_ORANGE},{_PINK});border-radius:16px 16px 0 0;"></div>'
        )
        menu_html += f"""
        <td width="33%" style="padding:6px;vertical-align:top;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:#ffffff;border:1px solid #fed7aa;border-radius:16px;overflow:hidden;
            box-shadow:0 6px 18px rgba(249,115,22,0.08);">
            <tr><td>{img_tag}</td></tr>
            <tr><td style="padding:14px 12px 12px;text-align:left;">
              <div style="font-size:14px;font-weight:900;color:#1e1b4b;height:36px;
                overflow:hidden;line-height:1.25;margin-bottom:6px;letter-spacing:-0.02em;">{_esc(item['name'])}</div>
              <div style="font-size:11px;color:#78716c;margin:0 0 12px;line-height:1.4;
                height:30px;overflow:hidden;font-weight:500;">{_esc(item.get('desc', ''))}</div>
              <div style="display:inline-block;padding:5px 12px;
                background:#fff7ed;border-radius:10px;
                font-size:12px;font-weight:900;color:{_ORANGE};
                border:1px solid #fed7aa;">{_esc(item['price'])} MAD</div>
            </td></tr>
          </table>
        </td>"""

    others_html = ""
    for offer in ctx.get("other_offers", []):
        cover = _abs_url(offer.get("cover", ""))
        img = (
            f'<img src="{_esc(cover)}" width="60" height="60" style="border-radius:14px;object-fit:cover;display:block;border:0;" alt="" />'
            if cover
            else f'<div style="width:60px;height:60px;border-radius:14px;background:linear-gradient(135deg,{_ORANGE},{_PINK});"></div>'
        )
        others_html += f"""
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td width="60">{img}</td>
              <td style="padding-left:16px;text-align:left;">
                <div style="font-size:15px;font-weight:900;color:#1e1b4b;letter-spacing:-0.01em;">{_esc(offer['name'])}</div>
                <div style="font-size:12px;color:{_PINK};font-weight:800;margin-top:4px;">✦ {_esc(offer.get('promo', ''))}</div>
              </td>
              <td align="right" style="vertical-align:middle;">
                <a href="{_esc(_browse_url(offer['slug']))}" style="display:inline-block;font-size:12px;font-weight:800;color:#ffffff;
                  background:linear-gradient(135deg,{_ORANGE},{_PINK});background-color:{_ORANGE};
                  text-decoration:none;padding:10px 18px;border-radius:12px;
                  box-shadow:0 6px 16px rgba(249,115,22,0.28);">Voir</a>
              </td>
            </tr></table>
          </td>
        </tr>"""

    hero_img = (
        f'<img src="{_esc(hero_cover)}" width="600" alt="" style="display:block;width:100%;max-height:260px;object-fit:cover;border-radius:20px;border:0;" />'
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
  <!--[if mso]>
  <style>table,td,div,a {{font-family:Arial,sans-serif!important;}}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#fff7ed;
  font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e1b4b;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fff7ed;">
  {campaign_title} — Profitez des offres campus YoHa
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff7ed;">
  <tr>
    <td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,{_ORANGE},{_PINK},{_VIOLET});">&nbsp;</td>
  </tr>
  <tr><td align="center" style="padding:32px 16px 48px;">
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
      <tr><td style="padding:36px 32px 20px;text-align:center;">
        <div style="display:inline-block;padding:7px 16px;
          background:#fff7ed;border:1px solid #fed7aa;
          border-radius:999px;font-size:11px;font-weight:900;color:{_ORANGE};
          text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;">Offre de la semaine</div>

        <h1 style="margin:0 0 12px;font-size:30px;font-weight:900;color:#1e1b4b;
          letter-spacing:-0.04em;line-height:1.15;">{campaign_title}</h1>
        <p style="margin:0 auto;font-size:15px;color:#64748b;line-height:1.6;max-width:400px;font-weight:500;">
          Livraison offerte sur tout le campus — en quelques clics.
        </p>
      </td></tr>

      <tr><td style="padding:0 24px;">{hero_img}</td></tr>

      <tr><td style="padding:28px 32px 40px;text-align:left;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="text-align:left;">
            <div style="font-size:22px;font-weight:900;color:#1e1b4b;letter-spacing:-0.03em;">{hero_name}</div>
            <div style="margin-top:6px;font-size:13px;color:#78716c;font-weight:700;">
              ⚡ Arrivée {hero_eta} · <span style="color:{_VIOLET};font-weight:900;">Livraison offerte</span>
            </div>
          </td>
          <td align="right" style="vertical-align:middle;">
            <div style="background:#fdf2f8;color:{_PINK};
              font-size:13px;font-weight:900;padding:10px 14px;border-radius:12px;
              border:1px solid #fbcfe8;">{hero_promo}</div>
          </td>
        </tr></table>
        <div style="margin-top:28px;text-align:center;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
            href="{_esc(hero_link)}" style="height:54px;v-text-anchor:middle;width:300px;" arcsize="30%"
            strokecolor="{_ORANGE}" fillcolor="{_ORANGE}">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">
              Commander chez {hero_name}
            </center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="{_esc(hero_link)}" style="display:inline-block;
            background:linear-gradient(135deg,{_ORANGE} 0%,{_PINK} 100%);
            background-color:{_ORANGE};color:#ffffff;
            font-size:16px;font-weight:900;text-decoration:none;padding:18px 40px;
            border-radius:16px;box-shadow:0 14px 32px rgba(249,115,22,0.38);
            letter-spacing:0.01em;">Commander chez {hero_name} →</a>
          <!--<![endif]-->
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Menu grid -->
  <tr><td style="padding:32px 0 12px;text-align:left;">
    <div style="padding-left:8px;margin-bottom:14px;font-size:18px;font-weight:900;color:#1e1b4b;letter-spacing:-0.02em;">
      <span style="color:{_ORANGE};">✦</span> Plats à la une
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>{menu_html}</tr></table>
  </td></tr>

  <!-- Other offers -->
  <tr><td style="background-color:#ffffff;border-radius:24px;border:1px solid #e9d5ff;
    box-shadow:0 12px 28px rgba(139,92,246,0.07);padding:6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:26px 26px 10px;">
        <div style="font-size:17px;font-weight:900;color:#1e1b4b;letter-spacing:-0.02em;">
          <span style="color:{_VIOLET};">✦</span> D&apos;autres envies cette semaine ?
        </div>
      </td></tr>
      <tr><td style="padding:0 26px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">{others_html}</table>
      </td></tr>
      <tr><td style="padding:0 26px 26px;text-align:center;">
        <a href="{_esc(_browse_url())}" style="display:inline-block;
          background:#fff7ed;border:1px solid #fed7aa;
          color:#9a3412;font-size:14px;font-weight:800;text-decoration:none;
          padding:13px 28px;border-radius:14px;">Découvrir tous les restaurants →</a>
      </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:40px 16px 8px;text-align:center;">
    <p style="margin:0 0 10px;font-size:12px;color:#78716c;line-height:1.6;font-weight:600;">
      Vous recevez cet e-mail car vous êtes membre de la communauté YoHa.
    </p>
    {f'<a href="{unsubscribe}" style="font-size:12px;color:{_PINK};font-weight:700;text-decoration:none;">Se désabonner</a>' if unsubscribe else ''}
    <p style="margin:12px 0 0;font-size:11px;color:#a8a29e;font-weight:500;">© 2026 YoHa · Tanger</p>
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
        f"★ {hero['name']} — {hero.get('promo', '')}",
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
  <title>Code promo · YoHa</title>
  <!--[if mso]>
  <style>table,td,div,a {{font-family:Arial,sans-serif!important;}}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#fff7ed;
  font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e1b4b;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fff7ed;">
  Votre code promo -{escaped_discount}% est prêt — valable 24h.
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff7ed;">
  <tr>
    <td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,{_ORANGE},{_PINK},{_VIOLET});">&nbsp;</td>
  </tr>
  <tr><td align="center" style="padding:40px 16px 48px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

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

  <!-- Voucher card -->
  <tr><td style="background-color:#ffffff;border-radius:28px;overflow:hidden;
    border:1px solid #fed7aa;
    box-shadow:0 24px 48px rgba(249,115,22,0.10), 0 4px 12px rgba(139,92,246,0.06);">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="height:4px;line-height:4px;font-size:0;background:linear-gradient(90deg,{_ORANGE},{_PINK},{_VIOLET});">&nbsp;</td>
      </tr>
      <tr><td style="padding:44px 32px 20px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
          <tr>
            <td align="center" style="width:80px;height:80px;border-radius:24px;
              background:linear-gradient(145deg,#fff7ed,#fce7f3);
              border:1px solid #fdba74;font-size:40px;line-height:80px;
              box-shadow:0 8px 24px rgba(236,72,153,0.18);">🎁</td>
          </tr>
        </table>

        <h1 style="margin:0 0 12px;font-size:32px;font-weight:900;color:#1e1b4b;
          letter-spacing:-0.04em;line-height:1.15;">Rien que pour vous</h1>
        <p style="margin:0 auto 28px;font-size:16px;color:#64748b;line-height:1.65;max-width:380px;font-weight:500;">
          Profitez de <strong style="color:{_PINK};font-weight:900;">-{escaped_discount}%</strong>
          de réduction {escaped_section} sur YoHa.
        </p>
      </td></tr>

      <!-- Code ticket -->
      <tr><td style="padding:0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"
              style="max-width:340px;width:100%;background:#fffbeb;
              border:2px dashed {_ORANGE};border-radius:20px;">
              <tr><td style="padding:28px 24px;text-align:center;">
                <div style="font-size:11px;font-weight:900;color:{_ORANGE};text-transform:uppercase;
                  letter-spacing:0.14em;margin-bottom:12px;">Votre code exclusif</div>
                <div style="font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:900;
                  color:#1e1b4b;letter-spacing:0.12em;background:#ffffff;
                  border:2px solid #fed7aa;padding:14px 24px;border-radius:14px;
                  display:inline-block;line-height:1;">{escaped_code}</div>
                <div style="margin-top:16px;font-size:13px;font-weight:800;color:{_PINK};
                  background:#fdf2f8;padding:6px 14px;border-radius:10px;display:inline-block;
                  border:1px solid #fbcfe8;">
                  Valable 24h seulement
                </div>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:36px 32px 44px;text-align:center;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
          href="{_esc(site_url)}" style="height:54px;v-text-anchor:middle;width:280px;" arcsize="30%"
          strokecolor="{_ORANGE}" fillcolor="{_ORANGE}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">
            Commander maintenant
          </center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="{_esc(site_url)}" style="display:inline-block;
          background:linear-gradient(135deg,{_ORANGE} 0%,{_PINK} 100%);
          background-color:{_ORANGE};color:#ffffff;
          font-size:16px;font-weight:900;text-decoration:none;padding:18px 48px;
          border-radius:16px;box-shadow:0 14px 32px rgba(249,115,22,0.38);
          letter-spacing:0.01em;">Commander maintenant →</a>
        <!--<![endif]-->
        <p style="margin:18px 0 0;font-size:13px;color:#78716c;font-weight:600;">
          Code applicable une seule fois. Non cumulable.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:40px 16px 8px;text-align:center;">
    <p style="margin:0 0 10px;font-size:12px;color:#78716c;line-height:1.6;font-weight:600;">
      Vous recevez cet e-mail car vous êtes membre de la communauté YoHa.
    </p>
    {f'<a href="{unsub}" style="font-size:12px;color:{_PINK};font-weight:700;text-decoration:none;">Se désabonner</a>' if unsub else ''}
    <p style="margin:12px 0 0;font-size:11px;color:#a8a29e;font-weight:500;">© 2026 YoHa · Tanger</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def render_new_promo_email_text(*, code: str, discount: int, section_label: str, unsubscribe_url: str) -> str:
    return f"""Un cadeau pour vous sur YoHa !

Profitez de -{discount}% de réduction {section_label} avec le code promo exclusif :

{code}

Ce code est valable pendant 24 heures seulement.
Commander sur YoHa : {_browse_url()}"""
