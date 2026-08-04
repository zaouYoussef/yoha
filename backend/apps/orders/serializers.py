from decimal import Decimal

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import serializers

from apps.restaurants.models import MenuItem, Restaurant, MenuCategory

from .models import CourierProfile, Order, OrderLine, Review
from .security import emails_match

User = get_user_model()


class CartLineInputSerializer(serializers.Serializer):
    menu_item_id = serializers.CharField(help_text="external_id du plat")
    restaurant_slug = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1, max_value=50)
    item_name = serializers.CharField(required=False, allow_blank=True, default="")
    item_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal("0.00"))
    restaurant_name = serializers.CharField(required=False, allow_blank=True, default="")
    item_options = serializers.ListField(
        child=serializers.CharField(max_length=120),
        required=False,
        default=list,
        allow_empty=True,
    )


class CheckoutSerializer(serializers.Serializer):
    items = CartLineInputSerializer(many=True)
    customer_name = serializers.CharField(max_length=120)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    customer_address = serializers.CharField(max_length=500)
    customer_phone = serializers.CharField(max_length=40)
    delivery_instructions = serializers.CharField(required=False, allow_blank=True, default="")
    ordonnance_url = serializers.URLField(required=False, allow_blank=True, default="",
        help_text="URL de l'image d'ordonnance (commandes pharmacie sur-mesure)")
    scheduled_delivery_at = serializers.DateTimeField(required=False, allow_null=True, default=None,
        help_text="Date/heure ISO choisie par le client (début de la tranche de 30 min)")
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
        from apps.core.email_checker import autocorrect_email, is_valid_real_email
        request = self.context["request"]
        raw_email = (attrs.get("customer_email") or "").strip().lower()
        email = autocorrect_email(raw_email) if raw_email else ""
        user = request.user
        is_client = user.is_authenticated and user.role == User.Role.CLIENT

        if is_client:
            target_email = email or autocorrect_email(user.email.strip().lower())
            if target_email and not is_valid_real_email(target_email):
                raise serializers.ValidationError({"customer_email": "Veuillez renseigner une adresse e-mail valide et existante."})
            attrs["customer_email"] = target_email
        elif not email:
            raise serializers.ValidationError(
                {"customer_email": "L'e-mail est obligatoire pour commander en mode invité."}
            )
        else:
            if not is_valid_real_email(email):
                raise serializers.ValidationError({"customer_email": "L'adresse e-mail renseignée n'existe pas ou le domaine est invalide."})
            attrs["customer_email"] = email
        return attrs


    def create(self, validated_data):
        request = self.context["request"]
        items_in = validated_data["items"]
        slug = items_in[0]["restaurant_slug"]
        
        # Dynamically get or create Restaurant (e.g. for pharmacies & patisseries)
        restaurant = Restaurant.objects.filter(slug=slug, is_active=True).first()
        if not restaurant:
            restaurant_name = items_in[0].get("restaurant_name") or "Établissement"
            if not restaurant_name or restaurant_name == "Établissement":
                restaurant_name = slug.replace("-", " ").title()
            
            cuisine = Restaurant.Cuisine.MEDICAL
            if "dessert" in slug or "patisserie" in slug or "patiss" in slug:
                cuisine = Restaurant.Cuisine.DESSERT
            elif "pharmacy" in slug or "medical" in slug or "pharma" in slug:
                cuisine = Restaurant.Cuisine.MEDICAL
            elif "supermarket" in slug or "supermarche" in slug or "marche" in slug:
                cuisine = Restaurant.Cuisine.SUPERMARKET
            elif "shop" in slug or "magasin" in slug or "boutique" in slug:
                cuisine = Restaurant.Cuisine.SHOP
            elif "parapharmacy" in slug or "parapharma" in slug:
                cuisine = Restaurant.Cuisine.PARAPHARMACY
                
            restaurant = Restaurant.objects.create(
                slug=slug,
                name=restaurant_name,
                cuisine=cuisine,
                is_active=True,
            )

        # Get or create MenuCategory
        category, _ = MenuCategory.objects.get_or_create(
            restaurant=restaurant,
            name="Articles",
            defaults={"sort_order": 0}
        )

        resolved = []
        from .security import (
            CLIENT_PRICE_CUISINES,
            clamp_client_unit_price,
            compute_catalog_unit_price,
        )

        allow_adhoc = restaurant.cuisine in CLIENT_PRICE_CUISINES

        for row in items_in:
            external_id = row["menu_item_id"]
            options = row.get("item_options") or []
            item = (
                MenuItem.objects.filter(restaurant=restaurant, external_id=external_id)
                .prefetch_related("modifier_groups__options")
                .first()
            )
            if not item:
                if not allow_adhoc:
                    raise serializers.ValidationError(
                        {"items": f"Plat introuvable : {external_id}"}
                    )
                item_name = row.get("item_name") or "Article"
                item_price = clamp_client_unit_price(row.get("item_price"))
                item = MenuItem.objects.create(
                    restaurant=restaurant,
                    category=category,
                    external_id=external_id,
                    name=item_name,
                    price_mad=item_price,
                    is_available=True,
                )
                unit = item_price
            else:
                # Catalogue : prix 100 % serveur (+ options validées).
                unit = compute_catalog_unit_price(item, options)

            resolved.append({
                "menu_item": item,
                "qty": row["quantity"],
                "unit_price_mad": unit,
                "options": options,
            })

        # Calculate dynamic delivery fee: 20 DH per unique custom/static pharmacy, patisserie, supermarket, shop, or parapharmacy restaurant name
        custom_restaurant_names = set()
        for row in items_in:
            slug = row["restaurant_slug"]
            r_obj = Restaurant.objects.filter(slug=slug).first()
            is_custom_cuisine = False
            if r_obj:
                is_custom_cuisine = r_obj.cuisine in ["medical", "dessert", "supermarket", "shop", "parapharmacy"]
            else:
                is_custom_cuisine = any(keyword in slug for keyword in [
                    "dessert", "patisserie", "patiss",
                    "pharmacy", "medical", "pharma",
                    "supermarket", "supermarche", "marche",
                    "shop", "magasin", "boutique",
                    "parapharmacy", "parapharma"
                ])
            
            if is_custom_cuisine:
                name_val = (row.get("restaurant_name") or slug).strip().lower()
                if name_val:
                    custom_restaurant_names.add(name_val)

        custom_delivery_fee = None
        if custom_restaurant_names:
            custom_delivery_fee = Decimal(str(len(custom_restaurant_names) * 20))

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
            scheduled_delivery_at=validated_data.get("scheduled_delivery_at"),
            idempotency_key=idem,
            custom_delivery_fee=custom_delivery_fee,
            ordonnance_url=validated_data.get("ordonnance_url", ""),
        )


class OrderLineSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    name = serializers.CharField(source="item_name")
    price = serializers.DecimalField(source="unit_price_mad", max_digits=10, decimal_places=2)
    qty = serializers.IntegerField(source="quantity")
    img = serializers.SerializerMethodField()
    restaurantId = serializers.SerializerMethodField()
    restaurantName = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()

    class Meta:
        model = OrderLine
        fields = ("id", "name", "price", "qty", "img", "restaurantId", "restaurantName", "options")

    def get_id(self, obj):
        if obj.menu_item_id and obj.menu_item:
            return obj.menu_item.external_id
        return f"line-{obj.pk}"

    def get_img(self, obj):
        from apps.restaurants.cdn_images import publicize_image_url

        return publicize_image_url(obj.image_url or "")

    def get_restaurantId(self, obj):
        if obj.order_id and obj.order.restaurant_id:
            return obj.order.restaurant.slug
        return ""

    def get_restaurantName(self, obj):
        if obj.order_id and obj.order.restaurant_id:
            return obj.order.restaurant.name
        return ""

    def get_options(self, obj):
        opts = getattr(obj, "options", None) or []
        if isinstance(opts, list):
            return [{"name": str(o)} for o in opts if str(o).strip()]
        return []


class OrderSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="public_id")
    createdAt = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    restaurantId = serializers.SerializerMethodField()
    restaurantName = serializers.SerializerMethodField()
    restaurantPhone = serializers.SerializerMethodField()
    restaurantAddress = serializers.SerializerMethodField()
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
    ordonnanceUrl = serializers.CharField(source="ordonnance_url", allow_blank=True)
    scheduledDeliveryAt = serializers.DateTimeField(source="scheduled_delivery_at", allow_null=True, required=False)
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
            "restaurantAddress",
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
            "ordonnanceUrl",
            "scheduledDeliveryAt",
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

    def get_restaurantId(self, obj):
        return obj.restaurant.slug if obj.restaurant_id else ""

    def get_restaurantName(self, obj):
        return obj.restaurant.name if obj.restaurant_id else ""

    def get_restaurantPhone(self, obj):
        if not obj.restaurant_id:
            return ""
        return (obj.restaurant.phone or "").strip()

    def get_restaurantAddress(self, obj):
        if not obj.restaurant_id:
            return ""
        desc = (obj.restaurant.description or "").strip()
        if "—" in desc:
            addr = desc.split("—", 1)[1].strip(" ,")
            if addr:
                return addr
        if " - " in desc:
            addr = desc.split(" - ", 1)[1].strip(" ,")
            if addr and len(addr) > 8:
                return addr
        return ""

    def get_courierId(self, obj):
        return str(obj.courier_id) if obj.courier_id else None

    def get_courierName(self, obj):
        return obj.courier.display_name if obj.courier else None

    def get_customerUserId(self, obj):
        return str(obj.client_id) if obj.client_id else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        is_admin = bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", None) == "admin" or user.is_superuser)
        )
        if not is_admin:
            data.pop("profitDh", None)
            data.pop("netDh", None)
        return data


