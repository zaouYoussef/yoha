from decimal import Decimal

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import serializers

from apps.restaurants.models import MenuItem, Restaurant

from .models import CourierProfile, Order, OrderLine

User = get_user_model()


class CartLineInputSerializer(serializers.Serializer):
    menu_item_id = serializers.CharField(help_text="external_id du plat")
    restaurant_slug = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1, max_value=50)


class CheckoutSerializer(serializers.Serializer):
    items = CartLineInputSerializer(many=True)
    customer_name = serializers.CharField(max_length=120)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    customer_address = serializers.CharField(max_length=500)
    customer_phone = serializers.CharField(max_length=40)
    delivery_instructions = serializers.CharField(required=False, allow_blank=True, default="")
    idempotency_key = serializers.CharField(max_length=64, required=False, allow_blank=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Le panier est vide.")
        slugs = {i["restaurant_slug"] for i in items}
        if len(slugs) > 1:
            raise serializers.ValidationError(
                "Une seule commande par restaurant pour le moment."
            )
        return items

    def validate(self, attrs):
        request = self.context["request"]
        email = (attrs.get("customer_email") or "").strip().lower()
        user = request.user
        is_client = user.is_authenticated and user.role == User.Role.CLIENT

        if is_client:
            attrs["customer_email"] = email or user.email.strip().lower()
        elif not email:
            raise serializers.ValidationError(
                {"customer_email": "L'e-mail est obligatoire pour commander en mode invité."}
            )
        else:
            attrs["customer_email"] = email
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        items_in = validated_data["items"]
        slug = items_in[0]["restaurant_slug"]
        restaurant = get_object_or_404(Restaurant, slug=slug, is_active=True)

        resolved = []
        for row in items_in:
            item = get_object_or_404(
                MenuItem,
                restaurant=restaurant,
                external_id=row["menu_item_id"],
                is_available=True,
            )
            resolved.append({"menu_item": item, "qty": row["quantity"]})

        client = None
        if request.user.is_authenticated and request.user.role == User.Role.CLIENT:
            client = request.user

        idem = (validated_data.get("idempotency_key") or "").strip() or None
        return Order.create_from_cart(
            client=client,
            restaurant=restaurant,
            items_payload=resolved,
            customer_name=validated_data["customer_name"],
            customer_email=validated_data.get("customer_email", ""),
            customer_address=validated_data["customer_address"],
            customer_phone=validated_data["customer_phone"],
            delivery_instructions=validated_data.get("delivery_instructions", ""),
            idempotency_key=idem,
        )


class OrderLineSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    name = serializers.CharField(source="item_name")
    price = serializers.DecimalField(source="unit_price_mad", max_digits=10, decimal_places=2)
    qty = serializers.IntegerField(source="quantity")
    img = serializers.CharField(source="image_url")
    restaurantId = serializers.CharField(source="order.restaurant.slug")
    restaurantName = serializers.CharField(source="order.restaurant.name")

    class Meta:
        model = OrderLine
        fields = ("id", "name", "price", "qty", "img", "restaurantId", "restaurantName")

    def get_id(self, obj):
        if obj.menu_item_id:
            return obj.menu_item.external_id
        return f"line-{obj.pk}"


class OrderSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id")
    createdAt = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    restaurantId = serializers.CharField(source="restaurant.slug")
    restaurantName = serializers.CharField(source="restaurant.name")
    restaurantPhone = serializers.CharField(source="restaurant.phone", allow_blank=True)
    items = OrderLineSerializer(source="lines", many=True)
    totalDh = serializers.DecimalField(source="total_mad", max_digits=12, decimal_places=2)
    subtotalDh = serializers.DecimalField(source="subtotal_mad", max_digits=12, decimal_places=2)
    profitDh = serializers.DecimalField(source="profit_mad", max_digits=12, decimal_places=2)
    netDh = serializers.DecimalField(source="net_mad", max_digits=12, decimal_places=2)
    status = serializers.CharField()
    courierId = serializers.SerializerMethodField()
    courierName = serializers.SerializerMethodField()
    eta = serializers.IntegerField(source="eta_minutes")
    restaurantNotes = serializers.CharField(source="delivery_instructions", allow_blank=True)
    cancelledPhase = serializers.CharField(source="cancelled_phase", allow_blank=True)
    cancellationReason = serializers.CharField(source="cancellation_reason", allow_blank=True)
    customerUserId = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "createdAt",
            "customer",
            "customerUserId",
            "restaurantId",
            "restaurantName",
            "restaurantPhone",
            "items",
            "totalDh",
            "subtotalDh",
            "profitDh",
            "netDh",
            "status",
            "courierId",
            "courierName",
            "eta",
            "restaurantNotes",
            "cancelledPhase",
            "cancellationReason",
        )

    def get_createdAt(self, obj):
        return int(obj.created_at.timestamp() * 1000)

    def get_customer(self, obj):
        return {
            "name": obj.customer_name,
            "address": obj.customer_address,
            "phone": obj.customer_phone,
        }

    def get_courierId(self, obj):
        return str(obj.courier_id) if obj.courier_id else None

    def get_courierName(self, obj):
        return obj.courier.display_name if obj.courier else None

    def get_customerUserId(self, obj):
        return str(obj.client_id) if obj.client_id else None


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class AssignCourierSerializer(serializers.Serializer):
    courier_id = serializers.IntegerField()


class CourierSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk")
    name = serializers.CharField(source="display_name")
    userId = serializers.SerializerMethodField()

    class Meta:
        model = CourierProfile
        fields = ("id", "name", "phone", "avatar_url", "rating", "vehicle", "userId")

    def get_userId(self, obj):
        return str(obj.user_id) if obj.user_id else None
