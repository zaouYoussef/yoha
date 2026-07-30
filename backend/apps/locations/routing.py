from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/locations/courier/(?P<order_id>\w+)/$', consumers.CourierLocationConsumer.as_asgi()),
]
