"""Vérification des jetons OAuth Google / Apple et liaison utilisateur."""

from __future__ import annotations

import logging
from typing import Any

import jwt
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jwt import PyJWKClient

from .models import UserOAuthProvider

logger = logging.getLogger(__name__)

User = get_user_model()

APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
_apple_jwk_client_instance: PyJWKClient | None = None

FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
_firebase_certs_cache: dict[str, str] | None = None


def _google_client_ids() -> list[str]:
    raw = getattr(settings, "GOOGLE_OAUTH_CLIENT_IDS", "") or ""
    return [x.strip() for x in raw.split(",") if x.strip()]


def _firebase_project_id() -> str:
    return getattr(settings, "FIREBASE_PROJECT_ID", "") or ""


def _fetch_firebase_certs() -> dict[str, str]:
    global _firebase_certs_cache
    if _firebase_certs_cache is None:
        try:
            res = requests.get(FIREBASE_CERTS_URL, timeout=10)
            res.raise_for_status()
            _firebase_certs_cache = res.json()
        except Exception as exc:
            raise ValueError("Impossible de récupérer les clés Firebase.") from exc
    return _firebase_certs_cache


def _firebase_signing_key(token: str) -> Any:
    """Retourne la clé publique RSA PEM correspondant au kid du token.

    L'endpoint Google renvoie des certificats X.509 ; PyJWT a besoin
    de la clé publique extraite (``BEGIN PUBLIC KEY``).
    """
    from cryptography.x509 import load_pem_x509_certificate

    try:
        header = jwt.get_unverified_header(token)
    except Exception as exc:
        raise ValueError("En-tête Firebase invalide.") from exc
    kid = header.get("kid")
    if not kid:
        raise ValueError("En-tête Firebase invalide (kid manquant).")
    certs = _fetch_firebase_certs()
    cert_pem = certs.get(kid)
    if not cert_pem:
        raise ValueError("Clé Firebase inconnue.")
    # Extraire la clé publique RSA du certificat X.509
    cert = load_pem_x509_certificate(cert_pem.encode("utf-8"))
    return cert.public_key()


def verify_google_id_token(token: str) -> dict[str, Any]:
    client_ids = _google_client_ids()
    if not client_ids:
        raise ValueError("Google Sign-In non configuré sur le serveur.")
    last_error: Exception | None = None
    for client_id in client_ids:
        try:
            payload = google_id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id,
            )
            if payload.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
                raise ValueError("Émetteur Google invalide.")
            if not payload.get("email"):
                raise ValueError("E-mail Google manquant.")
            if payload.get("email_verified") is False:
                raise ValueError("E-mail Google non vérifié.")
            return payload
        except Exception as exc:
            last_error = exc
    raise ValueError("Jeton Google invalide.") from last_error


def verify_firebase_id_token(token: str) -> dict[str, Any]:
    project_id = _firebase_project_id()
    if not project_id:
        raise ValueError("Firebase non configuré sur le serveur.")
    try:
        signing_key = _firebase_signing_key(token)
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=project_id,
            issuer=f"https://securetoken.google.com/{project_id}",
            options={"verify_exp": True},
        )
        if not payload.get("sub"):
            raise ValueError("UID Firebase manquant.")
        if not payload.get("email"):
            raise ValueError("E-mail Firebase manquant.")
        return payload
    except jwt.PyJWTError as exc:
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            logger.warning(
                "firebase_token_verify_failed claims=%s error=%s",
                {k: unverified.get(k) for k in ("iss", "aud", "sub", "email", "exp", "iat")},
                str(exc),
            )
        except Exception:
            logger.warning("firebase_token_verify_failed decode_error=%s", str(exc))
        raise ValueError(f"Jeton Firebase invalide : {exc}") from exc
    except ValueError:
        raise


def _unverified_issuer(token: str) -> str | None:
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("iss")
    except Exception:
        return None


