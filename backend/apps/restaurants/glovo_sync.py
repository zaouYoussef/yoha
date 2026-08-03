"""Synchronisation des menus Glovo → restaurants YoHa.

À chaque passe (planifiée toutes les 2 jours, ou sur demande) :

  1. Construit la liste des stores à synchroniser : restaurants de la base
     marqués `glovo_enabled` + configs `GLOVO_STORES` des réglages.
  2. Pour chaque store : récupère le menu complet via l'API Glovo puis fait
     un `update_or_create` des `Restaurant` / `MenuCategory` / `MenuItem` et
     purge les entrées disparues — le menu YoHa devient un miroir exact du
     menu Glovo (nouveautés, prix, promos, photos : tout suit la source).
  3. Journalise chaque passe dans `GlovoSyncLog` (verrou anti-double-course,
     reprise automatique si un log « running » est périmé > 10 min).

En cas d'échec réseau/API, le dernier état connu en base reste servi.
"""
from __future__ import annotations

import logging
import os
import tempfile
import time
from dataclasses import dataclass, field
from datetime import timedelta
from decimal import Decimal
from typing import List, Optional

from django.conf import settings
from django.utils import timezone

from apps.restaurants.glovo import (
    STORE_PAGE_URL,
    GlovoClient,
    GlovoError,
    GlovoScraper,
    GlovoSection,
    discover_store,
)
from apps.restaurants.models import (
    GlovoSyncLog,
    MenuCategory,
    MenuItem,
    MenuItemModifierGroup,
    MenuItemModifierOption,
    Restaurant,
)

logger = logging.getLogger(__name__)

SOURCE = "glovo"
_LOCK_PATH = os.path.join(tempfile.gettempdir(), "yoha_glovo_sync.lock")
_LOCK_TIMEOUT = 600  # 10 min — au-delà, une course est considérée comme perdue
_STALE_LOG_MINUTES = 10


@dataclass
class GlovoStoreConfig:
    slug: str
    store_id: int
    address_id: int
    glovo_slug: str = ""
    name: str = ""
    cuisine: str = "tacos"
    tags: List[str] = field(default_factory=list)
    cover_url: str = ""
    logo_url: str = ""
    description: str = ""
    delivery_time: str = "25-40 min"
    fee_label: str = "Livraison offerte"
    overrides: dict = field(default_factory=dict)
    prune: bool = True
    enabled: bool = True
    opening_hours: dict | None = None
    phone: str = ""


@dataclass
class SyncReport:
    slug: str = ""
    status: str = "ok"
    sections: int = 0
    total_products: int = 0
    created_categories: int = 0
    updated_categories: int = 0
    created_items: int = 0
    updated_items: int = 0
    removed_categories: int = 0
    removed_items: int = 0
    errors: int = 0
    messages: List[str] = field(default_factory=list)

    def summary(self) -> str:
        return (
            f"[glovo] {self.slug} — {self.status} — "
            f"{self.sections} sections, {self.total_products} produits "
            f"(catégories +{self.created_categories}/~{self.updated_categories}/"
            f"-{self.removed_categories}, plats +{self.created_items}/~{self.updated_items}/"
            f"-{self.removed_items}, {self.errors} erreurs)"
        )


# ————————————————————— Verrou anti-double-course —————————————————————

_lock_fd: Optional[int] = None


def _acquire_lock() -> bool:
    """Verrou exclusif (fcntl) — libéré auto si le process meurt (plus d'orphelins)."""
    global _lock_fd
    if _lock_fd is not None:
        return True
    try:
        fd = os.open(_LOCK_PATH, os.O_CREAT | os.O_RDWR, 0o644)
    except OSError:
        logger.exception("glovo_sync_lock_open_failed path=%s", _LOCK_PATH)
        return False

    try:
        import fcntl

        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        os.close(fd)
        holder = _lock_holder_pid()
        logger.warning(
            "glovo_sync_lock_busy path=%s holder_pid=%s",
            _LOCK_PATH,
            holder or "?",
        )
        return False
    except OSError:
        # Fallback Windows / FS sans flock : O_EXCL + PID + stale
        os.close(fd)
        return _acquire_lock_fallback()

    try:
        os.ftruncate(fd, 0)
        os.write(fd, f"{os.getpid()}\n".encode())
        os.fsync(fd)
    except OSError:
        pass
    _lock_fd = fd
    return True


