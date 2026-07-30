"""Vérificateur strict de domaine et de validité des adresses e-mail clients."""
import logging
import re
import socket
from functools import lru_cache

logger = logging.getLogger(__name__)

# Listes de domaines fictifs, temporaires ou bloqués
BLOCKED_DOMAINS = {
    "yoha.ma",
    "test.com",
    "example.com",
    "example.org",
    "foo.com",
    "bar.com",
    "tempmail.com",
    "mailinator.com",
    "yopmail.com",
    "dispostable.com",
    "guerrillamail.com",
    "10minutemail.com",
    "trashmail.com",
}

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


@lru_cache(maxsize=512)
def is_domain_routable(domain: str) -> bool:
    """Vérifie via la résolution DNS si le domaine possède des enregistrements réseau valides."""
    if not domain or domain.lower() in BLOCKED_DOMAINS:
        return False

    domain_clean = domain.lower().strip()
    try:
        # Tente de résoudre les hôtes/serveurs pour ce domaine
        socket.getaddrinfo(domain_clean, 80)
        return True
    except Exception:
        # Résolution DNS échouée (domaine inexistant ou sans serveur)
        logger.warning("email_domain_dns_failed domain=%s", domain_clean)
        return False


def is_valid_real_email(email: str) -> bool:
    """Valide la syntaxe, filtre les adresses de test et vérifie le DNS du domaine."""
    if not email:
        return False

    clean_email = email.strip().lower()
    if not EMAIL_REGEX.match(clean_email):
        return False

    try:
        user_part, domain_part = clean_email.rsplit("@", 1)
    except ValueError:
        return False

    if not user_part or not domain_part:
        return False

    if domain_part in BLOCKED_DOMAINS:
        return False

    # Vérification DNS du domaine
    return is_domain_routable(domain_part)
