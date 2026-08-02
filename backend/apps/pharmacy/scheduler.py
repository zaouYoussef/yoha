"""Planification de la synchronisation des pharmacies de garde.

L'ordonnanceur est partagé (apps.core.scheduler). La page infopoint.ma change
en cours de journée (sections « jour »/« 24h » ajoutées puis retirées, p. ex.
la garde de jour disparaît après 20h). Pour que l'app reflète toujours la
liste officielle, la synchro tourne toutes les `PHARMACY_SCHEDULER_INTERVAL_MINUTES`
minutes (défaut 30) et juste après le démarrage du serveur.
"""
from __future__ import annotations

import logging
import sys
from datetime import datetime

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
        from apscheduler.triggers.interval import IntervalTrigger
    except ImportError:
        return

    interval_minutes = getattr(settings, "PHARMACY_SCHEDULER_INTERVAL_MINUTES", 30)

    scheduler.add_job(
        _run_pharmacy_sync,
        trigger=IntervalTrigger(minutes=interval_minutes),
        id="yoha_pharmacy_duty_sync",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        next_run_time=datetime.now(),
    )
    logger.info(
        "Pharmacies de garde planifiées — toutes les %d min", interval_minutes
    )
