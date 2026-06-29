"""
Traitement et stockage des images YoHa.

- Compression WebP à l'upload (léger, rapide à servir)
- Fichiers hors base de données (disque local ou S3/R2)
- Variantes pleine taille + miniature pour les listes
"""
from __future__ import annotations

import io
import uuid
from dataclasses import dataclass
from typing import BinaryIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image, UnidentifiedImageError

ALLOWED_CONTENT_TYPES = frozenset(
    {"image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"}
)
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 Mo en entrée

# Taille max (px) et qualité WebP par usage
IMAGE_PROFILES = {
    "cover": {"max_px": 1200, "thumb_px": 480, "quality": 82},
    "logo": {"max_px": 256, "thumb_px": 128, "quality": 85},
    "menu": {"max_px": 800, "thumb_px": 320, "quality": 82},
}


@dataclass
class StoredImage:
    key: str
    thumb_key: str
    url: str
    thumb_url: str
    width: int
    height: int


class ImageProcessingError(ValueError):
    pass


def _open_image(source: BinaryIO) -> Image.Image:
    try:
        img = Image.open(source)
        img.load()
    except UnidentifiedImageError as exc:
        raise ImageProcessingError("Fichier image invalide.") from exc
    if img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")
    return img


def _resize(img: Image.Image, max_px: int) -> Image.Image:
    w, h = img.size
    if max(w, h) <= max_px:
        return img
    ratio = max_px / max(w, h)
    return img.resize((int(w * ratio), int(h * ratio)), Image.Resampling.LANCZOS)


def _to_webp_bytes(img: Image.Image, quality: int) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=quality, method=4)
    return buf.getvalue()


def _storage_key(folder: str, purpose: str) -> tuple[str, str]:
    uid = uuid.uuid4().hex
    base = f"{folder}/{purpose}/{uid}"
    return f"{base}.webp", f"{base}_thumb.webp"


def _public_url(key: str) -> str:
    base = getattr(settings, "MEDIA_PUBLIC_BASE_URL", "").rstrip("/")
    if base:
        return f"{base}/{key.lstrip('/')}"
    return default_storage.url(key)


def validate_upload(uploaded_file) -> None:
    content_type = getattr(uploaded_file, "content_type", "") or ""
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise ImageProcessingError("Format non supporté (JPEG, PNG, WebP uniquement).")
    size = getattr(uploaded_file, "size", 0) or 0
    if size > MAX_UPLOAD_BYTES:
        raise ImageProcessingError("Image trop lourde (max 8 Mo).")


def process_and_store(uploaded_file, *, folder: str, purpose: str) -> StoredImage:
    """
    Compresse en WebP, enregistre variante principale + miniature.
    `folder` ex: restaurants/42, menu-items/99
    """
    validate_upload(uploaded_file)
    profile = IMAGE_PROFILES.get(purpose)
    if not profile:
        raise ImageProcessingError(f"Usage image inconnu: {purpose}")

    uploaded_file.seek(0)
    img = _open_image(uploaded_file)
    full = _resize(img, profile["max_px"])
    thumb = _resize(img, profile["thumb_px"])

    key, thumb_key = _storage_key(folder, purpose)
    full_bytes = _to_webp_bytes(full, profile["quality"])
    thumb_bytes = _to_webp_bytes(thumb, min(profile["quality"], 78))

    default_storage.save(key, ContentFile(full_bytes))
    default_storage.save(thumb_key, ContentFile(thumb_bytes))

    return StoredImage(
        key=key,
        thumb_key=thumb_key,
        url=_public_url(key),
        thumb_url=_public_url(thumb_key),
        width=full.width,
        height=full.height,
    )


def delete_stored_keys(*keys: str) -> None:
    for key in keys:
        if key and default_storage.exists(key):
            default_storage.delete(key)
