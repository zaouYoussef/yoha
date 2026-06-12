"""Planification campagnes promo — lundi & jeudi 10h."""
from __future__ import annotations

import logging
import sys

from django.conf import settings

logger = logging.getLogger(__name__)


def _run_promo_job():
    if not getattr(settings, "PROMO_SCHEDULER_ENABLED", False):
        return
    from .services import run_promo_campaign

    try:
        result = run_promo_campaign(force=False)
        logger.info("promo_scheduler_result %s", result)
    except Exception:
        logger.exception("promo_scheduler_failed")


def start_promo_scheduler():
    if not getattr(settings, "PROMO_SCHEDULER_ENABLED", False):
        return

    from apps.core.scheduler import ensure_scheduler, get_scheduler

    if get_scheduler() is None and "runserver" in sys.argv:
        ensure_scheduler()
    scheduler = ensure_scheduler()
    if scheduler is None:
        return

    try:
        from apscheduler.triggers.cron import CronTrigger
    except ImportError:
        return

    tz = settings.PROMO_SCHEDULER_TIMEZONE
    hour = settings.PROMO_SCHEDULER_HOUR
    minute = settings.PROMO_SCHEDULER_MINUTE

    scheduler.add_job(
        _run_promo_job,
        trigger=CronTrigger(day_of_week="mon,thu", hour=hour, minute=minute, timezone=tz),
        id="yoha_promo_campaign",
        replace_existing=True,
        max_instances=1,
    )
    logger.info("Campagnes promo planifiées — lun/jeu %s:%02d (%s)", hour, minute, tz)
