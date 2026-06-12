from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "display_name", "role")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=10)
    display_name = serializers.CharField(max_length=120, required=False, allow_blank=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Cette adresse e-mail est déjà utilisée.")
        return email

    def create(self, validated_data):
        email = validated_data["email"]
        display = (validated_data.get("display_name") or "").strip() or email.split("@")[0]
        return User.objects.create_user(
            email=email,
            password=validated_data["password"],
            display_name=display,
            role=User.Role.CLIENT,
        )


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()


class AppleAuthSerializer(serializers.Serializer):
    identity_token = serializers.CharField()
    full_name = serializers.DictField(
        child=serializers.CharField(allow_blank=True),
        required=False,
        allow_null=True,
    )


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("display_name", "phone")
        extra_kwargs = {"phone": {"write_only": True}}
