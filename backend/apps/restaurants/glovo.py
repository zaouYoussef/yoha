"""Récupération des menus Glovo — HTML public d'abord, API en secours.

Méthode principale (à la manière du scraper Infopoint, aucune API) :
on télécharge la page web publique du restaurant et on extrait le menu du
payload React Server Components embarqué dans le HTML (`self.__next_f.push`
→ `initialStoreContent` → `data.body` avec sections et produits).

URL : https://glovoapp.com/{country}/{lang}/{city}/{slug}

La plupart des stores embarquent le menu complet dans la page. Certains
(format « collections ») n'embarquent que les carrousels vedettes et des
tuiles de catégorie SANS leurs produits (melt-99). Dans ce cas `incomplete`
est levé et l'appelant peut basculer sur l'API publique (`GlovoClient`),
dont le menu complet n'est pas exposé ailleurs.
"""
from __future__ import annotations

import json
import logging
import re
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List

import requests

logger = logging.getLogger(__name__)

API_BASE = "https://api.glovoapp.com"
# Le préfixe `dh:` des imageId se résout sur le même hôte que `imageUrl`
# (images.deliveryhero.io/image/…), PAS sur glovo.dhmedia.io.
IMAGE_BASE = "https://images.deliveryhero.io/image"
STORE_PAGE_URL = "https://glovoapp.com/{country}/{lang}/{city}/{slug}"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"
)

_MENU_LINK_RE = re.compile(r"link=([^&#]+)")
_CONTENT_RE = re.compile(r"/v4/stores/(\d+)/addresses/(\d+)/content")
_DHMEDIA_RE = re.compile(r"https://glovo\.dhmedia\.io/image/[A-Za-z0-9_\-./]+")
_VARIANT_RE = re.compile(r"\s*[\(\[][^()\[\]]{1,24}[\)\]]\s*$")
_PUSH_RE = re.compile(r"__next_f\.push\(")


class GlovoError(Exception):
    """Impossible de récupérer/parser le menu Glovo."""


@dataclass
class GlovoModifierOption:
    external_id: str
    name: str
    price_impact: float


@dataclass
class GlovoModifierGroup:
    name: str
    min_selected: int
    max_selected: int
    options: List[GlovoModifierOption] = field(default_factory=list)


@dataclass
class GlovoProduct:
    external_id: str
    name: str
    description: str
    price_mad: float
    image_url: str
    out_of_stock: bool = False
    modifier_groups: List[GlovoModifierGroup] = field(default_factory=list)


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


# ————————————————————— Outils communs —————————————————————


def _pick_image(urls: set[str], needle: str) -> str:
    for u in urls:
        if needle in u:
            return u
    return ""


def _to_product(data: Dict[str, Any]) -> GlovoProduct:
    price = data.get("price") or 0.0
    promotion = data.get("promotion") or {}
    price_mad = promotion.get("price") or price
    image_url = data.get("imageUrl") or ""
    if not image_url:
        image_id = data.get("imageId", "")
        if isinstance(image_id, str) and image_id.startswith("dh:"):
            image_url = f"{IMAGE_BASE}/{image_id[3:].lstrip('/')}"
    return GlovoProduct(
        external_id=_external_id(data),
        name=_clean_name(data.get("name", "")),
        description=data.get("description", "") or "",
        price_mad=float(price_mad),
        image_url=image_url,
        out_of_stock=bool(data.get("outOfStock")),
        modifier_groups=_modifier_groups(data),
    )


def _modifier_groups(data: Dict[str, Any]) -> List[GlovoModifierGroup]:
    """Groupes d'options du produit (`attributeGroups`) — sauces, tailles…"""
    groups: List[GlovoModifierGroup] = []
    for group in data.get("attributeGroups") or []:
        options = [
            GlovoModifierOption(
                external_id=str(attr.get("externalId") or ""),
                name=(attr.get("name") or "").strip(),
                price_impact=float(attr.get("priceImpact") or 0.0),
            )
            for attr in group.get("attributes") or []
        ]
        if not options:
            continue
        groups.append(
            GlovoModifierGroup(
                name=(group.get("name") or "").strip(),
                min_selected=int(group.get("min") or 0),
                max_selected=int(group.get("max") or 0),
                options=options,
            )
        )
    return groups


def _clean_name(name: str) -> str:
    """Retire le marqueur de variante Glovo en fin de nom (ex. « Tacos XXL (fm) »)."""
    name = (name or "").strip()
    cleaned = _VARIANT_RE.sub("", name).strip()
    return cleaned or name


def _external_id(data: Dict[str, Any]) -> str:
    eid = data.get("externalId")
    if eid not in (None, ""):
        return str(eid)
    key = re.sub(r"[^a-z0-9]+", "-", _clean_name(data.get("name", "")).lower()).strip("-")
    return f"g-{key}" if key else f"g-{uuid.uuid4().hex[:12]}"


