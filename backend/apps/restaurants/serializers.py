from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import serializers

from .models import MenuCategory, MenuItem, Restaurant
from .opening_hours import normalize_opening_hours, restaurant_open_status


def media_url(file_key: str) -> str:
    if not file_key:
        return ""
    base = getattr(settings, "MEDIA_PUBLIC_BASE_URL", "").rstrip("/")
    if base:
        return f"{base}/{file_key.lstrip('/')}"
    return default_storage.url(file_key)


def pick_image(file_key: str, thumb_key: str, fallback_url: str, *, prefer_thumb: bool = False) -> str:
    if prefer_thumb and thumb_key:
        return media_url(thumb_key)
    if file_key:
        return media_url(file_key)
    return fallback_url or ""


class MenuItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="external_id")
    desc = serializers.CharField(source="description")
    price = serializers.DecimalField(source="price_mad", max_digits=10, decimal_places=2)
    img = serializers.SerializerMethodField()
    db_id = serializers.IntegerField(source="id", read_only=True)

    class Meta:
        model = MenuItem
        fields = ("id", "db_id", "name", "desc", "ingredients", "price", "img", "is_available")

    def get_img(self, obj):
        prefer_thumb = self.context.get("prefer_thumbs", False)
        return pick_image(obj.image_file, obj.image_thumb, obj.image_url, prefer_thumb=prefer_thumb)


class MenuCategorySerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="name")
    items = serializers.SerializerMethodField()
    db_id = serializers.IntegerField(source="id", read_only=True)

    class Meta:
        model = MenuCategory
        fields = ("db_id", "category", "items")

    def get_items(self, obj):
        qs = obj.items.all()
        if not self.context.get("manage"):
            qs = qs.filter(is_available=True)
        return MenuItemSerializer(qs, many=True, context=self.context).data


class OpeningHoursSerializer(serializers.Field):
    """Lecture/écriture horaires — JSON { monday: { is_closed, open, close }, … }."""

    def to_representation(self, value):
        return normalize_opening_hours(value)

    def to_internal_value(self, data):
        if data is None:
            return normalize_opening_hours({})
        if not isinstance(data, dict):
            raise serializers.ValidationError("opening_hours doit être un objet.")
        return normalize_opening_hours(data)


class RestaurantListSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug")
    fee = serializers.CharField(source="fee_label")
    distance = serializers.CharField(source="distance_label")
    promo = serializers.CharField(source="promo_label")
    cover = serializers.SerializerMethodField()
    logo = serializers.SerializerMethodField()
    openingHours = OpeningHoursSerializer(source="opening_hours")
    isOpen = serializers.SerializerMethodField()
    openLabel = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = (
            "id",
            "name",
            "cuisine",
            "tags",
            "fee",
            "distance",
            "promo",
            "cover",
            "logo",
            "description",
            "phone",
            "openingHours",
            "isOpen",
            "openLabel",
        )

    def get_isOpen(self, obj):
        return restaurant_open_status(obj.opening_hours)["isOpen"]

    def get_openLabel(self, obj):
        return restaurant_open_status(obj.opening_hours)["openLabel"]

    def get_cover(self, obj):
        return pick_image(obj.cover_file, obj.cover_thumb, obj.cover_url, prefer_thumb=True)

    def get_logo(self, obj):
        return pick_image(obj.logo_file, obj.logo_thumb, obj.logo_url, prefer_thumb=False)


class RestaurantDetailSerializer(RestaurantListSerializer):
    menu = serializers.SerializerMethodField()

    class Meta(RestaurantListSerializer.Meta):
        fields = RestaurantListSerializer.Meta.fields + ("menu",)

    def get_menu(self, obj):
        cats = obj.menu_categories.prefetch_related("items").all()
        return MenuCategorySerializer(cats, many=True, context=self.context).data


# ——— Écriture (dashboard gérant) ———

class RestaurantWriteSerializer(serializers.ModelSerializer):
    opening_hours = OpeningHoursSerializer(required=False)

    class Meta:
        model = Restaurant
        fields = (
            "name",
            "cuisine",
            "tags",
            "description",
            "distance_label",
            "promo_label",
            "fee_label",
            "phone",
            "opening_hours",
        )


class RestaurantCreateSerializer(RestaurantWriteSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta(RestaurantWriteSerializer.Meta):
        fields = RestaurantWriteSerializer.Meta.fields + ("slug",)

    def validate_slug(self, value):
        if value and Restaurant.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Ce slug est déjà utilisé.")
        return value


class MenuCategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ("name", "sort_order")


class MenuItemWriteSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="external_id", required=False, allow_blank=True)
    desc = serializers.CharField(source="description", required=False, allow_blank=True)
    price = serializers.DecimalField(source="price_mad", max_digits=10, decimal_places=2)

    class Meta:
        model = MenuItem
        fields = ("id", "name", "desc", "ingredients", "price", "is_available", "sort_order")

    def validate_id(self, value):
        if not value:
            return value
        restaurant = self.context.get("restaurant")
        qs = MenuItem.objects.filter(restaurant=restaurant, external_id=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("ID plat déjà utilisé dans ce restaurant.")
        return value