class CourierLocationSerializer(serializers.Serializer):
    # Float + arrondi : les GPS mobiles (iOS) envoient > 9 chiffres totaux
    # ce qui faisait échouer DecimalField(max_digits=9) en 400 silencieux.
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)

    def validate_latitude(self, value):
        return round(float(value), 6)

    def validate_longitude(self, value):
        return round(float(value), 6)


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class AssignCourierSerializer(serializers.Serializer):
    courier_id = serializers.IntegerField()


class CourierSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk")
    name = serializers.CharField(source="display_name")
    userId = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = CourierProfile
        fields = ("id", "name", "phone", "avatar_url", "rating", "vehicle", "userId", "email")

    def get_userId(self, obj):
        return str(obj.user_id) if obj.user_id else None

    def _is_admin(self):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        return bool(user and user.is_authenticated and (user.role == "admin" or user.is_superuser))

    def get_email(self, obj):
        if not self._is_admin():
            return None
        if obj.user_id and obj.user:
            return obj.user.email
        return None

    def get_phone(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        if self._is_admin():
            return obj.phone or ""
        # Livreur : son propre téléphone seulement
        if user and user.is_authenticated and user.courier_profile_id == obj.pk:
            return obj.phone or ""
        return ""


class ReviewSerializer(serializers.ModelSerializer):
    order_id = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id",
            "order_id",
            "customer_name",
            "customer_email",
            "customer_phone",
            "restaurant_name",
            "courier_name",
            "rating",
            "comment",
            "created_at",
        )

    def get_order_id(self, obj):
        return obj.order.public_id if obj.order else None

    def get_customer_name(self, obj):
        if obj.customer_name and obj.customer_name not in ["Client", "Client YoHa"]:
            return obj.customer_name
        if obj.order and obj.order.customer_name:
            return obj.order.customer_name
        if obj.user:
            return obj.user.display_name or obj.user.email
        return obj.customer_name or "Client YoHa"

    def get_customer_email(self, obj):
        if obj.user and obj.user.email:
            return obj.user.email
        if obj.order and getattr(obj.order, "customer_email", None):
            return obj.order.customer_email
        return None

    def get_customer_phone(self, obj):
        if obj.order and getattr(obj.order, "customer_phone", None):
            return obj.order.customer_phone
        return None


class ReviewCreateSerializer(serializers.Serializer):
    order_id = serializers.CharField()
    customer_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    restaurant_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    courier_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        from .models import Order, Review

        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentification requise.")

        order_id = attrs["order_id"]
        order = Order.objects.filter(public_id=order_id).first()
        if not order:
            raise serializers.ValidationError({"order_id": "Commande introuvable."})

        user = request.user
        owns = order.client_id == user.id
        if not owns and user.role == "client":
            # Invité devenu compte : e-mail commande = e-mail compte
            if not emails_match(user.email, order.customer_email or ""):
                raise serializers.ValidationError("Cette commande ne vous appartient pas.")
        elif not owns and user.role != "admin" and not user.is_superuser:
            raise serializers.ValidationError("Cette commande ne vous appartient pas.")

        if order.status != Order.Status.DELIVERED:
            raise serializers.ValidationError("Avis possible uniquement après livraison.")

        if Review.objects.filter(order=order).exists():
            raise serializers.ValidationError("Un avis existe déjà pour cette commande.")

        attrs["order"] = order
        attrs["restaurant_name"] = attrs.get("restaurant_name") or (
            order.restaurant.name if order.restaurant_id else ""
        )
        attrs["courier_name"] = attrs.get("courier_name") or (
            order.courier.display_name if order.courier_id else ""
        )
        attrs["customer_name"] = attrs.get("customer_name") or order.customer_name or (
            user.display_name if hasattr(user, "display_name") else ""
        ) or user.email
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data.pop("order_id", None)
        order = validated_data["order"]
        return Review.objects.create(
            order=order,
            user=request.user if request and request.user.is_authenticated else None,
            customer_name=validated_data.get("customer_name") or "",
            restaurant_name=validated_data.get("restaurant_name") or "",
            courier_name=validated_data.get("courier_name") or "",
            rating=validated_data["rating"],
            comment=validated_data.get("comment") or "",
        )

