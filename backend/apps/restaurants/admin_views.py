from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import log_audit
from apps.orders.models import CourierProfile

from .models import Restaurant
from .serializers import RestaurantDetailSerializer, RestaurantListSerializer


class AdminRestaurantListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        qs = Restaurant.objects.all()
        serializer = RestaurantListSerializer(qs, many=True)
        return Response(serializer.data)


class AdminRestaurantCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        data = request.data
        name = data.get("name", "").strip()
        cuisine = data.get("cuisine", "").strip()
        if not name or not cuisine:
            return Response({"detail": "name et cuisine requis."}, status=status.HTTP_400_BAD_REQUEST)
        slug = data.get("slug", "") or slugify(name)
        base_slug = slug
        n = 1
        while Restaurant.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{n}"
            n += 1

        from django.contrib.auth import get_user_model
        User = get_user_model()

        owner = None
        owner_email = data.get("email", "").strip().lower()
        if owner_email:
            owner, created = User.objects.get_or_create(
                email=owner_email,
                defaults={
                    "display_name": data.get("display_name", "").strip() or name,
                    "role": "restaurant",
                },
            )
            if created:
                password = data.get("password", "")
                if password:
                    owner.set_password(password)
                    owner.save(update_fields=["password"])
        else:
            owner_id = data.get("owner_id")
            if owner_id:
                try:
                    owner = User.objects.get(pk=owner_id, role="restaurant")
                except User.DoesNotExist:
                    pass

        resto = Restaurant.objects.create(
            slug=slug,
            name=name,
            cuisine=cuisine,
            tags=data.get("tags") or [cuisine.capitalize()],
            description=data.get("description", ""),
            distance_label=data.get("distance_label", ""),
            promo_label=data.get("promo_label", ""),
            fee_label=data.get("fee_label", "Livraison offerte"),
            phone=data.get("phone", ""),
            owner=owner,
        )
        log_audit(
            actor=request.user,
            action="admin.restaurant.create",
            target_type="restaurant",
            target_id=str(resto.pk),
            metadata={"name": name, "cuisine": cuisine},
        )
        return Response(RestaurantDetailSerializer(resto).data, status=status.HTTP_201_CREATED)


class AdminRestaurantDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != "admin":
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        try:
            resto = Restaurant.objects.get(pk=pk)
        except Restaurant.DoesNotExist:
            return Response({"detail": "Restaurant introuvable."}, status=status.HTTP_404_NOT_FOUND)
        log_audit(
            actor=request.user,
            action="admin.restaurant.delete",
            target_type="restaurant",
            target_id=str(resto.pk),
            metadata={"name": resto.name},
        )
        resto.is_active = False
        resto.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)
