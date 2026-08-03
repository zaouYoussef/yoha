"""Planification de la synchronisation des menus Glovo.

L'ordonnanceur est partagé (apps.core.scheduler). Un seul worker gunicorn
prend le lead (verrou fcntl) pour éviter N synchros parallèles. Les commandes
`manage.py` (hors runserver) ne démarrent PAS le scheduler — sinon un
`sync_glovo_menu --force` se faisait bloquer par le job immédiat du ready().
"""
from __future__ import annotations

import logging
import os
import sys
import tempfile
from datetime import datetime, timedelta

from django.conf import settings

logger = logging.getLogger(__name__)

_LEADER_PATH = os.path.join(tempfile.gettempdir(), "yoha_glovo_scheduler.leader")
_leader_fd = None


def _run_glovo_sync():
    if not getattr(settings, "GLOVO_SYNC_ENABLED", False):
        return
    from apps.restaurants.glovo_sync import sync_all_glovo

    try:
        sync_all_glovo()
    except Exception:  # noqa: BLE001 — la synchro ne doit pas tuer le scheduler
        logger.exception("glovo_scheduler_failed")


def _should_start_scheduler() -> bool:
    """Évite de lancer APScheduler depuis manage.py sync / shell / migrate…"""
    argv0 = os.path.basename(sys.argv[0] if sys.argv else "")
    if argv0 in {"manage.py", "django-admin"} or argv0.endswith("-manage.py"):
        cmd = sys.argv[1] if len(sys.argv) > 1 else ""
        if cmd and cmd != "runserver":
            return False
    return True


def _claim_scheduler_leader() -> bool:
    """Un seul process (worker) enregistre le job Glovo."""
    global _leader_fd
    if _leader_fd is not None:
        return True
    try:
        fd = os.open(_LEADER_PATH, os.O_CREAT | os.O_RDWR, 0o644)
        import fcntl

        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        os.ftruncate(fd, 0)
        os.write(fd, f"{os.getpid()}\n".encode())
        _leader_fd = fd
        return True
    except (BlockingIOError, OSError):
        try:
            os.close(fd)  # type: ignore[name-defined]
        except Exception:  # noqa: BLE001
            pass
        return False


def start_glovo_scheduler():
    if not getattr(settings, "GLOVO_SYNC_ENABLED", False):
        return
    if not _should_start_scheduler():
        return

    from apps.core.scheduler import ensure_scheduler, get_scheduler

    if get_scheduler() is None and "runserver" in sys.argv:
        ensure_scheduler()
    scheduler = ensure_scheduler()
    if scheduler is None:
        return

    if not _claim_scheduler_leader():
        logger.info("Menus Glovo — scheduler déjà actif dans un autre worker")
        return

    try:
        from apscheduler.triggers.interval import IntervalTrigger
    except ImportError:
        logger.warning("APScheduler absent — planification Glovo indisponible")
        return

    interval_days = getattr(settings, "GLOVO_SYNC_INTERVAL_DAYS", 2)
    # Ne PAS lancer immédiatement : ça volait le verrou à sync_glovo_menu --force
    # et aux autres workers au boot. Premier run après GLOVO_NEXT_RUN_MINUTES.
    delay_minutes = max(1, int(getattr(settings, "GLOVO_NEXT_RUN_MINUTES", 60)))
    next_run = datetime.now() + timedelta(minutes=delay_minutes)

    scheduler.add_job(
        _run_glovo_sync,
        trigger=IntervalTrigger(days=interval_days),
        id="yoha_glovo_menu_sync",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        next_run_time=next_run,
    )
    logger.info(
        "Menus Glovo planifiés — toutes les %d jours (1er run dans %d min)",
        interval_days,
        delay_minutes,
    )
