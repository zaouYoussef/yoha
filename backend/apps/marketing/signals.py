import logging
import threading
import time
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import PromoCode
from .services import collect_recipient_emails, build_unsubscribe_url
from .email_promo_html import render_new_promo_email_html, render_new_promo_email_text

logger = logging.getLogger(__name__)

def _send_promo_code_to_all_async(promo_code_id: int):
    # Récupère le code promo de manière sécurisée
    try:
        promo = PromoCode.objects.get(pk=promo_code_id)
    except PromoCode.DoesNotExist:
        return

    # S'assurer qu'il est actif
    if not promo.active:
        return

    recipients = collect_recipient_emails()
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "YouHa <no-reply@yoha.ma>")
    section_map = {
        "all": "sur toute l'application",
        "restaurant": "sur les restaurants",
        "patisserie": "sur les pâtisseries",
        "pharmacy": "sur les pharmacies",
        "parapharmacy": "sur les parapharmacies",
        "supermarket": "sur les supermarchés",
        "shop": "sur les boutiques",
    }
    section_label = section_map.get(promo.section, "sur vos commandes")
    subject = f"🎁 Code Cadeau YouHa : -{promo.discount}% offert sur votre commande !"

    sent = 0
    failed = 0
    delay = getattr(settings, "PROMO_EMAIL_DELAY_SECONDS", 1.0)

    for email in recipients:
        unsub_url = build_unsubscribe_url(email)
        html_content = render_new_promo_email_html(
            code=promo.code,
            discount=promo.discount,
            section_label=section_label,
            unsubscribe_url=unsub_url,
        )
        text_content = render_new_promo_email_text(
            code=promo.code,
            discount=promo.discount,
            section_label=section_label,
            unsubscribe_url=unsub_url,
        )

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            sent += 1
            if delay > 0:
                time.sleep(delay)
        except Exception:
            failed += 1
            logger.exception("failed_to_send_promo_code_email email=%s", email)

    logger.info(
        "promo_code_broadcast_done code=%s sent=%s failed=%s",
        promo.code,
        sent,
        failed,
    )

@receiver(post_save, sender=PromoCode)
def on_promo_code_created(sender, instance, created, **kwargs):
    if created and instance.active:
        # Lancement dans un thread d'arrière-plan pour ne pas bloquer l'admin Django
        t = threading.Thread(target=_send_promo_code_to_all_async, args=(instance.id,))
        t.daemon = True
        t.start()
