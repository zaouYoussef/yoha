from .base import *  # noqa: F403

DEBUG = False

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
)

SECURE_SSL_REDIRECT = env("SECURE_SSL_REDIRECT")
SESSION_COOKIE_SECURE = env("SESSION_COOKIE_SECURE")
CSRF_COOKIE_SECURE = env("CSRF_COOKIE_SECURE")
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

ALLOWED_HOSTS = [
    "94.237.99.114",
    "localhost",
]
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
CORS_ALLOWED_ORIGINS = [
    "http://94.237.99.114",
]

