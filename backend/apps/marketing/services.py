"""Campagnes e-mail promo automatiques (2× / semaine, rotation menus)."""
from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.core.signing import TimestampSigner
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from apps.orders.models import Order
from apps.restaurants.models import MenuItem, Restaurant

from .email_promo_html import render_promo_email_html, render_promo_email_text
from .models import EmailUnsubscribe, PromoCampaignState, PromoEmailLog

User = get_user_model()
logger = logging.getLogger(__name__)
_unsub_signer = TimestampSigner(salt="yoha-marketing-unsub")


def make_campaign_key(when=None) -> str:
    when = when or timezone.now()
    # Deux campagnes par semaine : lun–mer vs jeu–dim
    half = "A" if when.weekday() < 3 else "B"
    iso = when.isocalendar()
    return f"{iso.year}-W{iso.week:02d}-{half}"


def build_unsubscribe_url(email: str) -> str:
    token = _unsub_signer.sign(email.lower())
    base = getattr(settings, "YOHA_FRONTEND_URL", "http://localhost:3002").rstrip("/")
    return f"{base}/api/v1/marketing/unsubscribe/?token={token}"


def unsubscribe_email(token: str) -> bool:
    try:
        email = _unsub_signer.unsign(token, max_age=60 * 60 * 24 * 365 * 5)
    except Exception:
        return False
    EmailUnsubscribe.objects.get_or_create(email=email.lower())
    return True


def collect_recipient_emails() -> list[str]:
    blocked = set(EmailUnsubscribe.objects.values_list("email", flat=True))
    emails: set[str] = set()

    for raw in User.objects.filter(is_active=True, role=User.Role.CLIENT).values_list("email", flat=True):
        if raw:
            emails.add(raw.strip().lower())

    for raw in Order.objects.exclude(Q(customer_email="") | Q(customer_email__isnull=True)).values_list(
        "customer_email", flat=True
    ):
        if raw:
            emails.add(raw.strip().lower())

    return sorted(e for e in emails if e and e not in blocked)


def pick_featured_restaurant(rotation_index: int) -> Restaurant:
    restaurants = list(Restaurant.objects.filter(is_active=True).order_by("slug"))
    if not restaurants:
        raise ValueError("Aucun restaurant actif.")
    return restaurants[rotation_index % len(restaurants)]


def pick_featured_items(restaurant: Restaurant, limit: int = 3) -> list[dict]:
    items = (
        MenuItem.objects.filter(restaurant=restaurant, is_available=True)
        .order_by("sort_order", "id")[:limit]
    )
    return [
        {
            "name": it.name,
            "desc": it.description,
            "price": f"{it.price_mad:.2f}".replace(".", ","),
            "img": it.image_url or "",
        }
        for it in items
    ]


def build_promo_context(*, restaurant: Restaurant, campaign_key: str) -> dict:
    others = (
        Restaurant.objects.filter(is_active=True)
        .exclude(pk=restaurant.pk)
        .order_by("name")[:4]
    )
    return {
        "title": f"Cette semaine : {restaurant.name}",
        "campaign_key": campaign_key,
        "hero": {
            "name": restaurant.name,
            "slug": restaurant.slug,
            "promo": restaurant.promo_label or "Livraison offerte campus",
            "cover": restaurant.cover_url or restaurant.logo_url or "",
            "eta": "15–20 min",
        },
        "featured_items": pick_featured_items(restaurant),
        "other_offers": [
            {
                "name": r.name,
                "slug": r.slug,
                "promo": r.promo_label or "Livraison offerte",
                "cover": r.cover_url or r.logo_url or "",
            }
            for r in others
        ],
    }


def should_run_campaign(*, force: bool = False) -> tuple[bool, str]:
    if force:
        return True, "forcé"
    state = PromoCampaignState.singleton()
    if not state.last_run_at:
        return True, "première campagne"
    min_days = getattr(settings, "PROMO_CAMPAIGN_MIN_DAYS", 2)
    delta = timezone.now() - state.last_run_at
    if delta >= timedelta(days=min_days):
        return True, f"dernière campagne il y a {delta.days} j"
    return False, f"trop tôt (min {min_days} j entre envois)"


def run_promo_campaign(*, force: bool = False, dry_run: bool = False) -> dict:
    ok, reason = should_run_campaign(force=force)
    if not ok:
        return {"skipped": True, "reason": reason, "sent": 0}

    campaign_key = make_campaign_key()
    state = PromoCampaignState.singleton()

    if state.last_campaign_key == campaign_key and not force:
        return {"skipped": True, "reason": f"campagne {campaign_key} déjà envoyée", "sent": 0}

    restaurant = pick_featured_restaurant(state.rotation_index)
    base_ctx = build_promo_context(restaurant=restaurant, campaign_key=campaign_key)
    recipients = collect_recipient_emails()

    if dry_run:
        return {
            "skipped": False,
            "dry_run": True,
            "campaign_key": campaign_key,
            "restaurant": restaurant.slug,
            "recipients": len(recipients),
            "sample": recipients[:5],
        }

    sent = 0
    failed = 0
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "YouHa <no-reply@yoha.ma>")
    subject = f"🍽️ {base_ctx['title']} · YouHa"

    for email in recipients:
        try:
            with transaction.atomic():
                PromoEmailLog.objects.create(
                    email=email,
                    campaign_key=campaign_key,
                    restaurant_slug=restaurant.slug,
                )
        except IntegrityError:
            # Déjà traité/envoyé par un autre worker
            continue

        ctx = {**base_ctx, "unsubscribe_url": build_unsubscribe_url(email)}
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=render_promo_email_text(ctx),
                from_email=from_email,
                to=[email],
            )
            msg.attach_alternative(render_promo_email_html(ctx), "text/html")
            msg.send(fail_silently=False)
            sent += 1
        except Exception:
            failed += 1
            logger.exception("promo_email_failed to=%s", email)

    state.rotation_index = (state.rotation_index + 1) % max(
        Restaurant.objects.filter(is_active=True).count(), 1
    )
    state.last_run_at = timezone.now()
    state.last_campaign_key = campaign_key
    state.last_restaurant_slug = restaurant.slug
    state.save(
        update_fields=[
            "rotation_index",
            "last_run_at",
            "last_campaign_key",
            "last_restaurant_slug",
        ]
    )

    logger.info(
        "promo_campaign_done key=%s restaurant=%s sent=%s failed=%s",
        campaign_key,
        restaurant.slug,
        sent,
        failed,
    )
    return {
        "skipped": False,
        "campaign_key": campaign_key,
        "restaurant": restaurant.slug,
        "sent": sent,
        "failed": failed,
        "recipients": len(recipients),
    }
