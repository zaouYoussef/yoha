"""
Chiffrement Fernet pour données sensibles (téléphone, adresse).
La clé FIELD_ENCRYPTION_KEY doit être stable et stockée hors dépôt.
"""
from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


def _fernet() -> Fernet:
    raw = getattr(settings, "FIELD_ENCRYPTION_KEY", "") or ""
    if not raw:
        if settings.DEBUG:
            derived = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
            key = base64.urlsafe_b64encode(derived)
            return Fernet(key)
        raise ImproperlyConfigured(
            "FIELD_ENCRYPTION_KEY est obligatoire en production."
        )
    return Fernet(raw.encode() if isinstance(raw, str) else raw)


def encrypt_text(plain: str) -> str:
    if not plain:
        return ""
    return _fernet().encrypt(plain.encode("utf-8")).decode("ascii")


def decrypt_text(token: str) -> str:
    if not token:
        return ""
    try:
        return _fernet().decrypt(token.encode("ascii")).decode("utf-8")
    except InvalidToken:
        return ""
