"""Horaires d'ouverture restaurant — fuseau Maroc par défaut.

Format par jour :
  {
    "is_closed": false,
    "is_24h": false,
    "open": "12:00",          # créneau principal (rétro-compat)
    "close": "23:59",
    "slots": [                # optionnel — plusieurs plages / jour
      {"open": "00:00", "close": "02:30"},
      {"open": "12:00", "close": "23:59"}
    ]
  }
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

import requests

logger = logging.getLogger(__name__)

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

OSM_DAY_MAP = {
    "Mo": "monday",
    "Tu": "tuesday",
    "We": "wednesday",
    "Th": "thursday",
    "Fr": "friday",
    "Sa": "saturday",
    "Su": "sunday",
}

DEFAULT_SLOT = {"is_closed": False, "is_24h": False, "open": "10:00", "close": "23:00", "slots": []}
TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


def default_opening_hours() -> dict:
    return {day: dict(DEFAULT_SLOT, slots=[]) for day in DAY_KEYS}


def _normalize_slots(raw_slots) -> list[dict]:
    out: list[dict] = []
    if not isinstance(raw_slots, list):
        return out
    for slot in raw_slots:
        if not isinstance(slot, dict):
            continue
        open_t = str(slot.get("open") or "")[:5]
        close_t = str(slot.get("close") or "")[:5]
        if TIME_RE.match(open_t) and TIME_RE.match(close_t):
            out.append({"open": open_t, "close": close_t})
    return out


def normalize_opening_hours(raw) -> dict:
    base = default_opening_hours()
    if not isinstance(raw, dict):
        return base
    out: dict = {}
    for day in DAY_KEYS:
        slot = raw.get(day)
        if not isinstance(slot, dict):
            out[day] = dict(DEFAULT_SLOT, slots=[])
            continue
        is_closed = bool(slot.get("is_closed"))
        open_t = str(slot.get("open") or DEFAULT_SLOT["open"])[:5]
        close_t = str(slot.get("close") or DEFAULT_SLOT["close"])[:5]
        if not TIME_RE.match(open_t):
            open_t = DEFAULT_SLOT["open"]
        if not TIME_RE.match(close_t):
            close_t = DEFAULT_SLOT["close"]
        slots = _normalize_slots(slot.get("slots"))
        if not slots and not is_closed:
            slots = [{"open": open_t, "close": close_t}]
        is_24h = bool(slot.get("is_24h")) or (
            not is_closed and len(slots) == 1 and slots[0]["open"] == slots[0]["close"]
        )
        if is_24h and not is_closed:
            open_t = close_t = "00:00"
            slots = [{"open": "00:00", "close": "00:00"}]
        elif slots:
            open_t, close_t = slots[0]["open"], slots[-1]["close"]
        out[day] = {
            "is_closed": is_closed,
            "is_24h": is_24h and not is_closed,
            "open": open_t,
            "close": close_t,
            "slots": [] if is_closed else slots,
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
    # Traverse minuit (ex. 22:00 → 02:30)
    return current >= open_t or current < close_t


def _day_is_open(day: dict, current: time) -> bool:
    if day.get("is_closed"):
        return False
    if day.get("is_24h"):
        return True
    slots = day.get("slots") or []
    if slots:
        return any(
            _is_open_at_time(open_s=s["open"], close_s=s["close"], current=current)
            for s in slots
        )
    return _is_open_at_time(
        open_s=day["open"],
        close_s=day["close"],
        current=current,
        is_24h=False,
    )


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
    return _day_is_open(day, now.time())


def _next_open_hint(hours: dict, start: datetime) -> str:
    for offset in range(8):
        probe = start + timedelta(days=offset)
        key = DAY_KEYS[probe.weekday()]
        slot = hours[key]
        if slot["is_closed"]:
            continue
        slots = slot.get("slots") or [{"open": slot["open"], "close": slot["close"]}]
        is_24h = slot.get("is_24h", False)
        if offset == 0:
            current = probe.time()
            if _day_is_open(slot, current):
                return "Ouvert"
            for s in slots:
                if not is_24h and current < _parse_time(s["open"]):
                    return f"Fermé · ouvre à {s['open']}"
            continue
        day_label = "demain" if offset == 1 else DAY_LABELS_FR[key]
        first_open = slots[0]["open"] if slots else slot["open"]
        return f"Fermé · ouvre {day_label} à {first_open}"
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


def format_day_hours_fr(day: dict) -> str:
    """Ex. `00:00 - 02:30 & 12:00 - 23:59` ou `Fermé`."""
    if day.get("is_closed"):
        return "Fermé"
    if day.get("is_24h"):
        return "24h/24"
    slots = day.get("slots") or [{"open": day.get("open"), "close": day.get("close")}]
    parts = [f"{s['open']} - {s['close']}" for s in slots if s.get("open") and s.get("close")]
    return " & ".join(parts) if parts else "—"


# ————————————————————— OSM (secours horaires) —————————————————————


def _parse_osm_opening_hours(raw: str) -> dict | None:
    """Parse basique de `opening_hours` OSM → format YoHa (multi-créneaux)."""
    if not raw or not isinstance(raw, str):
        return None
    text = raw.strip()
    if text in {"24/7", "24/7;"}:
        hours = default_opening_hours()
        for day in DAY_KEYS:
            hours[day] = {
                "is_closed": False,
                "is_24h": True,
                "open": "00:00",
                "close": "00:00",
                "slots": [{"open": "00:00", "close": "00:00"}],
            }
        return hours

    hours = default_opening_hours()
    for day in DAY_KEYS:
        hours[day] = {"is_closed": True, "is_24h": False, "open": "00:00", "close": "00:00", "slots": []}

    # Ex: Mo-Th 12:00-23:59; Fr 00:00-23:59; Sa-Su 12:00-02:30
    chunks = [c.strip() for c in text.split(";") if c.strip()]
    matched_any = False
    for chunk in chunks:
        m = re.match(
            r"^([A-Za-z]{2}(?:-[A-Za-z]{2})?(?:,[A-Za-z]{2}(?:-[A-Za-z]{2})?)*)\s+(.+)$",
            chunk,
        )
        if not m:
            continue
        days_part, times_part = m.group(1), m.group(2)
        day_keys: list[str] = []
        for part in days_part.split(","):
            part = part.strip()
            if "-" in part:
                a, b = part.split("-", 1)
                if a in OSM_DAY_MAP and b in OSM_DAY_MAP:
                    ai = DAY_KEYS.index(OSM_DAY_MAP[a])
                    bi = DAY_KEYS.index(OSM_DAY_MAP[b])
                    if ai <= bi:
                        day_keys.extend(DAY_KEYS[ai : bi + 1])
                    else:
                        day_keys.extend(DAY_KEYS[ai:] + DAY_KEYS[: bi + 1])
            elif part in OSM_DAY_MAP:
                day_keys.append(OSM_DAY_MAP[part])
        slots = []
        for tr in re.findall(r"(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})", times_part):
            try:
                oh, om = tr[0].split(":")
                ch, cm = tr[1].split(":")
                o = f"{int(oh):02d}:{int(om):02d}"
                c = f"{int(ch):02d}:{int(cm):02d}"
            except ValueError:
                continue
            if TIME_RE.match(o) and TIME_RE.match(c):
                slots.append({"open": o, "close": c})
        if not day_keys or not slots:
            continue
        matched_any = True
        for dk in day_keys:
            hours[dk] = {
                "is_closed": False,
                "is_24h": len(slots) == 1 and slots[0]["open"] == slots[0]["close"],
                "open": slots[0]["open"],
                "close": slots[-1]["close"],
                "slots": slots,
            }
    return normalize_opening_hours(hours) if matched_any else None


def fetch_osm_opening_hours(
    latitude: float,
    longitude: float,
    *,
    name: str = "",
    radius_m: int = 120,
    timeout: int = 12,
) -> dict | None:
    """Récupère les horaires OSM autour des coords Glovo (best-effort)."""
    query = f"""
    [out:json][timeout:10];
    (
      nwr(around:{radius_m},{latitude},{longitude})["opening_hours"];
    );
    out tags center 20;
    """
    try:
        resp = requests.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": query},
            timeout=timeout,
            headers={"User-Agent": "YoHaGlovoSync/1.0"},
        )
        if resp.status_code != 200:
            return None
        elements = (resp.json() or {}).get("elements") or []
    except Exception:  # noqa: BLE001
        logger.exception("osm_overpass_failed")
        return None

    name_l = (name or "").strip().lower()
    best = None
    for el in elements:
        tags = el.get("tags") or {}
        raw = tags.get("opening_hours")
        if not raw:
            continue
        el_name = (tags.get("name") or tags.get("brand") or "").lower()
        if name_l and el_name and (name_l in el_name or el_name in name_l):
            parsed = _parse_osm_opening_hours(raw)
            if parsed:
                return parsed
        if best is None:
            best = raw
    if best:
        return _parse_osm_opening_hours(best)
    return None
