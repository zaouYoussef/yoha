import re

from django.core.exceptions import ValidationError


class YohaPasswordValidator:
    """Exige lettres + chiffres pour les comptes sensibles."""

    def validate(self, password, user=None):
        if len(password) < 10:
            raise ValidationError("Au moins 10 caractères.", code="password_too_short")
        if not re.search(r"[A-Za-z]", password):
            raise ValidationError("Au moins une lettre.", code="password_no_letter")
        if not re.search(r"\d", password):
            raise ValidationError("Au moins un chiffre.", code="password_no_digit")

    def get_help_text(self):
        return "Mot de passe : 10+ caractères, lettres et chiffres."