def verify_google_or_firebase_id_token(token: str) -> dict[str, Any]:
    """Vérifie un jeton Google OAuth classique ou un jeton Firebase Auth."""
    iss = _unverified_issuer(token)
    if iss and iss.startswith("https://securetoken.google.com"):
        return verify_firebase_id_token(token)
    if iss in ("accounts.google.com", "https://accounts.google.com"):
        return verify_google_id_token(token)
    # Fallback : essayer les deux si l'émetteur n'est pas lisible
    try:
        return verify_google_id_token(token)
    except ValueError:
        pass
    try:
        return verify_firebase_id_token(token)
    except ValueError:
        pass
    raise ValueError("Jeton Google/Firebase invalide.")


def _apple_jwk_client() -> PyJWKClient:
    global _apple_jwk_client_instance
    if _apple_jwk_client_instance is None:
        _apple_jwk_client_instance = PyJWKClient(APPLE_JWKS_URL)
    return _apple_jwk_client_instance


def verify_apple_identity_token(token: str) -> dict[str, Any]:
    client_id = getattr(settings, "APPLE_CLIENT_ID", "") or ""
    if not client_id:
        raise ValueError("Apple Sign-In non configuré sur le serveur.")
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise ValueError("En-tête Apple invalide.")
        signing_key = _apple_jwk_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=client_id,
            issuer="https://appleid.apple.com",
            options={"verify_exp": True},
        )
        return payload
    except jwt.PyJWTError as exc:
        raise ValueError("Jeton Apple invalide.") from exc


def _display_name_from_apple(full_name: dict | None, email: str) -> str:
    if full_name:
        parts = [
            (full_name.get("givenName") or "").strip(),
            (full_name.get("familyName") or "").strip(),
        ]
        name = " ".join(p for p in parts if p).strip()
        if name:
            return name[:120]
    return email.split("@")[0][:120] if email else "Utilisateur YoHa"


def get_or_create_oauth_user(
    *,
    provider: str,
    provider_uid: str,
    email: str,
    display_name: str,
) -> User:
    email = (email or "").strip().lower()
    if not provider_uid:
        raise ValueError("Identifiant fournisseur manquant.")

    link = (
        UserOAuthProvider.objects.select_related("user")
        .filter(provider=provider, provider_uid=provider_uid)
        .first()
    )
    if link:
        return link.user

    user: User | None = None
    if email:
        user = User.objects.filter(email=email).first()

    if user is None:
        if not email:
            # Apple peut masquer l'e-mail — identifiant stable requis
            email = f"{provider}.{provider_uid}@privaterelay.yoha.local"
            if User.objects.filter(email=email).exists():
                user = User.objects.get(email=email)
        if user is None:
            user = User.objects.create_user(
                email=email,
                password=None,
                display_name=display_name or email.split("@")[0],
                role=User.Role.CLIENT,
            )
            user.set_unusable_password()
            user.save(update_fields=["password"])

    UserOAuthProvider.objects.get_or_create(
        provider=provider,
        provider_uid=provider_uid,
        defaults={"user": user},
    )
    return user


def user_from_google(id_token: str) -> User:
    payload = verify_google_or_firebase_id_token(id_token)
    sub = str(payload.get("sub") or "")
    email = str(payload.get("email") or "").lower()
    name = str(payload.get("name") or "") or email.split("@")[0]
    return get_or_create_oauth_user(
        provider=UserOAuthProvider.Provider.GOOGLE,
        provider_uid=sub,
        email=email,
        display_name=name,
    )


def user_from_apple(identity_token: str, full_name: dict | None = None) -> User:
    payload = verify_apple_identity_token(identity_token)
    sub = str(payload.get("sub") or "")
    email = str(payload.get("email") or "").lower()
    display_name = _display_name_from_apple(full_name, email)
    return get_or_create_oauth_user(
        provider=UserOAuthProvider.Provider.APPLE,
        provider_uid=sub,
        email=email,
        display_name=display_name,
    )
