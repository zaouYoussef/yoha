"""Planification de la synchronisation quotidienne des pharmacies de garde.

L'ordonnanceur est partagé (apps.core.scheduler). Exécution quotidienne
à 12:00 (heure de Casablanca) — la source infopoint.ma met à jour ses gardes
en début d'après-midi.
"""
from __future__ import annotations

import logging
import sys

from django.conf import settings

logger = logging.getLogger(__name__)


def _run_pharmacy_sync():
    if not getattr(settings, "PHARMACY_SCHEDULER_ENABLED", False):
        return
    from apps.pharmacy.scrapers.infopoint import InfopointScraper, ScrapeError
    from apps.pharmacy.services.pharmacy_sync import sync_pharmacies

    try:
        data = InfopointScraper().scrape()
    except ScrapeError as exc:
        logger.error("pharmacy_sync_scraper_failed %s", exc)
        return

    report = sync_pharmacies(data)
    logger.info("pharmacy_scheduler_result %s", report.summary())


def start_pharmacy_scheduler():
    if not getattr(settings, "PHARMACY_SCHEDULER_ENABLED", False):
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

    tz = getattr(settings, "PROMO_SCHEDULER_TIMEZONE", "Africa/Casablanca")
    hour = getattr(settings, "PHARMACY_SCHEDULER_HOUR", 12)
    minute = getattr(settings, "PHARMACY_SCHEDULER_MINUTE", 0)

    scheduler.add_job(
        _run_pharmacy_sync,
        trigger=CronTrigger(hour=hour, minute=minute, timezone=tz),
        id="yoha_pharmacy_duty_sync",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    logger.info("Pharmacies de garde planifiées — %02d:%02d (%s)", hour, minute, tz)
