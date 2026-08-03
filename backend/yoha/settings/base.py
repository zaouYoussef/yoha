"""
Configuration commune YoHa — sécurité par défaut élevée.
"""
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    DJANGO_CORS_ALLOWED_ORIGINS=(list, []),
    SECURE_SSL_REDIRECT=(bool, False),
    SESSION_COOKIE_SECURE=(bool, False),
    CSRF_COOKIE_SECURE=(bool, False),
)

environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DJANGO_DEBUG")
ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS")

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # tiers
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "axes",
    "channels",

    # YoHa
    "apps.core",
    "apps.accounts",
    "apps.restaurants",
    "apps.orders",
    "apps.payments",
    "apps.audit",
    "apps.marketing",
    "apps.locations",
    "apps.pharmacy",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "axes.middleware.AxesMiddleware",
    "apps.core.middleware.RequestIdMiddleware",
    "apps.core.middleware.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "yoha.urls"
WSGI_APPLICATION = "yoha.wsgi.application"
ASGI_APPLICATION = "yoha.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
    )
}
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)
DATABASES["default"]["OPTIONS"] = DATABASES["default"].get("OPTIONS", {})
if DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql":
    DATABASES["default"]["OPTIONS"].setdefault(
        "connect_timeout",
        env.int("DB_CONNECT_TIMEOUT", default=10),
    )

AUTH_USER_MODEL = "accounts.User"
AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    {"NAME": "apps.accounts.validators.YohaPasswordValidator"},
]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Casablanca"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ——— Médias (images WebP compressées, stockage objet — pas en BDD) ———
MEDIA_URL = env("MEDIA_URL", default="/media/")
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_PUBLIC_BASE_URL = env("MEDIA_PUBLIC_BASE_URL", default="")
MEDIA_STORAGE_BACKEND = env("MEDIA_STORAGE_BACKEND", default="local")  # local | s3

_static_storage = {
    "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
}

if MEDIA_STORAGE_BACKEND == "s3":
    AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default="")
    AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default="")
    AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", default="")
    AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="auto")
    AWS_S3_ENDPOINT_URL = env("AWS_S3_ENDPOINT_URL", default="")
    AWS_S3_CUSTOM_DOMAIN = env("AWS_S3_CUSTOM_DOMAIN", default="")
    AWS_DEFAULT_ACL = None
    AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "public, max-age=31536000, immutable"}
    AWS_QUERYSTRING_AUTH = False
    STORAGES = {
        "staticfiles": _static_storage,
        "default": {"BACKEND": "storages.backends.s3boto3.S3Boto3Storage"},
    }
    if AWS_S3_CUSTOM_DOMAIN and not MEDIA_PUBLIC_BASE_URL:
        MEDIA_PUBLIC_BASE_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}"
else:
    STORAGES = {
        "staticfiles": _static_storage,
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
            "OPTIONS": {"location": MEDIA_ROOT, "base_url": MEDIA_URL},
        },
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ——— Cache & sessions (Redis) ———
_redis_url = env("REDIS_URL", default="")
if _redis_url:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": _redis_url,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "SOCKET_CONNECT_TIMEOUT": 5,
                "SOCKET_TIMEOUT": 5,
                "IGNORE_EXCEPTIONS": True,
            },
        }
    }
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "yoha-local",
        }
    }

# ——— Channels (WebSocket) ———
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [_redis_url] if _redis_url else [("127.0.0.1", 6379)],
            "capacity": 1500,
            "expiry": 60,
        },
    },
}

# ——— CORS ———
CORS_ALLOWED_ORIGINS = env("DJANGO_CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

# ——— DRF ———
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "600/hour",
        "user": "5000/hour",
        "auth": "20/minute",
        "checkout": "30/hour",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.core.exceptions.yoha_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "YoHa API",
    "DESCRIPTION": "Plateforme livraison campus / CHU — API sécurisée",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# ——— JWT ———
_jwt_key = env("JWT_SIGNING_KEY", default="")
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=365),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": _jwt_key or SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ——— OAuth (Google / Apple / Firebase) ———
GOOGLE_OAUTH_CLIENT_IDS = env("GOOGLE_OAUTH_CLIENT_IDS", default="")
APPLE_CLIENT_ID = env("APPLE_CLIENT_ID", default="ma.yoha.app")
FIREBASE_PROJECT_ID = env("FIREBASE_PROJECT_ID", default="")

# ——— Brute-force (django-axes) ———
AXES_FAILURE_LIMIT = env.int("AXES_FAILURE_LIMIT", default=15)
AXES_COOLOFF_TIME = timedelta(minutes=env.int("AXES_COOLOFF_MINUTES", default=5))
AXES_LOCKOUT_PARAMETERS = ["ip_address", "username"]
AXES_RESET_ON_SUCCESS = True
AXES_ENABLED = env.bool("AXES_ENABLED", default=True)