def _lock_holder_pid() -> Optional[int]:
    try:
        with open(_LOCK_PATH, "r", encoding="utf-8") as fh:
            raw = (fh.readline() or "").strip()
        return int(raw) if raw.isdigit() else None
    except (OSError, ValueError):
        return None


def _pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except OSError:
        return False


def _acquire_lock_fallback() -> bool:
    """Fallback O_EXCL + PID (si flock indisponible)."""
    global _lock_fd
    try:
        fd = os.open(_LOCK_PATH, os.O_CREAT | os.O_EXCL | os.O_RDWR, 0o644)
        os.write(fd, f"{os.getpid()}\n".encode())
        _lock_fd = fd
        return True
    except FileExistsError:
        holder = _lock_holder_pid()
        try:
            age = time.time() - os.path.getmtime(_LOCK_PATH)
        except OSError:
            age = _LOCK_TIMEOUT + 1
        stale = age > _LOCK_TIMEOUT or (holder is not None and not _pid_alive(holder))
        if not stale:
            return False
        try:
            os.unlink(_LOCK_PATH)
        except OSError:
            return False
        try:
            fd = os.open(_LOCK_PATH, os.O_CREAT | os.O_EXCL | os.O_RDWR, 0o644)
            os.write(fd, f"{os.getpid()}\n".encode())
            _lock_fd = fd
            return True
        except (OSError, FileExistsError):
            return False
    except OSError:
        return False


def _release_lock() -> None:
    global _lock_fd
    fd = _lock_fd
    _lock_fd = None
    if fd is not None:
        try:
            import fcntl

            fcntl.flock(fd, fcntl.LOCK_UN)
        except OSError:
            pass
        try:
            os.close(fd)
        except OSError:
            pass
    try:
        os.unlink(_LOCK_PATH)
    except OSError:
        pass


def _recover_stale_logs() -> None:
    """Marque en erreur les courses « running » orphelines (> 10 min)."""
    stale = GlovoSyncLog.objects.filter(
        status=GlovoSyncLog.Status.RUNNING,
        started_at__lt=timezone.now() - timedelta(minutes=_STALE_LOG_MINUTES),
    )
    for log in stale:
        log.status = GlovoSyncLog.Status.ERROR
        log.finished_at = timezone.now()
        log.error = "Course abandonnée (dépassée > 10 min) — reprise."
        log.save(update_fields=["status", "finished_at", "error"])


# ————————————————————— Construction des cibles —————————————————————

def _config_from_dict(slug: str, base: dict, recipe: dict, db: dict) -> GlovoStoreConfig:
    merged = {**base, **{k: v for k, v in db.items() if v not in (None, "", [])}, **recipe}
    return GlovoStoreConfig(
        slug=slug,
        store_id=merged.get("store_id"),
        address_id=merged.get("address_id"),
        glovo_slug=merged.get("glovo_slug", slug),
        name=merged.get("name", slug.replace("-", " ").title()),
        cuisine=merged.get("cuisine", "tacos"),
        tags=merged.get("tags", []),
        cover_url=merged.get("cover_url", ""),
        logo_url=merged.get("logo_url", ""),
        description=merged.get("description", ""),
        delivery_time=merged.get("delivery_time", ""),
        fee_label=merged.get("fee_label", "Livraison offerte"),
        overrides=merged.get("overrides", {}),
        prune=merged.get("prune", True),
        enabled=merged.get("enabled", True),
        opening_hours=merged.get("opening_hours"),
        phone=merged.get("phone", "") or "",
    )


