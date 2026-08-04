from .base import *  # noqa: F403

DEBUG = False

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
)

# Forcer HTTPS / cookies sécurisés en production (ignorer env trop permissif)
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

ALLOWED_HOSTS = [
    "yoha.ma",
    "www.yoha.ma",
    "localhost",
    "127.0.0.1",
]
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
CORS_ALLOWED_ORIGINS = [
    "https://yoha.ma",
    "https://www.yoha.ma",
]
CSRF_TRUSTED_ORIGINS = [
    "https://yoha.ma",
    "https://www.yoha.ma",
]

# Outils catalogue sync : off par défaut en prod (activer via env si besoin)
GLOVO_TOOLS = {
    **GLOVO_TOOLS,  # noqa: F405
    "add": env.bool("GLOVO_TOOL_ADD", default=False),  # noqa: F405
    "discover": env.bool("GLOVO_TOOL_DISCOVER", default=False),  # noqa: F405
    "sync": env.bool("GLOVO_TOOL_SYNC", default=False),  # noqa: F405
    "logs": env.bool("GLOVO_TOOL_LOGS", default=False),  # noqa: F405
}
