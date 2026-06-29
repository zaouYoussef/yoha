"""Test envoi e-mail YoHa — python manage.py test_email [destinataire]"""
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand

from apps.orders.email_content import build_context
from apps.orders.email_html import render_order_email_html, render_order_email_text
from apps.orders.models import Order


class Command(BaseCommand):
    help = "Envoie un e-mail de test SMTP (template HTML YoHa)"

    def add_arguments(self, parser):
        parser.add_argument(
            "recipient",
            nargs="?",
            default="zaoujalyoussef3@gmail.com",
            help="Adresse destinataire",
        )

    def handle(self, *args, **options):
        to = options["recipient"].strip()
        self.stdout.write(f"Backend: {settings.EMAIL_BACKEND}")
        self.stdout.write(f"Host: {settings.EMAIL_HOST}:{getattr(settings, 'EMAIL_PORT', '')}")
        self.stdout.write(f"To: {to}")

        order = (
            Order.objects.select_related("restaurant", "courier")
            .prefetch_related("lines")
            .order_by("-created_at")
            .first()
        )
        if not order:
            self.stderr.write(self.style.ERROR("Aucune commande en base pour le preview."))
            raise SystemExit(1)

        ctx = build_context(order, Order.Status.DELIVERING)
        if not ctx:
            raise SystemExit(1)

        html = render_order_email_html(ctx)
        text = render_order_email_text(ctx)

        try:
            msg = EmailMultiAlternatives(
                subject=f"[TEST] {ctx['subject']}",
                body=text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[to],
            )
            msg.attach_alternative(html, "text/html")
            msg.send(fail_silently=False)
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Échec: {exc}"))
            raise SystemExit(1) from exc

        self.stdout.write(self.style.SUCCESS(f"Template HTML envoyé à {to} — vérifiez inbox & spams."))
