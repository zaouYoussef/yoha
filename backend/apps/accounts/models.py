import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from apps.core.fields import EncryptedTextField


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("L'e-mail est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", User.Role.ADMIN)
        return self.create_user(email, password, **extra)


class User(AbstractUser):
    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        ADMIN = "admin", "Gérant"
        COURIER = "courier", "Livreur"
        RESTAURANT = "restaurant", "Restaurant"

    username = None
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField("e-mail", unique=True, db_index=True)
    display_name = models.CharField("nom affiché", max_length=120)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENT, db_index=True)
    phone = EncryptedTextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["display_name"]

    objects = UserManager()

    class Meta:
        verbose_name = "utilisateur"
        verbose_name_plural = "utilisateurs"
        indexes = [
            models.Index(fields=["role", "is_active"]),
        ]

    def __str__(self):
        return f"{self.display_name} <{self.email}>"

    @property
    def is_client(self):
        return self.role == self.Role.CLIENT

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def restaurant_profile(self):
        return getattr(self, "owned_restaurant", None)

    @property
    def restaurant_profile_id(self):
        r = self.restaurant_profile
        return r.id if r else None

    @property
    def courier_profile(self):
        return getattr(self, "courier", None)

    @property
    def courier_profile_id(self):
        c = self.courier_profile
        return c.id if c else None


class UserOAuthProvider(models.Model):
    class Provider(models.TextChoices):
        GOOGLE = "google", "Google"
        APPLE = "apple", "Apple"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="oauth_providers",
    )
    provider = models.CharField(max_length=20, choices=Provider.choices, db_index=True)
    provider_uid = models.CharField(max_length=255, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "liaison OAuth"
        verbose_name_plural = "liaisons OAuth"
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "provider_uid"],
                name="accounts_oauth_provider_uid_uniq",
            ),
        ]

    def __str__(self):
        return f"{self.provider}:{self.provider_uid} → {self.user_id}"


from .push_models import PushDevice  # noqa: E402, F401
