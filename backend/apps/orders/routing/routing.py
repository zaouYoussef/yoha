from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/orders/(?P<public_id>[^/]+)/$", consumers.OrderConsumer.as_asgi()),
    re_path(r"ws/courier/location/$", consumers.CourierLocationConsumer.as_asgi()),
    re_path(r"ws/cart/sync/$", consumers.CartConsumer.as_asgi()),
]
