"""Scheduler APScheduler partagé (commandes, campagnes promo)."""
from __future__ import annotations

import logging
import os
import sys

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)
_scheduler = None


def get_scheduler():
    return _scheduler


def ensure_scheduler():
    """Démarre le scheduler une seule fois (runserver, gunicorn)."""
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    if "runserver" in sys.argv and os.environ.get("RUN_MAIN") != "true":
        return None

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
    except ImportError:
        logger.warning("APScheduler absent — planification différée indisponible.")
        return None

    tz = getattr(settings, "PROMO_SCHEDULER_TIMEZONE", "Africa/Casablanca")
    _scheduler = BackgroundScheduler(timezone=tz)
    _scheduler.start()
    logger.info("YouHa scheduler démarré (%s)", tz)
    return _scheduler


def schedule_once(*, job_id: str, func, delay_seconds: int, args=None):
    """Exécute `func` une fois après `delay_seconds`."""
    from datetime import timedelta

    scheduler = ensure_scheduler()
    if scheduler is None:
        # Fallback thread si pas de scheduler (ex. manage.py shell)
        import threading

        threading.Timer(max(1, delay_seconds), func, args=args or []).start()
        return

    run_date = timezone.now() + timedelta(seconds=delay_seconds)
    scheduler.add_job(
        func,
        trigger="date",
        run_date=run_date,
        id=job_id,
        replace_existing=True,
        args=args or [],
        max_instances=1,
    )