# ————————————————————— Découverte du store (page web SSR) —————————————————————


def discover_store(
    glovo_slug: str,
    *,
    city_code: str = "TAN",
    city_slug: str = "tanger",
    country_code: str = "ma",
    language: str = "fr",
    timeout: int = 30,
) -> GlovoStoreInfo:
    """Découvre store/address/cover/logo depuis la page web publique d'un store.

    L'identifiant du store et de l'adresse apparaissent dans les chemins
    `/v4/stores/…/addresses/…/content`, les images (cover/logo) sont des URLs
    `glovo.dhmedia.io`.
    """
    url = STORE_PAGE_URL.format(
        country=country_code, lang=language, city=city_slug, slug=glovo_slug
    )
    html = _fetch_page(url, timeout=timeout)
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


# ————————————————————— Requête HTML (page publique) —————————————————————


def _fetch_page(url: str, timeout: int = 30) -> str:
    """Télécharge une page publique Glovo avec retry sur 429/5xx."""
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "fr-FR,fr;q=0.9"}
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=headers, timeout=timeout)
        except requests.RequestException as exc:
            if attempt == 2:
                raise GlovoError(f"Réseau : {exc}") from exc
            time.sleep(1 + attempt)
            continue
        if resp.status_code == 429:
            if attempt == 2:
                raise GlovoError(f"HTTP 429 (rate-limit) sur {url}")
            try:
                wait = min(float(resp.headers.get("Retry-After") or 0), 30)
            except ValueError:
                wait = 0
            time.sleep(max(wait, 1 + attempt * 2))
            continue
        if resp.status_code != 200:
            raise GlovoError(f"HTTP {resp.status_code} sur {url}")
        if not resp.text.strip():
            raise GlovoError(f"Page vide sur {url}")
        return resp.text
    raise GlovoError(f"HTTP 429 (rate-limit) sur {url}")


# ————————————————————— Payload React Server Components —————————————————————


def _scan_json(text: str, start: int, open_ch: str = "{", close_ch: str = "}") -> str:
    """Renvoie le bloc JSON balancé commençant à `start` (gère les chaînes)."""
    depth = 0
    in_str = False
    i = start
    while i < len(text):
        ch = text[i]
        if in_str:
            if ch == "\\":
                i += 2
                continue
            if ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == open_ch:
                depth += 1
            elif ch == close_ch:
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
        i += 1
    raise GlovoError("JSON non balancé dans la page")


def _rsc_payload(html: str) -> str:
    """Extrait le texte du payload React Server Components contenant le menu."""
    for script in re.findall(r"<script[^>]*>(.*?)</script>", html, re.S):
        if "initialStoreContent" not in script:
            continue
        for match in _PUSH_RE.finditer(script):
            arr_start = script.find("[", match.end())
            try:
                payload = json.loads(_scan_json(script, arr_start, "[", "]"))
            except (json.JSONDecodeError, GlovoError):
                continue
            rsc = payload[1] if len(payload) > 1 else ""
            if "initialStoreContent" in rsc:
                return rsc
    raise GlovoError("menu introuvable dans la page (structure modifiée ?)")


def _store_content(html: str) -> Dict[str, Any]:
    """Parse `initialStoreContent` (le menu complet) depuis le HTML."""
    rsc = _rsc_payload(html)
    idx = rsc.find('"initialStoreContent"')
    if idx < 0:
        raise GlovoError("initialStoreContent introuvable")
    colon = rsc.find(":", idx)
    brace = rsc.find("{", colon)
    try:
        return json.loads(_scan_json(rsc, brace))
    except json.JSONDecodeError as exc:
        raise GlovoError(f"initialStoreContent illisible : {exc}") from exc


# ————————————————————— Scraper HTML du menu —————————————————————


class GlovoScraper:
    """Scraper du menu d'un restaurant Glovo (page publique, sans API).

    `incomplete` devient `True` quand la page n'embarque pas le menu complet
    (format « collections » : catégories sans produits). `store_id`/`address_id`
    sont alors extraits de la page pour un éventuel fallback API.
    """

    def __init__(
        self,
        *,
        slug: str,
        country_code: str = "ma",
        city_slug: str = "tanger",
        language: str = "fr",
        timeout: int = 40,
    ):
        self.slug = slug
        self.country_code = country_code
        self.city_slug = city_slug
        self.language = language
        self.timeout = timeout
        self.incomplete = False
        self.store_id: int | None = None
        self.address_id: int | None = None

    def page_url(self) -> str:
        return STORE_PAGE_URL.format(
            country=self.country_code,
            lang=self.language,
            city=self.city_slug,
            slug=self.slug,
        )

    def fetch_full_menu(self) -> List[GlovoSection]:
        """Toutes les sections (catégories) avec leurs produits, en une requête."""
        html = _fetch_page(self.page_url(), timeout=self.timeout)
        m = _CONTENT_RE.search(html)
        if m:
            self.store_id = int(m.group(1))
            self.address_id = int(m.group(2))

        content = _store_content(html)
        sections: List[GlovoSection] = []
        for node in (content.get("data") or {}).get("body", []):
            data = node.get("data") or {}
            title = (data.get("title") or node.get("id") or "").strip()
            elements = data.get("elements") or node.get("elements") or []
            products = [
                p
                for e in elements
                if e.get("type") in ("PRODUCT_TILE", "PRODUCT_ROW")
                and (p := _to_product(e.get("data") or {}))
            ]
            if not products:
                if any(e.get("type") == "COLLECTION_TILE" for e in elements):
                    self.incomplete = True
                continue
            sections.append(GlovoSection(title=title or "Menu", products=products))
        if not sections:
            raise GlovoError("aucune section trouvée sur la page du store")
        return sections