def build_sync_targets() -> List[GlovoStoreConfig]:
    """Cibles : restaurants `glovo_enabled` en base, puis configs `GLOVO_STORES`."""
    stores = {c["slug"]: c for c in getattr(settings, "GLOVO_STORES", [])}
    recipes = getattr(settings, "GLOVO_STORE_CONFIGS", {})

    targets: List[GlovoStoreConfig] = []
    seen: set[str] = set()

    for r in Restaurant.objects.filter(glovo_enabled=True).exclude(glovo_store_id__isnull=True):
        db = {
            "store_id": r.glovo_store_id,
            "address_id": r.glovo_address_id,
            "glovo_slug": r.glovo_slug or "",
            "name": r.name or "",
            "cuisine": r.cuisine or "",
            "tags": r.tags or [],
            "cover_url": r.cover_url or "",
            "logo_url": r.logo_url or "",
            "description": r.description or "",
            "delivery_time": r.delivery_time or "",
            "fee_label": r.fee_label or "",
        }
        targets.append(_config_from_dict(r.slug, stores.get(r.slug, {}), recipes.get(r.slug, {}), db))
        seen.add(r.slug)

    for slug, base in stores.items():
        if slug in seen or not base.get("enabled", True):
            continue
        targets.append(_config_from_dict(slug, base, recipes.get(slug, {}), {}))

    return targets


# ————————————————————— Synchronisation —————————————————————

def _client(store: GlovoStoreConfig) -> GlovoScraper:
    return GlovoScraper(
        slug=store.glovo_slug or store.slug,
        country_code=getattr(settings, "GLOVO_COUNTRY_CODE", "ma"),
        city_slug=getattr(settings, "GLOVO_CITY_SLUG", "tanger"),
        language=getattr(settings, "GLOVO_LANGUAGE", "fr"),
    )


def _client_api(store: GlovoStoreConfig, store_id: int, address_id: int) -> GlovoClient:
    return GlovoClient(
        store_id=store_id,
        address_id=address_id,
        city_code=getattr(settings, "GLOVO_CITY_CODE", "TAN"),
        country_code=getattr(settings, "GLOVO_COUNTRY_CODE", "ma"),
        latitude=getattr(settings, "GLOVO_LATITUDE", 35.7595),
        longitude=getattr(settings, "GLOVO_LONGITUDE", -5.8340),
        language=getattr(settings, "GLOVO_LANGUAGE", "fr"),
    )


def _fetch_menu(store: GlovoStoreConfig) -> List[GlovoSection]:
    """Menu du store : API Glovo d'abord, page HTML en secours.

    Depuis août 2026 Glovo ne sert plus le menu dans le HTML public (rendu
    côté client, plus de `initialStoreContent`) : l'API est la source fiable.
    Le scrap HTML reste un secours si les ids API manquent ou si l'API échoue.

    Dans les deux cas, les sauces/tailles/extras sont enrichis via le détail
    produit (`/products/{id}`) car la liste omet souvent `attributeGroups`.
    """
    sections: List[GlovoSection]
    if store.store_id and store.address_id:
        try:
            sections = _client_api(store, store.store_id, store.address_id).fetch_full_menu()
            return sections
        except GlovoError as exc:
            logger.info("glovo_api_failed %s — %s ; fallback HTML", store.slug, exc)
    sections = _client(store).fetch_full_menu()
    if store.store_id and store.address_id:
        try:
            api = _client_api(store, store.store_id, store.address_id)
            n = api.enrich_sections_modifiers(sections)
            if n:
                logger.info("glovo_modifiers_enriched_html_fallback store=%s n=%d", store.slug, n)
        except Exception:  # noqa: BLE001
            logger.exception("glovo_modifiers_enrich_html_failed %s", store.slug)
    return sections


