"""Client de l'API publique Glovo (web).

Récupère le menu complet d'un restaurant via les endpoints v3/v4 de
api.glovoapp.com. Aucune authentification requise — seuls des en-têtes de
localisation (ville/coordonnées) et un identifiant de session aléatoire sont
attendus.

Flux :
  1. `/v3/stores/{store}/addresses/{address}/node/store_menu` → liste des
     sections et le lien profond (deeplink) de la catégorie « Menu ».
  2. `/v4/stores/{store}/addresses/{address}/content/main?nodeType=DEEP_LINK
     &link={menu}` → le menu complet.

Deux layouts sont gérés :
  * LIST_VIEW_LAYOUT — toutes les sections (type LIST, éléments PRODUCT_ROW)
    sont dans le corps de `content/main`.
  * GRID_VIEW_LAYOUT — le corps contient des nœuds DEEP_LINK pointant vers des
    collections « {slug}-c.{id} » à récupérer séparément (éléments
    PRODUCT_TILE).
"""
from __future__ import annotations

import logging
import re
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List

import requests

logger = logging.getLogger(__name__)

API_BASE = "https://api.glovoapp.com"
IMAGE_BASE = "https://glovo.dhmedia.io"
STORE_PAGE_URL = "https://glovoapp.com/{country}/{lang}/{city}/{slug}"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"
)

_MENU_LINK_RE = re.compile(r"link=([^&#]+)")
_CONTENT_RE = re.compile(r"/v4/stores/(\d+)/addresses/(\d+)/content")
_DHMEDIA_RE = re.compile(r"https://glovo\.dhmedia\.io/image/[A-Za-z0-9_\-./]+")
_VARIANT_RE = re.compile(r"\s*[\(\[][^()\[\]]{1,24}[\)\]]\s*$")


class GlovoError(Exception):
    """Impossible de récupérer/parser le menu Glovo."""


@dataclass
class GlovoProduct:
    external_id: str
    name: str
    description: str
    price_mad: float
    image_url: str
    out_of_stock: bool = False


@dataclass
class GlovoSection:
    title: str
    products: List[GlovoProduct] = field(default_factory=list)


@dataclass
class GlovoStoreInfo:
    store_id: int | None = None
    address_id: int | None = None
    name: str = ""
    cover_url: str = ""
    logo_url: str = ""


def discover_store(
    glovo_slug: str,
    *,
    city_code: str = "TAN",
    city_slug: str = "tanger",
    country_code: str = "ma",
    language: str = "fr",
    timeout: int = 30,
) -> GlovoStoreInfo:
    """Découvre store/address/cover/logo depuis la page web SSR d'un store.

    La page Glovo est une SPA Next.js : l'identifiant du store et de l'adresse
    apparaissent dans les chemins `/v4/stores/…/addresses/…/content`, les
    images (cover/logo) sont des URLs `glovo.dhmedia.io`.
    """
    url = STORE_PAGE_URL.format(
        country=country_code, lang=language, city=city_slug, slug=glovo_slug
    )
    try:
        resp = requests.get(
            url,
            headers={"User-Agent": USER_AGENT, "Accept-Language": "fr-FR,fr;q=0.9"},
            timeout=timeout,
        )
    except requests.RequestException as exc:
        raise GlovoError(f"Réseau : {exc}") from exc
    if resp.status_code != 200:
        raise GlovoError(f"HTTP {resp.status_code} sur {url}")

    html = resp.text
    info = GlovoStoreInfo()
    m = _CONTENT_RE.search(html)
    if m:
        info.store_id = int(m.group(1))
        info.address_id = int(m.group(2))

    title_m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
    if title_m:
        info.name = title_m.group(1).split("|")[0].strip()

    urls = set(_DHMEDIA_RE.findall(html))
    info.cover_url = _pick_image(urls, "stores-glovo/stores/")
    info.logo_url = _pick_image(urls, "store_logos")
    return info


def _pick_image(urls: set[str], needle: str) -> str:
    for u in urls:
        if needle in u:
            return u
    return ""


