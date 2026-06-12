from decimal import Decimal

from django.conf import settings
from django.db import models


from apps.restaurants.opening_hours import default_opening_hours


class Restaurant(models.Model):
    class Cuisine(models.TextChoices):
        PIZZA = "pizza", "Pizza"
        TACOS = "tacos", "Tacos"
        KEBAB = "kebab", "Kebab"
        SUSHI = "sushi", "Sushi"
        BURGER = "burger", "Burger"
        HEALTHY = "healthy", "Healthy"
        ASIAN = "asian", "Asiatique"
        MEDICAL = "medical", "Médical"
        DESSERT = "dessert", "Dessert"
        DRINKS = "drinks", "Boissons"

    slug = models.SlugField(unique=True, max_length=120)
    name = models.CharField(max_length=200)
    cuisine = models.CharField(max_length=20, choices=Cuisine.choices, db_index=True)
    tags = models.JSONField(default=list, blank=True)
    distance_label = models.CharField(max_length=40, blank=True)
    promo_label = models.CharField(max_length=120, blank=True)
    fee_label = models.CharField(max_length=80, default="Livraison offerte")
    cover_url = models.URLField(max_length=500, blank=True)
    logo_url = models.URLField(max_length=500, blank=True)
    cover_file = models.CharField(max_length=300, blank=True, help_text="Clé stockage objet (WebP)")
    cover_thumb = models.CharField(max_length=300, blank=True)
    logo_file = models.CharField(max_length=300, blank=True)
    logo_thumb = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
        help_text="Numéro WhatsApp du restaurant (ex. +212539123456)",
    )
    opening_hours = models.JSONField(
        default=default_opening_hours,
        blank=True,
        help_text="Horaires par jour (clés monday…sunday).",
    )
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_restaurant",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=Decimal("0.2000"),
        help_text="Commission plateforme (ex: 0.20 = 20 %)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["is_active", "cuisine"])]

    def __str__(self):
        return self.name


class MenuCategory(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="menu_categories")
    name = models.CharField(max_length=120)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        unique_together = [("restaurant", "name")]

    def __str__(self):
        return f"{self.restaurant.name} — {self.name}"


class MenuItem(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="menu_items")
    category = models.ForeignKey(MenuCategory, on_delete=models.CASCADE, related_name="items")
    external_id = models.CharField(max_length=40, help_text="ID stable côté front (ex: m1)")
    name = models.CharField(max_length=200)
    description = models.CharField(max_length=300, blank=True)
    ingredients = models.TextField(blank=True, help_text="Ingrédients et description détaillée du plat")
    price_mad = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(max_length=500, blank=True)
    image_file = models.CharField(max_length=300, blank=True)
    image_thumb = models.CharField(max_length=300, blank=True)
    is_available = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        unique_together = [("restaurant", "external_id")]
        indexes = [models.Index(fields=["restaurant", "is_available"])]

    def __str__(self):
        return self.name