def _sync_store_profile(restaurant: Restaurant, store: GlovoStoreConfig) -> None:
    """Téléphone + horaires (config GLOVO_STORES / profil Glovo / OSM)."""
    from apps.restaurants.opening_hours import normalize_opening_hours

    fields: dict = {}
    if store.opening_hours:
        fields["opening_hours"] = normalize_opening_hours(store.opening_hours)
    if store.phone:
        fields["phone"] = store.phone[:30]

    profile = None
    if store.store_id:
        try:
            api = _client_api(store, store.store_id, store.address_id or 0)
            profile = api.fetch_store_profile()
        except GlovoError as exc:
            logger.info("glovo_store_profile_failed %s — %s", store.slug, exc)

    if profile:
        if profile.phone and "phone" not in fields:
            fields["phone"] = profile.phone[:30]
        if profile.address and not (restaurant.description or "").strip():
            fields["description"] = f"{profile.name or restaurant.name} — {profile.address}"[:500]
        if "opening_hours" not in fields and profile.latitude is not None and profile.longitude is not None:
            try:
                from apps.restaurants.opening_hours import fetch_osm_opening_hours

                hours = fetch_osm_opening_hours(
                    profile.latitude,
                    profile.longitude,
                    name=profile.name or restaurant.name,
                )
                if hours:
                    fields["opening_hours"] = hours
            except Exception:  # noqa: BLE001
                logger.exception("osm_hours_failed %s", store.slug)

    if fields:
        Restaurant.objects.filter(pk=restaurant.pk).update(**fields)
        restaurant.refresh_from_db()


def _fill_store_images(store: GlovoStoreConfig) -> None:
    """Best effort : cover/logo découverts depuis la page store si absents."""
    if (store.cover_url and store.logo_url) or not store.glovo_slug:
        return
    try:
        info = discover_store(
            store.glovo_slug,
            city_code=getattr(settings, "GLOVO_CITY_CODE", "TAN"),
            city_slug=getattr(settings, "GLOVO_CITY_SLUG", "tanger"),
            country_code=getattr(settings, "GLOVO_COUNTRY_CODE", "ma"),
            language=getattr(settings, "GLOVO_LANGUAGE", "fr"),
        )
    except GlovoError:
        return
    store.cover_url = store.cover_url or info.cover_url
    store.logo_url = store.logo_url or info.logo_url


def _get_or_create_restaurant(store: GlovoStoreConfig) -> Restaurant:
    defaults = {
        "name": store.name or store.slug.replace("-", " ").title(),
        "cuisine": store.cuisine,
        "tags": store.tags,
        "cover_url": store.cover_url,
        "logo_url": store.logo_url,
        "description": store.description,
        "delivery_time": store.delivery_time,
        "fee_label": store.fee_label,
        "glovo_store_id": store.store_id,
        "glovo_address_id": store.address_id,
        "glovo_slug": store.glovo_slug,
        "glovo_enabled": True,
        "is_active": True,
    }
    restaurant, created = Restaurant.objects.get_or_create(slug=store.slug, defaults=defaults)
    if created:
        return restaurant

    fields: dict = {"glovo_store_id": store.store_id, "glovo_address_id": store.address_id,
                    "glovo_slug": store.glovo_slug or restaurant.glovo_slug, "glovo_enabled": True}
    if store.name:
        fields["name"] = store.name
    if store.tags:
        fields["tags"] = store.tags
    if store.cover_url:
        fields["cover_url"] = store.cover_url
    if store.logo_url:
        fields["logo_url"] = store.logo_url
    if store.description:
        fields["description"] = store.description
    if store.delivery_time:
        fields["delivery_time"] = store.delivery_time
    if store.fee_label:
        fields["fee_label"] = store.fee_label
    Restaurant.objects.filter(pk=restaurant.pk).update(**fields)
    restaurant.refresh_from_db()
    return restaurant


