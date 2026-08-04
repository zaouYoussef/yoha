from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.audit.services import log_audit
from apps.core.media import ImageProcessingError, process_and_store
from apps.core.permissions import IsAdmin, IsCourier, IsRestaurant
from apps.payments.services import record_cod_payment

from django.utils import timezone

from .models import CourierLocation, CourierProfile, Order, Review
from .push_models import OrderPushSubscription
from .security import emails_match, guest_may_access_order, is_short_public_id
from .serializers import (
    AssignCourierSerializer,
    CheckoutSerializer,
    CourierLocationSerializer,
    CourierSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    ReviewCreateSerializer,
    ReviewSerializer,
)
from .services import assign_courier, auto_dispatch_order, mark_order_ready_for_pickup, send_to_restaurant, transition_order


class CheckoutView(APIView):
    """Création de commande — prix recalculés côté serveur."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"

    def post(self, request):
        ser = CheckoutSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        order = ser.save()
        record_cod_payment(order=order, actor=request.user if request.user.is_authenticated else None)
        from .courier_notifications import notify_couriers_new_order
        from .notifications import send_order_status_email

        send_order_status_email(order, Order.Status.PLACED)
        notify_couriers_new_order(order)
        from .push_notifications import notify_client_order_status

        notify_client_order_status(order, Order.Status.PLACED)
        log_audit(
            actor=request.user if request.user.is_authenticated else None,
            action="order.created",
            target_type="order",
            target_id=str(order.id),
            ip=request.META.get("REMOTE_ADDR"),
            metadata={
                "public_id": order.public_id,
                "total": str(order.total_mad),
                "client_id": str(order.client_id) if order.client_id else None,
            },
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrdonnanceUploadView(APIView):
    """Upload multipart de l'image d'ordonnance (commandes pharmacie sur-mesure).

    Retourne l'URL publique à joindre au checkout via `ordonnance_url`.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"

    def post(self, request):
        uploaded = request.FILES.get("file")
        if not uploaded:
            raise ValidationError("Fichier image requis (file).")

        try:
            stored = process_and_store(
                uploaded,
                folder="ordonnances",
                purpose="prescription",
            )
        except ImageProcessingError as exc:
            raise ValidationError(str(exc)) from exc

        return Response(
            {
                "url": stored.url,
                "thumb_url": stored.thumb_url,
                "width": stored.width,
                "height": stored.height,
            },
            status=status.HTTP_201_CREATED,
        )


class ClaimOrdersView(APIView):
    """Associe des commandes invité au compte client (e-mail doit correspondre)."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user"

    def post(self, request):
        user = request.user
        if user.role != "client":
            return Response({"detail": "Réservé aux comptes client."}, status=status.HTTP_403_FORBIDDEN)

        raw = request.data.get("public_ids")
        if not isinstance(raw, list):
            return Response({"detail": "public_ids doit être une liste."}, status=status.HTTP_400_BAD_REQUEST)

        ids = [str(i).strip() for i in raw if str(i).strip()][:30]
        if not ids:
            return Response({"claimed": 0, "orders": []})

        user_email = (user.email or "").strip().lower()
        qs = Order.objects.filter(public_id__in=ids, client__isnull=True)
        claimable = []
        for order in qs:
            # Sécurité : ne pas s'approprier une commande d'autrui
            if order.customer_email and emails_match(user_email, order.customer_email):
                claimable.append(order.pk)
            elif not order.customer_email and not is_short_public_id(order.public_id):
                # Ancien flux sans e-mail + ID long : rare ; refuse short IDs
                claimable.append(order.pk)

        claimed = 0
        if claimable:
            claimed = Order.objects.filter(pk__in=claimable, client__isnull=True).update(client=user)

        linked = (
            Order.objects.filter(public_id__in=ids, client=user)
            .select_related("restaurant", "courier")
            .prefetch_related("lines")
        )
        if claimed:
            log_audit(
                actor=user,
                action="order.claimed",
                target_type="order",
                target_id=",".join(ids[:5]),
                ip=request.META.get("REMOTE_ADDR"),
                metadata={"claimed": claimed},
            )
        return Response(
            {"claimed": claimed, "orders": OrderSerializer(linked, many=True, context={"request": request}).data},
        )


class GuestOrdersView(APIView):
    """Récupère des commandes invité par IDs publics (non énumérables)."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "anon"

    def post(self, request):
        raw = request.data.get("public_ids")
        if not isinstance(raw, list):
            return Response({"detail": "public_ids doit être une liste."}, status=400)
        ids = [str(i).strip() for i in raw if str(i).strip()][:30]
        if not ids:
            return Response([])

        email = str(request.data.get("email") or "").strip().lower()
        if any(is_short_public_id(i) for i in ids) and not email:
            return Response(
                {"detail": "E-mail requis pour consulter d'anciennes commandes."},
                status=400,
            )

        qs = (
            Order.objects.filter(public_id__in=ids)
            .select_related("restaurant", "courier")
            .prefetch_related("lines")
        )
        allowed = [o for o in qs if guest_may_access_order(o, email=email)]
        return Response(OrderSerializer(allowed, many=True, context={"request": request}).data)


