"""Scraper des pharmacies de garde d'infopoint.ma.

La page expose une ou plusieurs sections (garde de jour le week-end, garde 24h,
nuit) — chaque section ouvre par un `.duty-banner` suivi de ses `.pharm-card`.
Chaque carte expose les données en attributs `data-*` (nom FR/AR, adresse FR/AR,
téléphone, lat/lng). Aucun géocodage n'est donc nécessaire.
"""
from __future__ import annotations

import re
from datetime import time as dtime
from decimal import Decimal, InvalidOperation

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://infopoint.ma"
PHARMACIES_DE_GARDE_URL = f"{BASE_URL}/pharmacies-de-garde"

USER_AGENT = "Mozilla/5.0 (compatible; YoHa/1.0 pharmacy sync)"

_TIME_RE = re.compile(r"\b(\d{1,2}:\d{2})\b")


class ScrapeError(Exception):
    """Impossible de récupérer/parser la page source."""


def _to_decimal(raw: str | None) -> Decimal | None:
    if not raw:
        return None
    try:
        return Decimal(str(raw).strip())
    except (InvalidOperation, ValueError):
        return None


def _parse_times(label: str) -> tuple:
    times = [t for t in _TIME_RE.findall(label)]
    parsed = []
    for t in times:
        try:
            h, m = t.split(":")
            parsed.append(dtime(hour=int(h), minute=int(m)))
        except ValueError:
            continue
    while len(parsed) < 4:
        parsed.append(None)
    return parsed[0], parsed[1], parsed[2], parsed[3]


def _guard_type(label: str) -> str:
    lowered = label.lower()
    if "24" in lowered or "24h" in lowered:
        return "24h"
    if "nuit" in lowered or "night" in lowered:
        return "night"
    return "day"


class InfopointScraper:
    """Télécharge et parse la page des pharmacies de garde d'Infopoint.

    `city` est extensible : ajouter les slugs de pages dédiées par ville
    (Tanger est la page racine « /pharmacies-de-garde »).
    """

    CITY_PATHS = {
        "tanger": "pharmacies-de-garde",
    }

    def __init__(self, city: str = "tanger", timeout: int = 20):
        self.city = (city or "tanger").strip().lower()
        self.timeout = timeout

    def url(self) -> str:
        path = self.CITY_PATHS.get(self.city)
        if not path:
            raise ScrapeError(f"Ville non supportée : {self.city}")
        return f"{BASE_URL}/{path}"

    def fetch(self) -> str:
        try:
            resp = requests.get(
                self.url(),
                headers={"User-Agent": USER_AGENT},
                timeout=self.timeout,
            )
            resp.raise_for_status()
        except requests.RequestException as exc:
            raise ScrapeError(f"Erreur HTTP sur {self.url()} : {exc}") from exc
        if not resp.text.strip():
            raise ScrapeError("Page source vide.")
        return resp.text

    def parse(self, html: str) -> dict:
        soup = BeautifulSoup(html, "html.parser")

        sections: list[dict] = []
        current: dict = {"guard_type": "24h", "hours_label": "", "pharmacies": []}
        row = soup.select_one(".row.g-2") or soup

        for el in row.children:
            if not getattr(el, "name", None):
                continue
            classes = el.get("class") or []
            if el.name == "div" and "duty-banner" in classes:
                if current["pharmacies"]:
                    sections.append(current)
                label = " ".join(el.get_text(" ", strip=True).split())
                current = {
                    "guard_type": _guard_type(label),
                    "hours_label": label,
                    "pharmacies": [],
                }
                continue
            if el.name != "div":
                continue
            card = el.select_one(".pharm-card") if el.select_one(".pharm-card") else None
            if card is None:
                continue
            item = self._extract_card(card)
            if item:
                current["pharmacies"].append(item)

        if current["pharmacies"]:
            sections.append(current)
        sections = [s for s in sections if s["pharmacies"]]

        if not sections:
            raise ScrapeError("Aucune pharmacie trouvée (sélecteurs obsolètes ?).")

        start_1, end_1, start_2, end_2 = _parse_times(sections[0]["hours_label"])
        return {
            "city": self.city,
            "sections": sections,
            "guard_type": sections[0]["guard_type"],
            "hours_label": sections[0]["hours_label"],
            "start_time": start_1,
            "end_time": end_1,
            "start_time_2": start_2,
            "end_time_2": end_2,
        }

    def _extract_card(self, card) -> dict | None:
        slug = (card.get("data-slug") or "").strip()
        name = (card.get("data-name") or "").strip()
        if not slug or not name:
            return None
        return {
            "slug": slug,
            "name": name,
            "name_ar": (card.get("data-name-ar") or "").strip(),
            "address": (card.get("data-address") or "").strip(),
            "address_ar": (card.get("data-address-ar") or "").strip(),
            "phone": (card.get("data-phone") or "").strip(),
            "latitude": _to_decimal(card.get("data-latitude")),
            "longitude": _to_decimal(card.get("data-longitude")),
            "website": (card.get("data-website") or "").strip(),
        }

    def scrape(self) -> dict:
        return self.parse(self.fetch())