def _apply_menu(restaurant: Restaurant, store: GlovoStoreConfig, sections: List[GlovoSection], report: SyncReport) -> None:
    keep_cat_ids: set[int] = set()
    keep_item_ids: set[int] = set()

    for cat_order, section in enumerate(sections):
        if not section.products:
            continue
        cat_name = (store.overrides.get(section.title) or section.title).strip()
        if not cat_name:
            continue
        cat, created = MenuCategory.objects.update_or_create(
            restaurant=restaurant,
            name=cat_name[:120],
            defaults={"sort_order": cat_order},
        )
        if created:
            report.created_categories += 1
        else:
            report.updated_categories += 1
        keep_cat_ids.add(cat.pk)

        for item_order, product in enumerate(section.products):
            item, created = MenuItem.objects.update_or_create(
                restaurant=restaurant,
                external_id=product.external_id[:40],
                defaults={
                    "category": cat,
                    "name": product.name[:200],
                    "description": product.description[:300],
                    "ingredients": product.description,
                    "price_mad": Decimal(str(product.price_mad)),
                    "image_url": (product.image_url or "")[:500],
                    "is_available": not product.out_of_stock,
                    "sort_order": item_order,
                },
            )
            if created:
                report.created_items += 1
            else:
                report.updated_items += 1
            keep_item_ids.add(item.pk)
            _apply_modifiers(item, product)

    if store.prune:
        removed_cats = MenuCategory.objects.filter(restaurant=restaurant).exclude(pk__in=keep_cat_ids)
        report.removed_categories = removed_cats.count()
        removed_cats.delete()
        removed_items = MenuItem.objects.filter(restaurant=restaurant).exclude(pk__in=keep_item_ids)
        report.removed_items = removed_items.count()
        removed_items.delete()
        # Catégories vides (créées par d'anciennes passes avec des sections sans produits)
        empty_cats = MenuCategory.objects.filter(restaurant=restaurant, items__isnull=True)
        if empty_cats.exists():
            report.removed_categories += empty_cats.count()
            empty_cats.delete()


def _apply_modifiers(item: MenuItem, product: GlovoProduct) -> None:
    """Upsert des groupes d'options (tailles, sauces, extras…) du produit."""
    if getattr(item, "modifiers_manual", False):
        # Éditions panel restaurant : ne pas écraser sauces/suppléments
        return
    keep_group_ids: set[int] = set()
    for group_order, group in enumerate(product.modifier_groups):
        grp, _ = MenuItemModifierGroup.objects.update_or_create(
            menu_item=item,
            name=group.name[:120],
            defaults={
                "min_selected": min(int(group.min_selected), 99),
                "max_selected": min(max(int(group.max_selected), 0), 99),
                "sort_order": group_order,
            },
        )
        keep_group_ids.add(grp.pk)
        keep_option_ids: set[int] = set()
        for option_order, option in enumerate(group.options):
            opt, _ = MenuItemModifierOption.objects.update_or_create(
                group=grp,
                name=option.name[:120],
                defaults={
                    "external_id": option.external_id[:40],
                    "price_impact": Decimal(str(option.price_impact)),
                    "sort_order": option_order,
                },
            )
            keep_option_ids.add(opt.pk)
        MenuItemModifierOption.objects.filter(group=grp).exclude(pk__in=keep_option_ids).delete()
    MenuItemModifierGroup.objects.filter(menu_item=item).exclude(pk__in=keep_group_ids).delete()


def _finish_log(log: GlovoSyncLog, report: SyncReport) -> None:
    valid = {GlovoSyncLog.Status.OK, GlovoSyncLog.Status.ERROR,
             GlovoSyncLog.Status.UP_TO_DATE, GlovoSyncLog.Status.DISABLED}
    log.status = report.status if report.status in valid else GlovoSyncLog.Status.ERROR
    log.finished_at = timezone.now()
    log.stats = {
        "sections": report.sections,
        "total_products": report.total_products,
        "created_categories": report.created_categories,
        "updated_categories": report.updated_categories,
        "created_items": report.created_items,
        "updated_items": report.updated_items,
        "removed_categories": report.removed_categories,
        "removed_items": report.removed_items,
    }
    log.error = "\n".join(report.messages[:5])
    log.save(update_fields=["status", "finished_at", "stats", "error"])


