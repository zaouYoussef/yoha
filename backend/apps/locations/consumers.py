import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import CourierLocation


class CourierLocationConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket pour le suivi GPS en direct des livreurs YoHa (Campus CHU & Tanger).
    Canal : /ws/locations/courier/{order_id}/
    """
    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs'].get('order_id')
        self.room_group_name = f"courier_location_{self.order_id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Le livreur envoie sa nouvelle position GPS (latitude, longitude, heading, speed).
        """
        data = json.loads(text_data)
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        heading = data.get('heading', 0.0)
        speed = data.get('speed', 0.0)
        courier_id = data.get('courier_id')

        if latitude and longitude and courier_id:
            await self.save_location(courier_id, self.order_id, latitude, longitude, heading, speed)

            # Broadcast aux abonnés (client, restaurant, admin)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'location_update',
                    'courier_id': courier_id,
                    'order_id': self.order_id,
                    'latitude': float(latitude),
                    'longitude': float(longitude),
                    'heading': float(heading),
                    'speed': float(speed),
                }
            )

    async def location_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'courier_id': event['courier_id'],
            'order_id': event['order_id'],
            'latitude': event['latitude'],
            'longitude': event['longitude'],
            'heading': event['heading'],
            'speed': event['speed'],
        }))

    @sync_to_async
    def save_location(self, courier_id, order_id, latitude, longitude, heading, speed):
        return CourierLocation.objects.create(
            courier_id=courier_id,
            order_id=order_id if order_id and order_id != 'latest' else None,
            latitude=latitude,
            longitude=longitude,
            heading=heading,
            speed=speed
        )