class OrderPushSubscribeView(APIView):
    """Abonne un appareil aux push d'une ou plusieurs commandes (accès contrôlé)."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "anon"

    def post(self, request):
        token = str(request.data.get("token") or "").strip()
        if not token.startswith("ExponentPushToken"):
            return Response({"detail": "Token Expo Push invalide."}, status=400)

        raw = request.data.get("public_ids")
        if not isinstance(raw, list):
            return Response({"detail": "public_ids doit être une liste."}, status=400)

        ids = [str(i).strip() for i in raw if str(i).strip()][:30]
        if not ids:
            return Response({"detail": "Aucun identifiant de commande."}, status=400)

        email = str(request.data.get("email") or "").strip().lower()
        if request.user.is_authenticated and not email:
            email = (request.user.email or "").strip().lower()

        orders = list(Order.objects.filter(public_id__in=ids))
        allowed_ids = [
            o.public_id for o in orders if guest_may_access_order(o, email=email)
        ]

        linked = 0
        for pid in allowed_ids:
            _, created = OrderPushSubscription.objects.get_or_create(
                public_id=pid,
                expo_push_token=token,
            )
            if created:
                linked += 1

        if request.user.is_authenticated and request.user.role == "client":
            from apps.accounts.push_models import PushDevice

            PushDevice.objects.update_or_create(
                expo_push_token=token,
                defaults={
                    "user": request.user,
                    "platform": str(request.data.get("platform") or "")[:20],
                },
            )

        return Response({"subscribed": linked, "public_ids": allowed_ids})


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    throttle_classes = []

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.select_related("restaurant", "courier").prefetch_related("lines")
        if user.role == "admin" or user.is_superuser:
            return qs
        if user.role == "client":
            return qs.filter(client=user)
        if user.role == "restaurant" and user.restaurant_profile_id:
            # Visible après confirmation livreur ; delivering/delivered réservés aux stats.
            return qs.filter(restaurant_id=user.restaurant_profile_id).filter(
                Q(
                    status__in=[
                        Order.Status.PICKUP_CONFIRMED,
                        Order.Status.PREPARING,
                        Order.Status.DELIVERING,
                        Order.Status.DELIVERED,
                    ]
                )
                | Q(
                    status=Order.Status.CANCELLED,
                    cancelled_phase=Order.CancelledPhase.BEFORE_PICKUP,
                    courier__isnull=False,
                )
            )
        if user.role == "courier" and user.courier_profile_id:
            return qs.filter(
                Q(courier_id=user.courier_profile_id)
                | Q(status=Order.Status.PLACED, courier__isnull=True)
                | Q(status=Order.Status.PREPARING, courier__isnull=True)
            )
        return qs.none()


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "public_id"
    lookup_url_kwarg = "public_id"

    def get_queryset(self):
        return OrderListView(request=self.request).get_queryset()


class OrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, public_id):
        order = get_object_or_404(
            OrderListView(request=request).get_queryset(),
            public_id=public_id,
        )
        user = request.user
        if user.role == "restaurant" and order.restaurant_id != user.restaurant_profile_id:
            return Response({"detail": "Accès refusé."}, status=403)
        if user.role == "courier" and order.courier_id is not None and order.courier_id != user.courier_profile_id:
            return Response({"detail": "Accès refusé."}, status=403)

        ser = OrderStatusUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            order = transition_order(
                order=order,
                new_status=ser.validated_data["status"],
                actor=user,
                note=ser.validated_data.get("note", ""),
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)

        # Arrêt du tracking GPS dès que la course est terminée / annulée
        if order.status in (Order.Status.DELIVERED, Order.Status.CANCELLED):
            CourierLocation.objects.filter(order=order).delete()

        return Response(OrderSerializer(order, context={"request": request}).data)


class ClaimOrderView(APIView):
    """Le livreur connecté confirme la course — premier arrivé, premier servi."""

    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        user = request.user
        if user.role != "courier" or not user.courier_profile_id:
            return Response({"detail": "Réservé aux livreurs."}, status=403)
        order = get_object_or_404(Order.objects.all(), public_id=public_id)
        courier = get_object_or_404(
            CourierProfile,
            pk=user.courier_profile_id,
            is_active=True,
        )
        try:
            order = assign_courier(order=order, courier=courier, actor=user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=409)
        return Response(OrderSerializer(order, context={"request": request}).data)


class AutoDispatchView(APIView):
    """Assignation livreur — réservé admin (plus d'accès anonyme)."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user"

    def post(self, request, public_id):
        user = request.user
        if user.role != "admin" and not user.is_superuser:
            return Response({"detail": "Accès refusé."}, status=403)
        order = get_object_or_404(Order.objects.all(), public_id=public_id)
        try:
            order = auto_dispatch_order(order=order)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        return Response(OrderSerializer(order, context={"request": request}).data)


class OrderReadyView(APIView):
    """Restaurant confirme la préparation terminée."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user"

    def post(self, request, public_id):
        user = request.user
        order = get_object_or_404(Order.objects.all(), public_id=public_id)
        if user.role == "restaurant":
            if order.restaurant_id != user.restaurant_profile_id:
                return Response({"detail": "Accès refusé."}, status=403)
        elif user.role != "admin" and not user.is_superuser:
            return Response({"detail": "Accès refusé."}, status=403)
        order = mark_order_ready_for_pickup(order=order, actor=user)
        return Response(OrderSerializer(order, context={"request": request}).data)


class AssignCourierView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        user = request.user
        if user.role not in ("admin", "courier") and not user.is_superuser:
            return Response({"detail": "Accès refusé."}, status=403)
        order = get_object_or_404(Order.objects.all(), public_id=public_id)
        if user.role == "courier":
            if not user.courier_profile_id:
                return Response({"detail": "Profil livreur manquant."}, status=403)
            courier = get_object_or_404(
                CourierProfile,
                pk=user.courier_profile_id,
                is_active=True,
            )
        else:
            ser = AssignCourierSerializer(data=request.data)
            ser.is_valid(raise_exception=True)
            courier = get_object_or_404(
                CourierProfile,
                pk=ser.validated_data["courier_id"],
                is_active=True,
            )
        try:
            order = assign_courier(order=order, courier=courier, actor=request.user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=409)
        return Response(OrderSerializer(order).data)


class SendToRestaurantView(APIView):
    """Le livreur envoie une commande programmée au dashboard du restaurant."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        user = request.user
        if user.role != "courier" or not user.courier_profile_id:
            return Response({"detail": "Réservé aux livreurs."}, status=403)
        order = get_object_or_404(Order.objects.all(), public_id=public_id)
        try:
            order = send_to_restaurant(order=order, actor=user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        return Response(OrderSerializer(order).data)


class CourierListView(generics.ListAPIView):
    """Admin : tous les livreurs. Livreur : uniquement son profil (pas de fuite e-mails)."""

    permission_classes = [IsAuthenticated]
    serializer_class = CourierSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        qs = CourierProfile.objects.select_related("user")
        if user.role == "admin" or user.is_superuser:
            return qs
        if user.role == "courier" and user.courier_profile_id:
            return qs.filter(pk=user.courier_profile_id)
        return qs.none()


class AdminCourierDeleteView(APIView):
    """Admin désactive un livreur (soft-delete)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != "admin":
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        try:
            profile = CourierProfile.objects.get(pk=pk)
        except CourierProfile.DoesNotExist:
            return Response({"detail": "Livreur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        value = request.data.get("is_active")
        if value is None:
            profile.is_active = not bool(profile.is_active)
        else:
            profile.is_active = bool(value)
        profile.save(update_fields=["is_active"])

        return Response(
            {
                "id": profile.pk,
                "is_active": profile.is_active,
                "detail": "Disponibilité mise à jour.",
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        if request.user.role != "admin":
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        try:
            profile = CourierProfile.objects.get(pk=pk)
        except CourierProfile.DoesNotExist:
            return Response({"detail": "Livreur introuvable."}, status=status.HTTP_404_NOT_FOUND)
        profile.is_active = False
        profile.save(update_fields=["is_active"])
        if profile.user:
            profile.user.is_active = False
            profile.user.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class CourierLocationView(APIView):
    """GET : suivi client (ID non énumérable). POST : livreur assigné uniquement."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, public_id):
        try:
            order = Order.objects.filter(public_id=public_id).first()
            if not order:
                return Response({"latitude": None, "longitude": None, "active": False}, status=200)

            email = str(request.query_params.get("email") or "").strip().lower()
            if request.user.is_authenticated and not email:
                email = (request.user.email or "").strip().lower()
            if not guest_may_access_order(order, email=email):
                # Ne pas révéler l'existence
                return Response({"latitude": None, "longitude": None, "active": False}, status=200)

            if order.status in (Order.Status.DELIVERED, Order.Status.CANCELLED):
                CourierLocation.objects.filter(order=order).delete()
                return Response({"latitude": None, "longitude": None, "active": False}, status=200)

            loc = CourierLocation.objects.filter(order=order).order_by("-updated_at").first()
            if not loc:
                return Response({"latitude": None, "longitude": None, "active": False}, status=200)

            age = (timezone.now() - loc.updated_at).total_seconds()
            return Response({
                "latitude": float(loc.latitude),
                "longitude": float(loc.longitude),
                "updated_at": loc.updated_at.isoformat(),
                "active": age < 300,
            })
        except Exception:
            return Response({"latitude": None, "longitude": None, "active": False}, status=200)

    def post(self, request, public_id):
        user = request.user
        if not user.is_authenticated:
            return Response({"detail": "Authentification requise."}, status=401)
        if user.role != "courier" or not user.courier_profile_id:
            return Response({"detail": "Réservé aux livreurs."}, status=403)

        order = Order.objects.filter(public_id=public_id).select_related("courier").first()
        if not order:
            return Response({"detail": "Commande introuvable."}, status=404)

        if order.status in (Order.Status.DELIVERED, Order.Status.CANCELLED):
            CourierLocation.objects.filter(order=order).delete()
            return Response({"detail": "Course terminée — GPS arrêté.", "active": False}, status=400)

        if order.courier_id and order.courier_id != user.courier_profile_id:
            return Response({"detail": "Vous n'êtes pas le livreur de cette course."}, status=403)

        ser = CourierLocationSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        courier = get_object_or_404(
            CourierProfile,
            pk=user.courier_profile_id,
            is_active=True,
        )
        if not order.courier_id:
            order.courier = courier
            order.save(update_fields=["courier"])

        loc, _ = CourierLocation.objects.update_or_create(
            order=order,
            courier=courier,
            defaults={
                "latitude": ser.validated_data["latitude"],
                "longitude": ser.validated_data["longitude"],
            },
        )
        return Response({
            "latitude": float(loc.latitude),
            "longitude": float(loc.longitude),
            "updated_at": loc.updated_at.isoformat(),
            "active": True,
        })


class ReviewView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ReviewCreateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return Response({
            "id": str(obj.id),
            "rating": obj.rating,
            "comment": obj.comment,
            "created_at": obj.created_at.isoformat(),
        }, status=201)

    def get(self, request):
        if request.user.role != "admin" and not request.user.is_superuser:
            return Response({"detail": "Accès refusé."}, status=403)
        qs = Review.objects.all()
        rating = request.query_params.get("rating")
        if rating:
            qs = qs.filter(rating=rating)
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(customer_name__icontains=search) |
                Q(restaurant_name__icontains=search) |
                Q(courier_name__icontains=search) |
                Q(comment__icontains=search)
            )
        page = int(request.query_params.get("page", 1))
        limit = min(int(request.query_params.get("limit", 100)), 200)
        start = (page - 1) * limit
        total = qs.count()
        qs = qs[start:start + limit]
        return Response({
            "total": total,
            "page": page,
            "results": ReviewSerializer(qs, many=True).data,
        })