def sync_glovo_menu(store: GlovoStoreConfig, *, dry_run: bool = False, force: bool = False) -> SyncReport:
    """Synchronise le menu d'un store (mode réel ou dry-run)."""
    report = SyncReport(slug=store.slug)

    if not getattr(settings, "GLOVO_SYNC_ENABLED", True) or not store.enabled:
        report.status = GlovoSyncLog.Status.DISABLED
        report.messages.append("synchro Glovo désactivée (GLOVO_SYNC_ENABLED=False ou store désactivé)")
        return report
    if not store.store_id or not store.address_id:
        report.status = "error"
        report.errors += 1
        report.messages.append("store_id/address_id manquants — lancez la découverte")
        return report

    _fill_store_images(store)
    restaurant: Optional[Restaurant] = None
    if not dry_run:
        restaurant = _get_or_create_restaurant(store)
        if not force and restaurant.glovo_synced_at:
            interval = getattr(settings, "GLOVO_SYNC_INTERVAL_DAYS", 2)
            if restaurant.glovo_synced_at > timezone.now() - timedelta(days=interval):
                report.status = "up_to_date"
                report.messages.append(
                    f"déjà synchronisé le {restaurant.glovo_synced_at:%Y-%m-%d %H:%M} (< {interval} j)"
                )
                return report

    log: Optional[GlovoSyncLog] = None
    if not dry_run and restaurant is not None:
        log = GlovoSyncLog.objects.create(
            restaurant=restaurant,
            slug=store.slug,
            started_at=timezone.now(),
            dry_run=False,
        )

    try:
        sections = _fetch_menu(store)
    except GlovoError as exc:
        report.status = "error"
        report.errors += 1
        report.messages.append(f"récupération menu : {exc}")
        if log:
            _finish_log(log, report)
        return report

    report.sections = len(sections)
    report.total_products = sum(len(s.products) for s in sections)
    _log_fetch(store, sections)

    if dry_run:
        for section in sections:
            report.messages.append(f"section « {section.title} » : {len(section.products)} produits")
        return report

    try:
        _apply_menu(restaurant, store, sections, report)
        _sync_store_profile(restaurant, store)
        Restaurant.objects.filter(pk=restaurant.pk).update(
            glovo_synced_at=timezone.now(),
            glovo_enabled=True,
        )
    except Exception as exc:  # noqa: BLE001 — une passe ne doit pas planter le lot
        report.status = "error"
        report.errors += 1
        report.messages.append(f"écriture base : {exc}")
        logger.exception("glovo_apply_failed %s", store.slug)

    if log:
        _finish_log(log, report)
    return report


def sync_all_glovo(*, dry_run: bool = False, force: bool = False, slug: Optional[str] = None) -> List[SyncReport]:
    """Synchronise tous les stores Glovo (verrou + récupération des logs orphelins)."""
    if not getattr(settings, "GLOVO_SYNC_ENABLED", True):
        logger.warning("glovo_sync_disabled — GLOVO_SYNC_ENABLED=False")
        return []

    _recover_stale_logs()
    if not _acquire_lock():
        logger.warning("glovo_sync_lock_busy — une passe est déjà en cours")
        return [SyncReport(slug=slug or "*", status="skipped", messages=["verrou occupé"])]

    try:
        targets = build_sync_targets()
        if slug:
            targets = [t for t in targets if t.slug == slug]
        reports = []
        delay = getattr(settings, "GLOVO_REQUEST_DELAY", 2.0)
        for index, target in enumerate(targets):
            reports.append(sync_glovo_menu(target, dry_run=dry_run, force=force))
            if index < len(targets) - 1 and delay > 0:
                time.sleep(delay)
        for r in reports:
            logger.info(r.summary())
        return reports
    finally:
        _release_lock()


def _log_fetch(store: GlovoStoreConfig, sections: List[GlovoSection]) -> None:
    url = STORE_PAGE_URL.format(
        country=getattr(settings, "GLOVO_COUNTRY_CODE", "ma"),
        lang=getattr(settings, "GLOVO_LANGUAGE", "fr"),
        city=getattr(settings, "GLOVO_CITY_SLUG", "tanger"),
        slug=store.glovo_slug or store.slug,
    )
    logger.info("glovo_fetch url=%s store=%s sections=%d", url, store.slug, len(sections))
    for section in sections:
        logger.info("  glovo_section store=%s « %s » %d produits", store.slug, section.title, len(section.products))