# ——— Chiffrement PII ———
FIELD_ENCRYPTION_KEY = env("FIELD_ENCRYPTION_KEY", default="")

# ——— YoHa business rules (alignées frontend) ———
YOHA_PROFIT_FACTOR = "0.20"
YOHA_PROFIT_FIXED_MAD = "12.00"
YOHA_SERVICE_FEE_LOW_MAD = "12.00"
YOHA_SERVICE_FEE_HIGH_MAD = "30.00"
YOHA_SERVICE_FEE_THRESHOLD_MAD = "3000.00"
YOHA_DELIVERY_FEE_MAD = "0.00"
YOHA_FRONTEND_URL = env("YOHA_FRONTEND_URL", default="http://localhost:3002")

# E-mails livreurs alertés à chaque nouvelle commande (premier confirmé = course prise)
YOHA_COURIER_NOTIFY_EMAILS = env.list("YOHA_COURIER_NOTIFY_EMAILS", default=[])

# --- Web Push (VAPID) pour notifications navigateur ---
VAPID_PUBLIC_KEY = env("VAPID_PUBLIC_KEY", default="")
VAPID_PRIVATE_KEY = env("VAPID_PRIVATE_KEY", default="")
VAPID_CLAIMS_EMAIL = env("VAPID_CLAIMS_EMAIL", default="no-reply@yoha.ma")

# ——— E-mail (notifications commande) ———
EMAIL_HOST = env("EMAIL_HOST", default="")
if EMAIL_HOST:
    EMAIL_PORT = env.int("EMAIL_PORT", default=587)
    EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
    EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="").replace(" ", "")
    EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
    EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
    DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="yohadelivery@gmail.com")
    EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="yohadelivery@gmail.com")


# ——— Campagnes promo e-mail (2× / semaine) ———
PROMO_SCHEDULER_ENABLED = env.bool("PROMO_SCHEDULER_ENABLED", default=True)
PROMO_SCHEDULER_TIMEZONE = env("PROMO_SCHEDULER_TIMEZONE", default="Africa/Casablanca")
PROMO_SCHEDULER_DAYS = env("PROMO_SCHEDULER_DAYS", default="tue,sat")
PROMO_SCHEDULER_HOUR = env.int("PROMO_SCHEDULER_HOUR", default=11)
PROMO_SCHEDULER_MINUTE = env.int("PROMO_SCHEDULER_MINUTE", default=0)


# ——— Synchronisation des pharmacies de garde (toutes les 30 min, miroir infopoint) ———
PHARMACY_SCHEDULER_ENABLED = env.bool("PHARMACY_SCHEDULER_ENABLED", default=True)
PHARMACY_SCHEDULER_INTERVAL_MINUTES = env.int("PHARMACY_SCHEDULER_INTERVAL_MINUTES", default=30)
# Rétro-compatibilité (ex-horaire quotidien) — plus utilisé, conservé pour d'éventuels .env
PHARMACY_SCHEDULER_HOUR = env.int("PHARMACY_SCHEDULER_HOUR", default=12)
PHARMACY_SCHEDULER_MINUTE = env.int("PHARMACY_SCHEDULER_MINUTE", default=0)
PROMO_CAMPAIGN_MIN_DAYS = env.int("PROMO_CAMPAIGN_MIN_DAYS", default=2)
PROMO_EMAIL_DELAY_SECONDS = env.float("PROMO_EMAIL_DELAY_SECONDS", default=1.0)

# ——— Synchronisation des menus Glovo (Tanger, toutes les 2 jours) ———
GLOVO_SYNC_ENABLED = env.bool("GLOVO_SYNC_ENABLED", default=True)
GLOVO_CITY_CODE = env("GLOVO_CITY_CODE", default="TAN")
GLOVO_CITY_SLUG = env("GLOVO_CITY_SLUG", default="tanger")  # slug web (glovoapp.com/ma/fr/<city>/…)
GLOVO_COUNTRY_CODE = env("GLOVO_COUNTRY_CODE", default="ma")
GLOVO_LATITUDE = env.float("GLOVO_LATITUDE", default=35.7595)
GLOVO_LONGITUDE = env.float("GLOVO_LONGITUDE", default=-5.8340)
GLOVO_LANGUAGE = env("GLOVO_LANGUAGE", default="fr")
GLOVO_SYNC_INTERVAL_DAYS = env.int("GLOVO_SYNC_INTERVAL_DAYS", default=2)
GLOVO_NEXT_RUN_MINUTES = env.int("GLOVO_NEXT_RUN_MINUTES", default=60)
GLOVO_REQUEST_DELAY = env.float("GLOVO_REQUEST_DELAY", default=2.0)
# Outils exposés via /add-glovo/* — token optionnel pour déclenchement externe.
GLOVO_TOOLS = {
    "add": env.bool("GLOVO_TOOL_ADD", default=True),
    "discover": env.bool("GLOVO_TOOL_DISCOVER", default=True),
    "sync": env.bool("GLOVO_TOOL_SYNC", default=True),
    "logs": env.bool("GLOVO_TOOL_LOGS", default=True),
    "token": env("GLOVO_TOOL_TOKEN", default=""),
}

