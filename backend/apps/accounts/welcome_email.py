"""E-mail de bienvenue YoHa (HTML + texte) envoyé à la création d'un compte client."""
from __future__ import annotations

import html
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from apps.core.email_checker import is_valid_real_email

logger = logging.getLogger(__name__)


def _abs_url(path: str) -> str:
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    base = getattr(settings, "YOHA_FRONTEND_URL", "http://localhost:3002").rstrip("/")
    return f"{base}{path if path.startswith('/') else '/' + path}"


def _esc(value) -> str:
    return html.escape(str(value or ""), quote=True)


def render_welcome_email_html(name: str, email: str) -> str:
    safe_name = _esc(name)
    logo_url = _esc(_abs_url("/logo.png"))
    browse_url = _esc(_abs_url("/browse"))
    orange = "#f97316"
    pink = "#ec4899"
    violet = "#8b5cf6"

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>Bienvenue sur YoHa</title>
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
  Votre compte YoHa est prêt — commandez en quelques clics sur le campus.
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff7ed;">
  <tr>
    <td align="center" style="padding:0;">
      <!-- Soft brand wash (table-safe) -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg,{orange},{pink},{violet});">&nbsp;</td>
        </tr>
      </table>
    </td>
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
              color:{orange};">YoHa</div>
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

          <!-- Gradient header strip -->
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background:linear-gradient(90deg,{orange},{pink},{violet});">&nbsp;</td>
          </tr>

          <tr><td style="padding:44px 36px 28px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 22px;">
              <tr>
                <td align="center" style="width:72px;height:72px;border-radius:22px;
                  background:linear-gradient(145deg,#fff7ed,#fce7f3);
                  border:1px solid #fdba74;font-size:34px;line-height:72px;
                  box-shadow:0 8px 24px rgba(236,72,153,0.18);">🎉</td>
              </tr>
            </table>

            <h1 style="margin:0 0 14px;font-size:34px;font-weight:900;letter-spacing:-0.04em;
              color:#1e1b4b;line-height:1.12;">Bienvenue sur YoHa</h1>
            <p style="margin:0 auto;font-size:16px;line-height:1.65;color:#64748b;max-width:420px;font-weight:500;">
              Bonjour <strong style="color:#1e1b4b;font-weight:800;">{safe_name}</strong> —
              votre compte est prêt. Plats, courses et pharmacie, livrés sur le campus,
              à l&apos;aile hospitalière ou à la BU.
            </p>
          </td></tr>

          <!-- Benefits -->
          <tr><td style="padding:8px 28px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="33%" style="padding:6px;vertical-align:top;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="background:#fff7ed;border-radius:18px;border:1px solid #fed7aa;">
                    <tr><td style="padding:18px 12px;text-align:center;">
                      <div style="font-size:24px;margin-bottom:8px;">⚡</div>
                      <div style="font-size:13px;font-weight:900;color:#1e1b4b;">Livraison rapide</div>
                      <div style="font-size:11px;color:#78716c;font-weight:600;margin-top:4px;line-height:1.45;">
                        45–60 min sur le campus</div>
                    </td></tr>
                  </table>
                </td>
                <td width="33%" style="padding:6px;vertical-align:top;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="background:#fdf2f8;border-radius:18px;border:1px solid #fbcfe8;">
                    <tr><td style="padding:18px 12px;text-align:center;">
                      <div style="font-size:24px;margin-bottom:8px;">📍</div>
                      <div style="font-size:13px;font-weight:900;color:#1e1b4b;">Suivi en direct</div>
                      <div style="font-size:11px;color:#78716c;font-weight:600;margin-top:4px;line-height:1.45;">
                        Votre livreur en live</div>
                    </td></tr>
                  </table>
                </td>
                <td width="33%" style="padding:6px;vertical-align:top;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="background:#f5f3ff;border-radius:18px;border:1px solid #ddd6fe;">
                    <tr><td style="padding:18px 12px;text-align:center;">
                      <div style="font-size:24px;margin-bottom:8px;">🎁</div>
                      <div style="font-size:13px;font-weight:900;color:#1e1b4b;">Offres exclusives</div>
                      <div style="font-size:11px;color:#78716c;font-weight:600;margin-top:4px;line-height:1.45;">
                        Codes promo membres</div>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- CTA -->
          <tr><td style="padding:0 36px 44px;text-align:center;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
              href="{browse_url}" style="height:54px;v-text-anchor:middle;width:280px;" arcsize="30%"
              strokecolor="{orange}" fillcolor="{orange}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">
                Commencer mes commandes
              </center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="{browse_url}" style="display:inline-block;
              background:linear-gradient(135deg,{orange} 0%,{pink} 100%);
              background-color:{orange};color:#ffffff;
              font-size:16px;font-weight:900;text-decoration:none;padding:18px 44px;
              border-radius:16px;box-shadow:0 14px 32px rgba(249,115,22,0.38);
              letter-spacing:0.01em;">
              Commencer mes commandes →
            </a>
            <!--<![endif]-->
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


def render_welcome_email_text(name: str, email: str) -> str:
    browse_url = _abs_url("/browse")
    return "\n".join([
        "Bienvenue sur YoHa !",
        "",
        f"Bonjour {name},",
        "Votre compte a bien été créé. Commandez vos plats, courses de supermarché,",
        "médicaments et plus encore — livrés sur le campus, à l'aile hospitalière ou à la BU.",
        "",
        "• Livraison rapide en 45-60 min",
        "• Suivi de votre livreur en direct",
        "• Offres et codes promo exclusifs",
        "",
        f"Commencer mes commandes : {browse_url}",
        "",
        "— YoHa · Livraison campus & CHU, Tanger",
    ])


def send_welcome_email(user) -> bool:
    email = (user.email or "").strip().lower()
    if not is_valid_real_email(email):
        logger.warning("welcome_email_skip invalid_or_fake_email user=%s email=%s", user.pk, email)
        return False

    name = (getattr(user, "display_name", "") or "").strip() or email.split("@")[0]
    subject = "Bienvenue sur YoHa — votre compte est prêt"
    text_body = render_welcome_email_text(name, email)
    html_body = render_welcome_email_html(name, email)
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "YoHa <yohadelivery@gmail.com>")

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_email,
            to=[email],
            reply_to=["yohadelivery@gmail.com"],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=True)
        logger.info("welcome_email_sent user=%s to=%s", user.pk, email)
        return True
    except Exception:
        logger.exception("welcome_email_failed user=%s", user.pk)
        return False
