from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CourierLocation
from .serializers import CourierLocationSerializer


class UpdateCourierLocationView(APIView):
    """
    API endpoint permettant aux livreurs de pousser leur position GPS actuelle.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        heading = request.data.get('heading', 0.0)
        speed = request.data.get('speed', 0.0)
        order_id = request.data.get('order_id')

        if not latitude or not longitude:
            return Response({'error': 'latitude et longitude sont requises.'}, status=status.HTTP_400_BAD_REQUEST)

        location = CourierLocation.objects.create(
            courier=request.user,
            order_id=order_id,
            latitude=latitude,
            longitude=longitude,
            heading=heading,
            speed=speed
        )
        serializer = CourierLocationSerializer(location)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LatestCourierLocationView(APIView):
    """
    Récupère la toute dernière position GPS connue d'un livreur ou d'une commande.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, order_id=None):
        if order_id:
            loc = CourierLocation.objects.filter(order_id=order_id).order_by('-timestamp').first()
        else:
            courier_id = request.query_params.get('courier_id')
            if not courier_id:
                return Response({'error': 'order_id ou courier_id requis.'}, status=status.HTTP_400_BAD_REQUEST)
            loc = CourierLocation.objects.filter(courier_id=courier_id).order_by('-timestamp').first()

        if not loc:
            return Response({'error': 'Aucune position enregistrée.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CourierLocationSerializer(loc)
        return Response(serializer.data)
