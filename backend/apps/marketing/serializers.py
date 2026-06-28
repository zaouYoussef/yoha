from rest_framework import serializers

from .models import PromoCode


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = ["id", "code", "discount", "section", "active", "created_at"]
        read_only_fields = ["id", "created_at"]


class ValidatePromoSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    section = serializers.CharField(max_length=20)
