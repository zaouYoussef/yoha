from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


def resolve_login_to_email(login: str) -> str:
    """Accepte e-mail complet, partie locale (@ avant) ou nom affiché."""
    login = (login or "").strip()
    if not login:
        return login
    if "@" in login:
        return login.lower()

    candidates = User.objects.filter(
        Q(display_name__iexact=login)
        | Q(email__istartswith=f"{login}@")
        | Q(display_name__istartswith=login)
    )
    count = candidates.count()
    if count == 1:
        return candidates.first().email
    if count > 1:
        raise ValidationError(
            {"email": "Plusieurs comptes correspondent — utilisez votre adresse e-mail complète."},
            code="ambiguous_login",
        )
    return login.lower()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        raw = attrs.get(self.username_field, "")
        attrs[self.username_field] = resolve_login_to_email(raw)
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["display_name"] = user.display_name
        return token
