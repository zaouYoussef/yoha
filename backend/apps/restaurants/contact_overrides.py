"""Overrides contacts restos (tél / horaires / adresse) — prioritaire sur Glovo."""

from __future__ import annotations

import json
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent / "data" / "restaurant_contact_overrides.json"

_cache: dict | None = None


def load_contact_overrides(*, force: bool = False) -> dict:
    global _cache
    if _cache is not None and not force:
        return _cache
    if not DATA_FILE.exists():
        _cache = {}
        return _cache
    payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    _cache = payload.get("restaurants") or {}
    return _cache


def get_contact_override(slug: str) -> dict | None:
    rows = load_contact_overrides()
    info = rows.get(slug)
    return info if isinstance(info, dict) else None


def has_phone_override(slug: str) -> bool:
    info = get_contact_override(slug) or {}
    return bool((info.get("phone") or "").strip())


def has_hours_override(slug: str) -> bool:
    info = get_contact_override(slug) or {}
    return isinstance(info.get("opening_hours"), dict) and bool(info["opening_hours"])
