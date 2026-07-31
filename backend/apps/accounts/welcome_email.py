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
    accent = "#f97316"
    accent_secondary = "#ec4899"

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>Bienvenue sur YoHa 🎉</title>
  <!--[if mso]>
  <style>table,td,div,a {{font-family:Arial,sans-serif!important;}}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#fdfbfb;background-image:linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%, #ffdde1 100%);
  background: radial-gradient(at 0% 0%, #ffe4e6 0px, transparent 50%), radial-gradient(at 100% 0%, #e0e7ff 0px, transparent 50%), radial-gradient(at 100% 100%, #fbcfe8 0px, transparent 50%), radial-gradient(at 0% 100%, #fce7f3 0px, transparent 50%);
  font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#0f172a;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#fdfbfb;">
  Votre compte YoHa est prêt — commandez en quelques clics.
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
              box-shadow:0 8px 24px rgba(249,115,22,0.15);" />
          </td>
          <td style="padding-left:16px;">
            <div style="font-size:28px;font-weight:900;letter-spacing:-0.04em;
              background:linear-gradient(135deg,{accent},{accent_secondary});-webkit-background-clip:text;
              -webkit-text-fill-color:transparent;background-clip:text;">YoHa</div>
            <div style="font-size:11px;color:#64748b;font-weight:800;letter-spacing:0.08em;
              text-transform:uppercase;">Campus &amp; CHU · Tanger</div>
          </td>
        </tr></table>
      </td></tr>

      <!-- ═══ HERO CARD (GLASSMORPHISM) ═══ -->
      <tr><td style="background:#ffffff;background:rgba(255,255,255,0.7);
        backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
        border-radius:36px;border-top:1px solid rgba(255,255,255,0.9);border-left:1px solid rgba(255,255,255,0.9);
        border-right:1px solid rgba(255,255,255,0.3);border-bottom:1px solid rgba(255,255,255,0.3);
        overflow:hidden;box-shadow:0 24px 48px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04);">

        <table width="100%" cellpadding="0" cellspacing="0">

          <!-- Hero section -->
          <tr><td style="padding:48px 32px 32px;text-align:center;position:relative;">

            <!-- Floating Glow Orbs -->
            <div style="position:absolute;top:-20px;left:-20px;width:120px;height:120px;background:{accent};
              filter:blur(70px);-webkit-filter:blur(70px);opacity:0.15;border-radius:50%;"></div>
            <div style="position:absolute;bottom:-20px;right:-20px;width:120px;height:120px;background:{accent_secondary};
              filter:blur(70px);-webkit-filter:blur(70px);opacity:0.15;border-radius:50%;"></div>

            <!-- Emoji badge -->
            <div style="display:inline-block;width:88px;height:88px;border-radius:28px;
              background:linear-gradient(135deg,#ffffff,rgba(249,115,22,0.1));line-height:88px;
              font-size:42px;text-align:center;margin-bottom:24px;border:1px solid rgba(255,255,255,0.8);
              box-shadow:0 12px 32px rgba(249,115,22,0.15);text-shadow:0 4px 12px rgba(0,0,0,0.1);">🎉</div>

            <h1 style="margin:0 0 12px;font-size:32px;font-weight:900;letter-spacing:-0.04em;
              color:#0f172a;line-height:1.15;text-shadow:0 2px 10px rgba(255,255,255,0.8);">Bienvenue sur YoHa !</h1>
            <p style="margin:0;font-size:16px;line-height:1.65;color:#475569;max-width:440px;font-weight:500;
              margin-left:auto;margin-right:auto;">
              Votre compte <strong style="color:#0f172a;font-weight:800;">{safe_name}</strong> a bien été créé.
              Commandez vos plats, courses de supermarché, médicaments et plus encore — livrés
              directement sur le campus, à l&apos;aile hospitalière ou à la BU. 🏍️
            </p>
          </td></tr>

          <!-- ═══ BENEFITS (FROSTED CARDS) ═══ -->
          <tr><td style="padding:12px 24px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px;vertical-align:top;width:33.33%;">
                  <div style="background:rgba(255,255,255,0.6);border-radius:20px;
                    border:1px solid rgba(255,255,255,0.9);box-shadow:0 8px 24px rgba(15,23,42,0.04);
                    padding:20px 12px;text-align:center;height:100%;">
                    <div style="font-size:28px;margin-bottom:10px;text-shadow:0 4px 12px rgba(0,0,0,0.1);">⚡</div>
                    <div style="font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.01em;">Livraison rapide</div>
                    <div style="font-size:11px;color:#64748b;font-weight:600;margin-top:4px;line-height:1.5;">
                      En 30-45 min sur l&apos;Alliance Tangéroise.</div>
                  </div>
                </td>
                <td style="padding:6px;vertical-align:top;width:33.33%;">
                  <div style="background:rgba(255,255,255,0.6);border-radius:20px;
                    border:1px solid rgba(255,255,255,0.9);box-shadow:0 8px 24px rgba(15,23,42,0.04);
                    padding:20px 12px;text-align:center;height:100%;">
                    <div style="font-size:28px;margin-bottom:10px;text-shadow:0 4px 12px rgba(0,0,0,0.1);">📍</div>
                    <div style="font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.01em;">Suivi en direct</div>
                    <div style="font-size:11px;color:#64748b;font-weight:600;margin-top:4px;line-height:1.5;">
                      Votre livreur, positionné en temps réel.</div>
                  </div>
                </td>
                <td style="padding:6px;vertical-align:top;width:33.33%;">
                  <div style="background:rgba(255,255,255,0.6);border-radius:20px;
                    border:1px solid rgba(255,255,255,0.9);box-shadow:0 8px 24px rgba(15,23,42,0.04);
                    padding:20px 12px;text-align:center;height:100%;">
                    <div style="font-size:28px;margin-bottom:10px;text-shadow:0 4px 12px rgba(0,0,0,0.1);">🎁</div>
                    <div style="font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.01em;">Offres exclusives</div>
                    <div style="font-size:11px;color:#64748b;font-weight:600;margin-top:4px;line-height:1.5;">
                      Codes promo et réductions pour les membres.</div>
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- ═══ CTA ═══ -->
          <tr><td style="padding:0 32px 48px;text-align:center;">
            <a href="{browse_url}" style="display:inline-block;
              background:linear-gradient(135deg,{accent},{accent_secondary});color:#ffffff;
              font-size:16px;font-weight:900;text-decoration:none;padding:18px 48px;
              border-radius:20px;box-shadow:0 12px 32px rgba(249,115,22,0.35);
              letter-spacing:0.02em;border:1px solid rgba(255,255,255,0.2);">
              <span style="mso-text-raise:14pt;">🛒 Commencer mes commandes</span>
            </a>
          </td></tr>

        </table>
      </td></tr>

      <!-- ═══ FOOTER ═══ -->
      <tr><td style="padding:48px 16px 32px;text-align:center;">
        <div style="height:2px;background:linear-gradient(90deg,transparent,rgba(15,23,42,0.1),transparent);
          margin:0 auto 28px;max-width:240px;"></div>
        <p style="margin:0 0 8px;font-size:12px;color:#64748b;line-height:1.6;font-weight:600;">
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


def render_welcome_email_text(name: str, email: str) -> str:
    browse_url = _abs_url("/browse")
    return "\n".join([
        "Bienvenue sur YoHa ! 🎉",
        "",
        f"Bonjour {name},",
        "Votre compte a bien été créé. Commandez vos plats, courses de supermarché,",
        "médicaments et plus encore — livrés sur le campus, à l'aile hospitalière ou à la BU.",
        "",
        "• Livraison rapide en 30-45 min",
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
    subject = "Bienvenue sur YoHa 🎉 Votre compte est prêt !"
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