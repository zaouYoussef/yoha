import json
import logging

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .push_models import WebPushSubscription

logger = logging.getLogger(__name__)


class VapidPublicKeyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        key = getattr(settings, "VAPID_PUBLIC_KEY", "")
        if not key:
            return Response({"detail": "VAPID non configur\u00e9."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"publicKey": key})


class WebPushSubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = json.loads(request.body) if isinstance(request.body, (bytes, bytearray)) else request.data
        except (TypeError, ValueError):
            data = request.data

        endpoint = str(data.get("endpoint") or "").strip()
        p256dh = str(data.get("p256dh") or data.get("keys", {}).get("p256dh") or "").strip()
        auth = str(data.get("auth") or data.get("keys", {}).get("auth") or "").strip()

        if not endpoint or not p256dh or not auth:
            return Response({"detail": "endpoint, p256dh, auth requis."}, status=status.HTTP_400_BAD_REQUEST)

        WebPushSubscription.objects.update_or_create(
            user=request.user,
            endpoint=endpoint,
            defaults={
                "p256dh_key": p256dh,
                "auth_key": auth,
                "user_agent": str(request.META.get("HTTP_USER_AGENT", ""))[:500],
            },
        )
        logger.info("web_push_subscribed user=%s endpoint=%.48s", request.user.id, endpoint)
        return Response({"ok": True})


class WebPushUnsubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = json.loads(request.body) if isinstance(request.body, (bytes, bytearray)) else request.data
        except (TypeError, ValueError):
            data = request.data

        endpoint = str(data.get("endpoint") or "").strip()
        if endpoint:
            deleted, _ = WebPushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        else:
            deleted, _ = WebPushSubscription.objects.filter(user=request.user).delete()
        logger.info("web_push_unsubscribed user=%s deleted=%s", request.user.id, deleted)
        return Response({"ok": True})
