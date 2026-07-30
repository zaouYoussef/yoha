"""Vérificateur strict et correcteur automatique de fautes de frappe dans les adresses e-mail."""
import logging
import re
import socket
from functools import lru_cache

logger = logging.getLogger(__name__)

# Correctifs explicites pour les fautes de frappe fréquentes
TYPO_DOMAIN_MAP = {
    # Gmail
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gmai.fr": "gmail.com",
    "gmail.co": "gmail.com",
    "gmail.con": "gmail.com",
    "gmaill.com": "gmail.com",
    "gmaill.fr": "gmail.com",
    "gmail.cm": "gmail.com",
    "gmal.com": "gmail.com",
    "gmeil.com": "gmail.com",
    "gmaile.com": "gmail.com",
    "gmail.ma": "gmail.com",
    "gmai.ma": "gmail.com",
    # Hotmail
    "hotnail.com": "hotmail.com",
    "hotmai.com": "hotmail.com",
    "hotmial.com": "hotmail.com",
    "hotmale.com": "hotmail.com",
    "hotmail.co": "hotmail.com",
    "hotmail.con": "hotmail.com",
    "hotmaill.com": "hotmail.com",
    "hotnail.fr": "hotmail.fr",
    "hotmai.fr": "hotmail.fr",
    # Yahoo
    "yaho.com": "yahoo.com",
    "yahooo.com": "yahoo.com",
    "yahou.com": "yahoo.com",
    "yaho.fr": "yahoo.fr",
    "yahooo.fr": "yahoo.fr",
    "yahou.fr": "yahoo.fr",
    "yaho.co": "yahoo.com",
    "yaho.ma": "yahoo.com",
    # Outlook & Live
    "outlok.com": "outlook.com",
    "outlok.fr": "outlook.fr",
    "outlook.co": "outlook.com",
    "outloock.com": "outlook.com",
    "liv.fr": "live.fr",
    "live.co": "live.com",
    # iCloud & Proton
    "iclou.com": "icloud.com",
    "icloud.co": "icloud.com",
    "iclooud.com": "icloud.com",
    "protonmai.com": "protonmail.com",
    "protonmial.com": "protonmail.com",
}

MAJOR_DOMAINS = [
    "gmail.com",
    "hotmail.com",
    "hotmail.fr",
    "yahoo.com",
    "yahoo.fr",
    "outlook.com",
    "outlook.fr",
    "icloud.com",
    "live.fr",
    "live.com",
]

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


def levenshtein_distance(s1: str, s2: str) -> int:
    """Calcule la distance d'édition de Levenshtein entre deux chaînes."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def autocorrect_email(email: str) -> str:
    """Corrige automatiquement les fautes de frappe dans le domaine d'une adresse e-mail."""
    if not email or "@" not in email:
        return email

    clean_email = email.strip().lower()
    try:
        user_part, domain_part = clean_email.rsplit("@", 1)
    except ValueError:
        return clean_email

    # 1. Vérification par dictionnaire explicite
    if domain_part in TYPO_DOMAIN_MAP:
        corrected_domain = TYPO_DOMAIN_MAP[domain_part]
        logger.info("autocorrect_email_mapped original=%s corrected=%s", domain_part, corrected_domain)
        return f"{user_part}@{corrected_domain}"

    # 2. Vérification par distance de Levenshtein (si faute de 1 ou 2 caractères sur un grand fournisseur)
    for major_domain in MAJOR_DOMAINS:
        dist = levenshtein_distance(domain_part, major_domain)
        if 1 <= dist <= 2:
            logger.info("autocorrect_email_fuzzy original=%s corrected=%s dist=%s", domain_part, major_domain, dist)
            return f"{user_part}@{major_domain}"

    return clean_email


@lru_cache(maxsize=512)
def is_domain_routable(domain: str) -> bool:
    """Vérifie via la résolution DNS si le domaine possède des enregistrements réseau valides."""
    if not domain or domain.lower() in BLOCKED_DOMAINS:
        return False

    domain_clean = domain.lower().strip()
    try:
        socket.getaddrinfo(domain_clean, 80)
        return True
    except Exception:
        logger.warning("email_domain_dns_failed domain=%s", domain_clean)
        return False


def is_valid_real_email(email: str) -> bool:
    """Valide la syntaxe, filtre les adresses de test et vérifie le DNS du domaine."""
    if not email:
        return False

    corrected_email = autocorrect_email(email)
    if not EMAIL_REGEX.match(corrected_email):
        return False

    try:
        user_part, domain_part = corrected_email.rsplit("@", 1)
    except ValueError:
        return False

    if not user_part or not domain_part:
        return False

    if domain_part in BLOCKED_DOMAINS:
        return False

    return is_domain_routable(domain_part)
