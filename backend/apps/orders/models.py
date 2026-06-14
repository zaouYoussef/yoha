import secrets
import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models, transaction

from apps.core.fields import EncryptedTextField
from apps.core.finance import platform_net_mad, platform_profit_mad, service_fee_mad


class CourierProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="courier",
        null=True,
        blank=True,
    )
    display_name = models.CharField(max_length=120)
    phone = EncryptedTextField(blank=True, default="")
    avatar_url = models.URLField(max_length=500, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=Decimal("4.8"))
    vehicle = models.CharField(max_length=40, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "livreur"

    def __str__(self):
        return self.display_name


class Order(models.Model):
    class Status(models.TextChoices):
        PLACED = "placed", "Nouvelle commande"
        PICKUP_CONFIRMED = "pickup_confirmed", "Livreur confirmé"
        PREPARING = "preparing", "En préparation"
        DELIVERING = "delivering", "En livraison"
        DELIVERED = "delivered", "Livré"
        CANCELLED = "cancelled", "Annulé"

    class CancelledPhase(models.TextChoices):
        BEFORE_PICKUP = "before_pickup", "Avant récupération"
        AFTER_PICKUP = "after_pickup", "Après récupération"

    BEFORE_PICKUP_STATUSES = frozenset({
        Status.PLACED,
        Status.PICKUP_CONFIRMED,
        Status.PREPARING,
    })

    ALLOWED_TRANSITIONS = {
        Status.PLACED: {Status.PICKUP_CONFIRMED, Status.CANCELLED},
        Status.PICKUP_CONFIRMED: {Status.PREPARING, Status.DELIVERING, Status.CANCELLED},
        Status.PREPARING: {Status.DELIVERING, Status.CANCELLED},
        Status.DELIVERING: {Status.DELIVERED, Status.CANCELLED},
        Status.DELIVERED: set(),
        Status.CANCELLED: set(),
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    public_id = models.CharField(max_length=20, unique=True, db_index=True)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.PROTECT,
        related_name="orders",
    )
    courier = models.ForeignKey(
        CourierProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PLACED,
        db_index=True,
    )
    customer_name = models.CharField(max_length=120)
    customer_email = models.EmailField(max_length=254, blank=True, db_index=True)
    customer_address = EncryptedTextField()
    customer_phone = EncryptedTextField()
    delivery_instructions = models.TextField(blank=True, help_text="Remarques client pour le restaurant (ex. sans tomate)")
    subtotal_mad = models.DecimalField(max_digits=12, decimal_places=2)
    service_fee_mad = models.DecimalField(max_digits=12, decimal_places=2)
    total_mad = models.DecimalField(max_digits=12, decimal_places=2)
    profit_mad = models.DecimalField(max_digits=12, decimal_places=2)
    net_mad = models.DecimalField(max_digits=12, decimal_places=2)
    eta_minutes = models.PositiveSmallIntegerField(default=26)
    cancelled_phase = models.CharField(
        max_length=20,
        choices=CancelledPhase.choices,
        blank=True,
        default="",
    )
    cancellation_reason = models.TextField(blank=True, default="")
    idempotency_key = models.CharField(max_length=64, unique=True, null=True, blank=True)
    scheduled_delivery_at = models.DateTimeField(null=True, blank=True, help_text="Plage de livraison choisie par le client (début de la tranche de 30 min)")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["restaurant", "status"]),
            models.Index(fields=["client", "created_at"]),
        ]

    def __str__(self):
        return self.public_id

    @classmethod
    def generate_public_id(cls) -> str:
        """Numéro public aléatoire (non séquentiel) — ex. YH-8472913."""
        for _ in range(32):
            num = secrets.randbelow(9_000_000) + 1_000_000  # 7 chiffres
            candidate = f"YH-{num}"
            if not cls.objects.filter(public_id=candidate).exists():
                return candidate
        raise RuntimeError("Impossible de générer un numéro de commande unique.")

    def can_transition_to(self, new_status: str) -> bool:
        allowed = self.ALLOWED_TRANSITIONS.get(self.status, set())
        return new_status in allowed

    def get_notification_email(self) -> str:
        if self.customer_email:
            return self.customer_email.strip().lower()
        if self.client_id and self.client.email:
            return self.client.email.strip().lower()
        return ""

    @classmethod
    @transaction.atomic
    def create_from_cart(
        cls,
        *,
        client,
        restaurant,
        items_payload,
        customer_name,
        customer_email="",
        customer_address,
        customer_phone,
        delivery_instructions="",
        idempotency_key=None,
        scheduled_delivery_at=None,
    ):
        if idempotency_key:
            existing = cls.objects.filter(idempotency_key=idempotency_key).first()
            if existing:
                return existing

        subtotal = Decimal("0.00")
        line_objects = []
        for row in items_payload:
            item = row["menu_item"]
            qty = row["qty"]
            line_total = item.price_mad * qty
            subtotal += line_total
            line_objects.append((item, qty, line_total))

        fee = service_fee_mad(subtotal)
        total = subtotal + fee
        order = cls.objects.create(
            public_id=cls.generate_public_id(),
            client=client,
            restaurant=restaurant,
            customer_name=customer_name,
            customer_email=(customer_email or "").strip().lower(),
            customer_address=customer_address,
            customer_phone=customer_phone,
            delivery_instructions=delivery_instructions,
            subtotal_mad=subtotal,
            service_fee_mad=fee,
            total_mad=total,
            profit_mad=platform_profit_mad(total),
            net_mad=platform_net_mad(total),
            idempotency_key=idempotency_key or None,
            scheduled_delivery_at=scheduled_delivery_at,
        )
        for item, qty, line_total in line_objects:
            OrderLine.objects.create(
                order=order,
                menu_item=item,
                item_name=item.name,
                unit_price_mad=item.price_mad,
                quantity=qty,
                line_total_mad=line_total,
                image_url=item.image_url,
            )
        return order


class OrderLine(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="lines")
    menu_item = models.ForeignKey(
        "restaurants.MenuItem",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    item_name = models.CharField(max_length=200)
    unit_price_mad = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveSmallIntegerField()
    line_total_mad = models.DecimalField(max_digits=12, decimal_places=2)
    image_url = models.URLField(max_length=500, blank=True)

    class Meta:
        ordering = ["id"]


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=30, blank=True)
    to_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


from .push_models import OrderPushSubscription  # noqa: E402, F401
