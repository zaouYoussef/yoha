from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.audit.services import log_audit
from apps.core.permissions import IsAdmin, IsCourier, IsRestaurant
from apps.payments.services import record_cod_payment

from .models import CourierProfile, Order
from .push_models import OrderPushSubscription
from .serializers import (
    AssignCourierSerializer,
    CheckoutSerializer,
    CourierSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
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


class ClaimOrdersView(APIView):
    """Associe des commandes invité au compte client connecté."""

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

        qs = Order.objects.filter(public_id__in=ids, client__isnull=True)
        claimed = qs.update(client=user)
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
            {"claimed": claimed, "orders": OrderSerializer(linked, many=True).data},
        )


class GuestOrdersView(APIView):
    """Récupère des commandes invité par identifiants publics (stockés côté navigateur)."""

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
        qs = (
            Order.objects.filter(public_id__in=ids)
            .select_related("restaurant", "courier")
            .prefetch_related("lines")
        )
        return Response(OrderSerializer(qs, many=True).data)


class OrderPushSubscribeView(APIView):
    """Abonne un appareil (invité ou connecté) aux push d'une ou plusieurs commandes."""

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

        existing = set(
            Order.objects.filter(public_id__in=ids).values_list("public_id", flat=True)
        )
        linked = 0
        for pid in ids:
            if pid not in existing:
                continue
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

        return Response({"subscribed": linked, "public_ids": [i for i in ids if i in existing]})


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
        if user.role == "courier" and order.courier_id != user.courier_profile_id:
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
        return Response(OrderSerializer(order).data)


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
        return Response(OrderSerializer(order).data)


class AutoDispatchView(APIView):
    """Déclenche l'assignation livreur (suivi client ~30 s après commande)."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "anon"

    def post(self, request, public_id):
        order = get_object_or_404(Order.objects.all(), public_id=public_id)
        try:
            order = auto_dispatch_order(order=order)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        return Response(OrderSerializer(order).data)


class OrderReadyView(APIView):
    """Simule / confirme que le restaurant a terminé la préparation."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "anon"

    def post(self, request, public_id):
        order = get_object_or_404(Order.objects.all(), public_id=public_id)
        user = request.user if request.user.is_authenticated else None
        if user and user.role == "restaurant":
            if order.restaurant_id != user.restaurant_profile_id:
                return Response({"detail": "Accès refusé."}, status=403)
        order = mark_order_ready_for_pickup(order=order, actor=user)
        return Response(OrderSerializer(order).data)


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
    permission_classes = [IsAuthenticated]
    queryset = CourierProfile.objects.filter(is_active=True)
    serializer_class = CourierSerializer
    pagination_class = None