class GlovoClient:
    """Client minimal de l'API web Glovo pour un restaurant donné."""

    def __init__(
        self,
        *,
        store_id: int,
        address_id: int,
        city_code: str,
        country_code: str,
        latitude: float,
        longitude: float,
        language: str = "fr",
    ):
        self.store_id = store_id
        self.address_id = address_id
        self.city_code = city_code
        self.country_code = country_code
        self.latitude = latitude
        self.longitude = longitude
        self.language = language

    def _headers(self) -> Dict[str, str]:
        return {
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            "Accept-Language": f"{self.language}-{self.country_code.upper()},{self.language};q=0.9",
            "Glovo-Api-Version": "14",
            "Glovo-Location-City-Code": self.city_code,
            "Glovo-Location-Country-Code": self.country_code,
            "Glovo-Delivery-Location-Latitude": str(self.latitude),
            "Glovo-Delivery-Location-Longitude": str(self.longitude),
            "Glovo-Language-Code": self.language,
            "Glovo-App-Platform": "web",
            "Glovo-Perseus-Session-Id": str(uuid.uuid4()),
        }

    def _get(self, path: str) -> Dict[str, Any]:
        url = f"{API_BASE}{path}"
        for attempt in range(3):
            try:
                resp = requests.get(url, headers=self._headers(), timeout=30)
            except requests.RequestException as exc:
                if attempt == 2:
                    raise GlovoError(f"Réseau Glovo : {exc}") from exc
                time.sleep(1 + attempt)
                continue
            if resp.status_code == 429:
                if attempt == 2:
                    raise GlovoError(f"HTTP 429 (rate-limit) sur {url}")
                retry_after = resp.headers.get("Retry-After")
                try:
                    wait = min(float(retry_after or 0), 30)
                except ValueError:
                    wait = 0
                time.sleep(max(wait, 1 + attempt * 2))
                continue
            if resp.status_code != 200:
                raise GlovoError(f"HTTP {resp.status_code} sur {url}")
            try:
                return resp.json()
            except ValueError as exc:
                raise GlovoError(f"JSON invalide sur {url}") from exc
        raise GlovoError(f"HTTP 429 (rate-limit) sur {url}")

    # ————————————————————— Menu —————————————————————

    def fetch_full_menu(self) -> List[GlovoSection]:
        """Toutes les sections (catégories) avec leurs produits.

        Le `store_menu` liste des liens profonds (`link=…-c.{id}`). Deux
        cas :
          * une seule catégorie « Menu » (`menu-c.{id}`) → un fetch de
            `content/main` renvoie toutes les sections (LIST, PRODUCT_ROW) ;
          * plusieurs catégories (GRID_VIEW_LAYOUT : kunafa, baklava, …) →
            chaque `link` est fetché séparément ; le corps contient des nœuds
            GRID avec des tuiles PRODUCT_TILE directement dans `elements`.
        """
        store_menu = self._get(
            f"/v3/stores/{self.store_id}/addresses/{self.address_id}/node/store_menu"
        )
        links = self._extract_links(store_menu)
        if not links:
            raise GlovoError("Aucun lien de menu trouvé dans store_menu")

        sections: List[GlovoSection] = []
        for link in links:
            url = (
                f"/v4/stores/{self.store_id}/addresses/{self.address_id}/content/main"
                f"?nodeType=DEEP_LINK&link={link}"
            )
            layout = self._get(url)
            for node in (layout.get("data") or {}).get("body", []):
                node_type = node.get("type")
                if node_type == "LIST":
                    self._append_section(sections, node, "")
                elif node_type == "GRID":
                    self._append_grid(sections, node)
        return sections

    def _extract_links(self, store_menu: Dict[str, Any]) -> List[str]:
        """Liens profonds dédupliqués (ordre du menu) depuis `store_menu`."""
        links: List[str] = []
        seen: set[str] = set()
        for element in (store_menu.get("data") or {}).get("elements", []):
            path = ((element.get("action") or {}).get("data") or {}).get("path", "")
            match = _MENU_LINK_RE.search(path)
            if not match:
                continue
            link = match.group(1)
            if link in seen:
                continue
            seen.add(link)
            links.append(link)
        return links

    def _append_grid(self, sections: List[GlovoSection], node: Dict[str, Any]):
        """Nœud GRID : tuiles produits dans `data.elements`."""
        data = node.get("data") or {}
        title = (data.get("title") or node.get("id") or "").strip()
        products = [p for e in (data.get("elements") or []) if (p := self._to_product(e))]
        if not products:
            return
        sections.append(GlovoSection(title=title or "Menu", products=products))

    def _append_section(self, sections: List[GlovoSection], node: Dict[str, Any], fallback: str):
        data = node.get("data") or {}
        title = (data.get("title") or fallback or node.get("id") or "").strip()
        products = [p for e in (data.get("elements") or []) if (p := self._to_product(e))]
        if not title and not products:
            return
        sections.append(GlovoSection(title=title, products=products))

    def _to_product(self, element: Dict[str, Any]) -> GlovoProduct | None:
        if element.get("type") not in ("PRODUCT_ROW", "PRODUCT_TILE"):
            return None
        data = element.get("data") or {}
        price = data.get("price") or 0.0
        promotion = data.get("promotion") or {}
        price_mad = promotion.get("price") or price
        image_url = data.get("imageUrl") or ""
        if not image_url:
            image_id = data.get("imageId", "")
            if isinstance(image_id, str) and image_id.startswith("dh:"):
                image_url = f"{IMAGE_BASE}{image_id[3:]}"
        return GlovoProduct(
            external_id=self._external_id(data),
            name=self._clean_name(data.get("name", "")),
            description=data.get("description", "") or "",
            price_mad=float(price_mad),
            image_url=image_url,
            out_of_stock=bool(data.get("outOfStock")),
        )

    @staticmethod
    def _clean_name(name: str) -> str:
        """Retire le marqueur de variante Glovo en fin de nom (ex. « Tacos XXL (fm) »)."""
        name = (name or "").strip()
        cleaned = _VARIANT_RE.sub("", name).strip()
        return cleaned or name

    @staticmethod
    def _external_id(data: Dict[str, Any]) -> str:
        eid = data.get("externalId")
        if eid not in (None, ""):
            return str(eid)
        key = re.sub(r"[^a-z0-9]+", "-", GlovoClient._clean_name(data.get("name", "")).lower()).strip("-")
        return f"g-{key}" if key else f"g-{uuid.uuid4().hex[:12]}"
