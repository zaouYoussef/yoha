from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserRequest

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
        from apps.core.email_checker import is_valid_real_email
        email = value.strip().lower()
        if not is_valid_real_email(email):
            raise serializers.ValidationError("Adresse e-mail invalide ou domaine inexistant. Veuillez utiliser un e-mail réel (ex: @gmail.com).")
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


class AdminUserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    display_name = serializers.CharField(max_length=120)
    role = serializers.ChoiceField(choices=["courier", "restaurant"])

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Cette adresse e-mail est déjà utilisée.")
        return email

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            display_name=validated_data["display_name"],
            role=validated_data["role"],
        )
        if validated_data["role"] == "courier":
            from apps.orders.models import CourierProfile
            CourierProfile.objects.create(
                user=user,
                display_name=validated_data["display_name"],
            )
        return user


class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "display_name", "role", "is_active", "created_at")


class UserRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRequest
        fields = "__all__"
        read_only_fields = ("id", "status", "created_at", "updated_at")


class UserRequestCreateSerializer(serializers.Serializer):
    request_type = serializers.ChoiceField(choices=["deletion", "complaint", "other"])
    email = serializers.EmailField()
    display_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    message = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        user = self.context.get("request").user if self.context.get("request") else None
        if user and user.is_authenticated:
            validated_data["user"] = user
            validated_data.setdefault("email", user.email)
            validated_data.setdefault("display_name", user.display_name)
        return UserRequest.objects.create(**validated_data)
