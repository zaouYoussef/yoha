"""Scraper des pharmacies de garde d'infopoint.ma.

La page expose chaque pharmacie dans un bloc `.pharm-card` avec toutes les
données en attributs `data-*` (nom FR/AR, adresse FR/AR, téléphone, lat/lng).
Aucun géocodage n'est donc nécessaire : les coordonnées viennent de la source.
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://infopoint.ma"
PHARMACIES_DE_GARDE_URL = f"{BASE_URL}/pharmacies-de-garde"

USER_AGENT = "Mozilla/5.0 (compatible; YoHa/1.0 pharmacy sync)"


class ScrapeError(Exception):
    """Impossible de récupérer/parsier la page source."""


def _to_decimal(raw: str | None) -> Decimal | None:
    if not raw:
        return None
    try:
        return Decimal(str(raw).strip())
    except (InvalidOperation, ValueError):
        return None


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

        hours_label = ""
        guard_type = "24h"
        banner = soup.select_one(".duty-banner")
        if banner:
            hours_label = " ".join(banner.get_text(" ", strip=True).split())
            lowered = hours_label.lower()
            if "24" in lowered or "24h" in lowered:
                guard_type = "24h"
            elif "nuit" in lowered or "night" in lowered:
                guard_type = "night"
            else:
                guard_type = "day"

        pharmacies: list[dict] = []
        for card in soup.select(".pharm-card"):
            slug = (card.get("data-slug") or "").strip()
            name = (card.get("data-name") or "").strip()
            if not slug or not name:
                continue
            pharmacies.append(
                {
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
            )

        if not pharmacies:
            raise ScrapeError("Aucune pharmacie trouvée (sélecteurs obsolètes ?).")

        return {
            "city": self.city,
            "guard_type": guard_type,
            "hours_label": hours_label,
            "pharmacies": pharmacies,
        }

    def scrape(self) -> dict:
        return self.parse(self.fetch())
