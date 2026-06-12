from .base import *  # noqa: F403

DEBUG = True

# Tunnel (localtunnel / cloudflare) + Expo Go : accepter tout host en dev local
ALLOWED_HOSTS = ["*"]

# Dev local : pas de rate-limit global (évite « Requête ralentie » au hot-reload / polling)
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["anon"] = "10000/hour"  # noqa: F405
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["user"] = "10000/hour"  # noqa: F405

# Expo Web (8081/8082) + tests locaux : autoriser toutes les origines en dev
CORS_ALLOW_ALL_ORIGINS = True

# SMTP si EMAIL_HOST est défini dans .env, sinon console (dev)
if not EMAIL_HOST:  # noqa: F405
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