# Stores Glovo de Tanger (IDs découverts). Le menu provient de l'API Glovo ;
# cuisine/tags restent ajustables via l'admin YoHa.
GLOVO_STORES = [
    {
        "slug": "mr-tacos-tanger",
        "glovo_slug": "mr-tacos-tgr",
        "store_id": 355376,
        "address_id": 860274,
        "name": "Mr.Tacos — Tanger",
        "cuisine": "tacos",
        "tags": ["Tacos", "Burger", "Box", "Poutine"],
        "cover_url": "https://glovo.dhmedia.io/image/stores-glovo/stores/ff0eaffbcf05631daf2356646d2d72232338f1b97cbe6a8dd5a5d019bbf73734",
        "logo_url": "https://glovo.dhmedia.io/image/customer-assets-glovo/store_logos/d554a4453c44dfa15e126020b6acb9e8475e1627a8033e4baea358e4f72a6e41",
        "delivery_time": "25-40 min",
        "fee_label": "Livraison offerte",
    },
    {
        "slug": "kamora",
        "glovo_slug": "kamora",
        "store_id": 325469,
        "address_id": 485335,
        "name": "Kamora",
        "cuisine": "burger",
        "tags": ["Burger", "Tacos"],
        "delivery_time": "25-40 min",
    },
    {
        "slug": "new-school-tacos-corniche",
        "glovo_slug": "new-school-tacos-tng",
        "store_id": 105625,
        "address_id": 197266,
        "name": "New School Tacos",
        "cuisine": "tacos",
        "tags": ["Tacos"],
        "delivery_time": "25-40 min",
    },
    {
        "slug": "new-school-tacos-boulevard",
        "glovo_slug": "new-school-tacostng",
        "store_id": 409428,
        "address_id": 605123,
        "name": "New School Tacos",
        "cuisine": "tacos",
        "tags": ["Tacos"],
        "delivery_time": "25-40 min",
    },
    {
        "slug": "l-assiette-verte",
        "glovo_slug": "lassiette-verte-tng",
        "store_id": 542935,
        "address_id": 879639,
        "name": "L'Assiette Verte",
        "cuisine": "healthy",
        "tags": ["Healthy", "Salades"],
        "delivery_time": "25-40 min",
    },
    {
        "slug": "tchoco-charly",
        "glovo_slug": "tchoco-charly-tng",
        "store_id": 539328,
        "address_id": 923965,
        "name": "Tchoco Charly",
        "cuisine": "dessert",
        "tags": ["Chocolat", "Desserts"],
        "delivery_time": "25-40 min",
    },
    {
        "slug": "burns",
        "glovo_slug": "burns-tng",
        "store_id": 557373,
        "address_id": 901525,
        "name": "Burns",
        "cuisine": "burger",
        "tags": ["Burger"],
        "delivery_time": "25-40 min",
    },
    {
        "slug": "melt-99",
        "glovo_slug": "melt-99-tng",
        "store_id": 527388,
        "address_id": 858564,
        "name": "Melt 99",
        "cuisine": "burger",
        "tags": ["Burger", "Grillades"],
        "delivery_time": "25-40 min",
    },
    {
        "slug": "kunafita",
        "glovo_slug": "kunafita",
        "store_id": 174706,
        "address_id": 296550,
        "name": "Kunafita",
        "cuisine": "dessert",
        "tags": ["Kunafa", "Desserts"],
        "delivery_time": "25-40 min",
    },
]

# Réglages fins par store (recette de synchro) : renommages de sections,
# désactivation du purge, tags supplémentaires…
GLOVO_STORE_CONFIGS = {
    "mr-tacos-tanger": {"prune": True},
    "kamora": {"prune": True},
    "new-school-tacos-corniche": {"prune": True},
    "new-school-tacos-boulevard": {"prune": True},
    "l-assiette-verte": {"prune": True},
    "tchoco-charly": {"prune": True},
    "burns": {"prune": True},
    "melt-99": {"prune": True},
    "kunafita": {"prune": True},
}

# ——— Sécurité HTTP ———
SECURE_SSL_REDIRECT = env("SECURE_SSL_REDIRECT")
SESSION_COOKIE_SECURE = env("SESSION_COOKIE_SECURE")
CSRF_COOKIE_SECURE = env("CSRF_COOKIE_SECURE")
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} request_id={request_id} {message}",
            "style": "{",
        },
    },
    "filters": {
        "request_id": {"()": "apps.core.request_logging.RequestIdFilter"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "filters": ["request_id"],
        },
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.security": {"level": "WARNING"},
        "apps": {"level": "INFO"},
    },
}
