"""Horaires d'ouverture restaurant — fuseau Maroc par défaut."""

from __future__ import annotations

import re
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

DAY_KEYS = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)

DAY_LABELS_FR = {
    "monday": "lundi",
    "tuesday": "mardi",
    "wednesday": "mercredi",
    "thursday": "jeudi",
    "friday": "vendredi",
    "saturday": "samedi",
    "sunday": "dimanche",
}

DEFAULT_SLOT = {"is_closed": False, "is_24h": False, "open": "10:00", "close": "23:00"}
TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


def default_opening_hours() -> dict:
    return {day: dict(DEFAULT_SLOT) for day in DAY_KEYS}


def normalize_opening_hours(raw) -> dict:
    base = default_opening_hours()
    if not isinstance(raw, dict):
        return base
    out: dict = {}
    for day in DAY_KEYS:
        slot = raw.get(day)
        if not isinstance(slot, dict):
            out[day] = dict(DEFAULT_SLOT)
            continue
        is_closed = bool(slot.get("is_closed"))
        open_t = str(slot.get("open") or DEFAULT_SLOT["open"])[:5]
        close_t = str(slot.get("close") or DEFAULT_SLOT["close"])[:5]
        if not TIME_RE.match(open_t):
            open_t = DEFAULT_SLOT["open"]
        if not TIME_RE.match(close_t):
            close_t = DEFAULT_SLOT["close"]
        is_24h = bool(slot.get("is_24h")) or (not is_closed and open_t == close_t)
        if is_24h and not is_closed:
            open_t = close_t = "00:00"
        out[day] = {
            "is_closed": is_closed,
            "is_24h": is_24h and not is_closed,
            "open": open_t,
            "close": close_t,
        }
    return out


def _parse_time(value: str) -> time:
    hour, minute = value.split(":")
    return time(int(hour), int(minute))


def _is_open_at_time(*, open_s: str, close_s: str, current: time, is_24h: bool = False) -> bool:
    if is_24h or open_s == close_s:
        return True
    open_t = _parse_time(open_s)
    close_t = _parse_time(close_s)
    if open_t < close_t:
        return open_t <= current < close_t
    return current >= open_t or current < close_t


def restaurant_is_open_now(
    opening_hours,
    *,
    tz_name: str = "Africa/Casablanca",
    at: datetime | None = None,
) -> bool:
    hours = normalize_opening_hours(opening_hours)
    tz = ZoneInfo(tz_name)
    now = at if at is not None else datetime.now(tz)
    if now.tzinfo is None:
        now = now.replace(tzinfo=tz)
    else:
        now = now.astimezone(tz)
    day = hours[DAY_KEYS[now.weekday()]]
    if day["is_closed"]:
        return False
    return _is_open_at_time(
        open_s=day["open"],
        close_s=day["close"],
        current=now.time(),
        is_24h=day.get("is_24h", False),
    )


def _next_open_hint(hours: dict, start: datetime) -> str:
    tz = start.tzinfo
    for offset in range(8):
        probe = start + timedelta(days=offset)
        key = DAY_KEYS[probe.weekday()]
        slot = hours[key]
        if slot["is_closed"]:
            continue
        open_t = slot["open"]
        is_24h = slot.get("is_24h", False)
        if offset == 0:
            current = probe.time()
            if _is_open_at_time(
                open_s=open_t,
                close_s=slot["close"],
                current=current,
                is_24h=is_24h,
            ):
                return "Ouvert"
            if not is_24h and current < _parse_time(open_t):
                return f"Fermé · ouvre à {open_t}"
            continue
        day_label = "demain" if offset == 1 else DAY_LABELS_FR[key]
        return f"Fermé · ouvre {day_label} à {open_t}"
    return "Fermé"


def restaurant_open_status(
    opening_hours,
    *,
    tz_name: str = "Africa/Casablanca",
    at: datetime | None = None,
) -> dict:
    hours = normalize_opening_hours(opening_hours)
    tz = ZoneInfo(tz_name)
    now = at if at is not None else datetime.now(tz)
    if now.tzinfo is None:
        now = now.replace(tzinfo=tz)
    else:
        now = now.astimezone(tz)
    is_open = restaurant_is_open_now(hours, tz_name=tz_name, at=now)
    label = "Ouvert" if is_open else _next_open_hint(hours, now)
    return {"isOpen": is_open, "openLabel": label}
