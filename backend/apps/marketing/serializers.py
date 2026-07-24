from rest_framework import serializers

from .models import PromoCode


class PromoCodeSerializer(serializers.ModelSerializer):
    is_usable = serializers.BooleanField(read_only=True)

    class Meta:
        model = PromoCode
        fields = [
            "id", "code", "discount", "section",
            "min_order_mad", "expires_at", "usage_limit", "usage_count",
            "active", "is_usable", "created_at",
        ]
        read_only_fields = ["id", "created_at", "usage_count"]


class RestaurantPromoSerializer(serializers.ModelSerializer):
    is_usable = serializers.BooleanField(read_only=True)

    class Meta:
        model = PromoCode
        fields = [
            "id", "code", "discount", "min_order_mad", "expires_at",
            "usage_limit", "usage_count", "active", "is_usable", "created_at",
        ]
        read_only_fields = ["id", "created_at", "usage_count"]

    def validate_code(self, value):
        value = value.strip().upper()
        instance = self.instance
        if PromoCode.objects.filter(code=value).exclude(pk=getattr(instance, "pk", None)).exists():
            raise serializers.ValidationError("Ce code existe déjà.")
        return value

    def validate_discount(self, value):
        if value < 1 or value > 100:
            raise serializers.ValidationError("La remise doit être entre 1 et 100 %.")
        return value


class ValidatePromoSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    section = serializers.CharField(max_length=20)
    restaurant_id = serializers.IntegerField(required=False, help_text="ID du restaurant pour vérifier les codes prorestaurant.")
