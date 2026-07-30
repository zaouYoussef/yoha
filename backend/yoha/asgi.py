import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "yoha.settings.production")

django_asgi = get_asgi_application()

from apps.orders.routing.routing import websocket_urlpatterns as orders_ws
from apps.locations.routing import websocket_urlpatterns as locations_ws

application = ProtocolTypeRouter({
    "http": django_asgi,
    "websocket": AuthMiddlewareStack(
        URLRouter(orders_ws + locations_ws)
    ),
})

