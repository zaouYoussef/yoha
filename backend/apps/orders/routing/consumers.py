import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from apps.orders.models import Order

logger = logging.getLogger(__name__)


class OrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.public_id = self.scope["url_route"]["kwargs"]["public_id"]
        self.order_group = f"order_{self.public_id}"

        user = self.scope.get("user")
        if user and user.is_authenticated:
            can_access = await self._user_can_access(user)
            if not can_access:
                await self.close(code=403)
                return
        else:
            token = self.scope.get("query_string", b"").decode()
            token_valid = await self._validate_guest_token(token)
            if not token_valid:
                await self.close(code=403)
                return

        await self.channel_layer.group_add(self.order_group, self.channel_name)
        await self.accept()

        order = await self._get_order_data()
        if order:
            await self.send(text_data=json.dumps({
                "type": "order.state",
                "data": order,
            }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.order_group, self.channel_name)

    async def receive(self, text_data):
        try:
            msg = json.loads(text_data)
        except json.JSONDecodeError:
            return
        msg_type = msg.get("type", "")
        if msg_type == "ping":
            await self.send(text_data=json.dumps({"type": "pong"}))
        elif msg_type == "order.request_state":
            order = await self._get_order_data()
            if order:
                await self.send(text_data=json.dumps({
                    "type": "order.state",
                    "data": order,
                }))

    async def order_state_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "order.state",
            "data": event["data"],
        }))

    async def order_location_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "order.location",
            "data": event["data"],
        }))

    @database_sync_to_async
    def _get_order_data(self):
        try:
            order = Order.objects.select_related(
                "restaurant", "courier__user"
            ).get(public_id=self.public_id)
            return {
                "public_id": order.public_id,
                "status": order.status,
                "eta_minutes": order.eta_minutes,
                "courier_location": (
                    {"lat": order.courier.lat, "lng": order.courier.lng}
                    if order.courier and hasattr(order.courier, "lat")
                    else None
                ),
                "updated_at": order.updated_at.isoformat() if order.updated_at else None,
            }
        except Order.DoesNotExist:
            return None

    @database_sync_to_async
    def _user_can_access(self, user):
        try:
            order = Order.objects.get(public_id=self.public_id)
            return (
                order.client == user
                or order.courier and order.courier.user == user
                or order.restaurant.owner == user
                or user.is_staff
            )
        except Order.DoesNotExist:
            return False

    @database_sync_to_async
    def _validate_guest_token(self, token):
        return bool(token) and len(token) > 8


class CourierLocationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=403)
            return
        self.courier_group = f"courier_{user.id}"
        await self.channel_layer.group_add(self.courier_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.courier_group, self.channel_name)

    async def receive(self, text_data):
        try:
            msg = json.loads(text_data)
        except json.JSONDecodeError:
            return
        if msg.get("type") == "location.update":
            lat = msg.get("lat")
            lng = msg.get("lng")
            heading = msg.get("heading", 0)
            order_id = msg.get("order_id")
            await self._save_location(lat, lng, heading, order_id)
            await self.channel_layer.group_send(
                f"order_{order_id}",
                {
                    "type": "order.location_update",
                    "data": {
                        "lat": lat,
                        "lng": lng,
                        "heading": heading,
                        "courier_id": user.id,
                        "timestamp": msg.get("timestamp", ""),
                    },
                },
            )

    @database_sync_to_async
    def _save_location(self, lat, lng, heading, order_id):
        from apps.orders.models import CourierLocation
        CourierLocation.objects.create(
            order_id=order_id,
            courier=self.scope["user"].courier_profile,
            latitude=lat,
            longitude=lng,
            heading=heading,
        )


class CartConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=403)
            return
        self.cart_group = f"cart_{user.id}"
        await self.channel_layer.group_add(self.cart_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.cart_group, self.channel_name)

    async def receive(self, text_data):
        pass

    async def cart_sync(self, event):
        await self.send(text_data=json.dumps({
            "type": "cart.sync",
            "data": event["data"],
        }))
