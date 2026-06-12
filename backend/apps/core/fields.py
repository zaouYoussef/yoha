from django.db import models

from .encryption import decrypt_text, encrypt_text


class EncryptedTextField(models.TextField):
    """Stockage chiffré transparent pour PII."""

    description = "Texte chiffré (Fernet)"

    def get_prep_value(self, value):
        if value is None or value == "":
            return value
        return encrypt_text(str(value))

    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value
        return decrypt_text(value)

    def to_python(self, value):
        if value is None or value == "":
            return value
        if isinstance(value, str) and value.startswith("gAAAA"):
            return decrypt_text(value)
        return value
