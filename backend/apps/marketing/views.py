from django.http import HttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import unsubscribe_email


class UnsubscribeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        token = request.query_params.get("token", "")
        accept = request.headers.get("Accept", "")
        wants_json = "application/json" in accept or request.query_params.get("format") == "json"

        if not token or not unsubscribe_email(token):
            if wants_json:
                return Response({"detail": "Lien invalide ou expiré."}, status=400)
            return HttpResponse(
                "<html><body style='font-family:sans-serif;text-align:center;padding:48px;'>"
                "<h1>YouHa</h1><p>Lien de désinscription invalide ou expiré.</p></body></html>",
                status=400,
            )

        if wants_json:
            return Response({"detail": "Désinscription confirmée.", "unsubscribed": True})

        return HttpResponse(
            "<html><body style='font-family:sans-serif;text-align:center;padding:48px;background:#fff7ed;'>"
            "<div style='max-width:420px;margin:0 auto;background:#fff;padding:32px;border-radius:16px;'>"
            "<h1 style='color:#f97316;'>YouHa</h1>"
            "<p>Vous ne recevrez plus nos offres par e-mail.</p>"
            "<p style='color:#64748b;font-size:14px;'>Vous continuez à recevoir le suivi de vos commandes.</p>"
            "</div></body></html>",
            content_type="text/html; charset=utf-8",
        )
