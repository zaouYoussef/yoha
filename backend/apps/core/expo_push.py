"""Envoi de notifications via l'API Expo Push (FCM/APNs côté Expo)."""

import json
import logging
import time
import urllib.error
import urllib.request

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_expo_push(
    tokens: list[str],
    *,
    title: str,
    body: str,
    data: dict | None = None,
    channel_id: str = "orders",
) -> int:
    """Retourne le nombre de messages acceptés par Expo."""
    clean = [t.strip() for t in tokens if t and str(t).strip().startswith("ExponentPushToken")]
    if not clean:
        return 0

    sent = 0
    batch_size = 100
    expires_at = int(time.time()) + 86400
    for i in range(0, len(clean), batch_size):
        chunk = clean[i : i + batch_size]
        messages = [
            {
                "to": token,
                "title": title,
                "body": body,
                "sound": "default",
                "priority": "high",
                "channelId": channel_id,
                # Garde la notif en file FCM/APNs si le téléphone est éteint (~24h)
                "ttl": 86400,
                "expiration": expires_at,
                "data": data or {},
            }
            for token in chunk
        ]
        try:
            req = urllib.request.Request(
                EXPO_PUSH_URL,
                data=json.dumps(messages).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            if isinstance(payload, dict) and payload.get("data"):
                for item in payload["data"]:
                    if item.get("status") == "ok":
                        sent += 1
                    else:
                        logger.warning(
                            "expo_push_item_error status=%s message=%s details=%s",
                            item.get("status"),
                            item.get("message"),
                            item.get("details"),
                        )
            else:
                sent += len(chunk)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            logger.warning("expo_push_failed count=%s err=%s", len(chunk), exc)
    return sent