# ————————————————————— Client API (secours) —————————————————————


class GlovoClient:
    """Client minimal de l'API web Glovo (fallback quand la page HTML est partielle).

    Flux :
      1. `/v3/stores/{store}/addresses/{address}/node/store_menu` → liens
         profonds des sections.
      2. `/v4/stores/{store}/addresses/{address}/content/main?nodeType=DEEP_LINK
         &link={menu}` → le menu complet.

    Deux layouts sont gérés :
      * LIST_VIEW_LAYOUT — toutes les sections (type LIST, éléments PRODUCT_ROW)
        sont dans le corps de `content/main`.
      * GRID_VIEW_LAYOUT — le corps contient des nœuds DEEP_LINK pointant vers
        des collections « {slug}-c.{id} » à récupérer séparément.
    """

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
        last_exc: GlovoError | None = None
        for attempt in range(5):
            try:
                resp = requests.get(url, headers=self._headers(), timeout=30)
            except requests.RequestException as exc:
                last_exc = GlovoError(f"Réseau Glovo : {exc}")
                time.sleep(min(1 + attempt * 2, 30))
                continue
            if resp.status_code == 429:
                retry_after = resp.headers.get("Retry-After")
                try:
                    wait = min(float(retry_after or 0), 60)
                except ValueError:
                    wait = 0
                last_exc = GlovoError(f"HTTP 429 (rate-limit) sur {url}")
                time.sleep(max(wait, min(1 + attempt * 4, 30)))
                continue
            if resp.status_code != 200:
                raise GlovoError(f"HTTP {resp.status_code} sur {url}")
            try:
                return resp.json()
            except ValueError as exc:
                raise GlovoError(f"JSON invalide sur {url}") from exc
        raise last_exc or GlovoError(f"HTTP 429 (rate-limit) sur {url}")

    def fetch_full_menu(self) -> List[GlovoSection]:
        """Toutes les sections (catégories) avec leurs produits.

        Stratégie pour rester sous les limites de débit :
          1. liens profonds depuis `store_menu` (complétude : carrousels et
             collections complets) — 1 requête par lien, espacées ;
          2. en cas d'échec 429 persistant, secours `content/main` sans
             paramètre (1 seule requête, menu complet sauf carrousels tronqués).
        """
        try:
            return self._fetch_via_links()
        except GlovoError:
            single = self._fetch_single_shot()
            if single:
                return single
            raise

    def _fetch_via_links(self) -> List[GlovoSection]:
        store_menu = self._get(
            f"/v3/stores/{self.store_id}/addresses/{self.address_id}/node/store_menu"
        )
        links = self._extract_links(store_menu)
        if not links:
            raise GlovoError("Aucun lien de menu trouvé dans store_menu")

        sections: List[GlovoSection] = []
        for index, link in enumerate(links):
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
            if index < len(links) - 1:
                time.sleep(1.5)
        return sections

    def _fetch_single_shot(self) -> List[GlovoSection]:
        """Secours : `content/main` sans paramètre (une seule requête)."""
        try:
            layout = self._get(
                f"/v4/stores/{self.store_id}/addresses/{self.address_id}/content/main"
            )
        except GlovoError:
            return []
        sections: List[GlovoSection] = []
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
        products = [
            p
            for e in (data.get("elements") or [])
            if e.get("type") in ("PRODUCT_ROW", "PRODUCT_TILE")
            and (p := _to_product(e.get("data") or {}))
        ]
        if not products:
            return
        sections.append(GlovoSection(title=title or "Menu", products=products))

    def _append_section(self, sections: List[GlovoSection], node: Dict[str, Any], fallback: str):
        data = node.get("data") or {}
        title = (data.get("title") or fallback or node.get("id") or "").strip()
        products = [
            p
            for e in (data.get("elements") or [])
            if e.get("type") in ("PRODUCT_ROW", "PRODUCT_TILE")
            and (p := _to_product(e.get("data") or {}))
        ]
        if not products:
            return
        sections.append(GlovoSection(title=title, products=products))
