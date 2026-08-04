from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsCourier

from .models import CourierLocation
from .serializers import CourierLocationSerializer


class UpdateCourierLocationView(APIView):
    """Livreurs authentifiés uniquement — pousse la position GPS."""

    permission_classes = [permissions.IsAuthenticated, IsCourier]

    def post(self, request):
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")
        heading = request.data.get("heading", 0.0)
        speed = request.data.get("speed", 0.0)
        order_id = request.data.get("order_id")

        if latitude is None or longitude is None:
            return Response(
                {"error": "latitude et longitude sont requises."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        location = CourierLocation.objects.create(
            courier=request.user,
            order_id=order_id,
            latitude=latitude,
            longitude=longitude,
            heading=heading,
            speed=speed,
        )
        serializer = CourierLocationSerializer(location)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LatestCourierLocationView(APIView):
    """Dernière position — réservé livreur/admin (plus d'accès anonyme)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id=None):
        user = request.user
        if user.role not in ("courier", "admin") and not user.is_superuser:
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        if order_id:
            loc = CourierLocation.objects.filter(order_id=order_id).order_by("-timestamp").first()
        else:
            courier_id = request.query_params.get("courier_id")
            if not courier_id:
                return Response(
                    {"error": "order_id ou courier_id requis."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if user.role == "courier" and str(user.id) != str(courier_id):
                return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
            loc = CourierLocation.objects.filter(courier_id=courier_id).order_by("-timestamp").first()

        if not loc:
            return Response(
                {"error": "Aucune position enregistrée."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CourierLocationSerializer(loc)
        return Response(serializer.data)
