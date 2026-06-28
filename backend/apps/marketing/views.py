from django.http import HttpResponse
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PromoCode
from .serializers import PromoCodeSerializer, ValidatePromoSerializer
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


class AdminPromoListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        promos = PromoCode.objects.all()
        serializer = PromoCodeSerializer(promos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PromoCodeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AdminPromoDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return PromoCode.objects.get(pk=pk)
        except PromoCode.DoesNotExist:
            return None

    def patch(self, request, pk):
        promo = self.get_object(pk)
        if not promo:
            return Response({"detail": "Code promo introuvable."}, status=404)
        serializer = PromoCodeSerializer(promo, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        promo = self.get_object(pk)
        if not promo:
            return Response({"detail": "Code promo introuvable."}, status=404)
        promo.delete()
        return Response(status=204)


class ValidatePromoView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = ValidatePromoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        code = serializer.validated_data["code"].strip().upper()
        section = serializer.validated_data["section"]

        try:
            promo = PromoCode.objects.get(code=code, active=True)
        except PromoCode.DoesNotExist:
            return Response({"valid": False, "detail": "Code promo invalide ou inactif."}, status=404)

        if promo.section != "all" and promo.section != section:
            return Response(
                {"valid": False, "detail": "Ce code promo ne s'applique pas à cette section."},
                status=400,
            )

        return Response({
            "valid": True,
            "code": promo.code,
            "discount": promo.discount,
            "section": promo.section,
        })
