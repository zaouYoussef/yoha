import json
import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


def notify_order_status(public_id: str, status: str, eta_minutes: int | None = None):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    message = {
        "type": "order_state_update",
        "data": {
            "public_id": public_id,
            "status": status,
            "eta_minutes": eta_minutes,
            "updated_at": __import__("datetime").datetime.now().isoformat(),
        },
    }
    try:
        async_to_sync(channel_layer.group_send)(
            f"order_{public_id}",
            message,
        )
    except Exception as e:
        logger.warning("WS notify failed for %s: %s", public_id, e)


def notify_courier_location(public_id: str, lat: float, lng: float, heading: float = 0):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    message = {
        "type": "order_location_update",
        "data": {
            "lat": lat,
            "lng": lng,
            "heading": heading,
            "timestamp": __import__("datetime").datetime.now().isoformat(),
        },
    }
    try:
        async_to_sync(channel_layer.group_send)(
            f"order_{public_id}",
            message,
        )
    except Exception as e:
        logger.warning("WS location notify failed for %s: %s", public_id, e)
