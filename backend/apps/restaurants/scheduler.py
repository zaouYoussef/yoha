"""Planification de la synchronisation des menus Glovo (toutes les 2 jours).

L'ordonnanceur est partagé (apps.core.scheduler). Le menu Glovo change
régulièrement (nouveautés, prix, promos, photos) : pour que l'app reflète
toujours la source, la synchro tourne toutes les `GLOVO_SYNC_INTERVAL_DAYS`
jours (défaut 2) et juste après le démarrage du serveur si la base est vide.
"""
from __future__ import annotations

import logging
import sys
from datetime import datetime

from django.conf import settings

logger = logging.getLogger(__name__)


def _run_glovo_sync():
    if not getattr(settings, "GLOVO_SYNC_ENABLED", False):
        return
    from apps.restaurants.glovo_sync import sync_all_glovo

    try:
        sync_all_glovo()
    except Exception:  # noqa: BLE001 — la synchro ne doit pas tuer le scheduler
        logger.exception("glovo_scheduler_failed")


def start_glovo_scheduler():
    if not getattr(settings, "GLOVO_SYNC_ENABLED", False):
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
        logger.warning("APScheduler absent — planification Glovo indisponible")
        return

    interval_days = getattr(settings, "GLOVO_SYNC_INTERVAL_DAYS", 2)

    scheduler.add_job(
        _run_glovo_sync,
        trigger=IntervalTrigger(days=interval_days),
        id="yoha_glovo_menu_sync",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        next_run_time=datetime.now(),
    )
    logger.info("Menus Glovo planifiés — toutes les %d jours", interval_days)
