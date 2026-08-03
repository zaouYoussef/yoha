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
        SUPERMARKET = "supermarket", "Supermarché"
        SHOP = "shop", "Magasins"
        PARAPHARMACY = "parapharmacy", "Parapharmacie"

    slug = models.SlugField(unique=True, max_length=120)
    name = models.CharField(max_length=200)
    cuisine = models.CharField(max_length=20, choices=Cuisine.choices, db_index=True)
    tags = models.JSONField(default=list, blank=True)
    distance_label = models.CharField(max_length=40, blank=True)
    delivery_time = models.CharField(max_length=40, blank=True, default="45-60 min")
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
    rating = models.CharField(max_length=10, blank=True, default="4.8")
    glovo_store_id = models.BigIntegerField(
        null=True,
        blank=True,
        help_text="ID du store Glovo (découvert) — active la synchro du menu.",
    )
    glovo_address_id = models.BigIntegerField(
        null=True,
        blank=True,
        help_text="ID de l'adresse Glovo du store.",
    )
    glovo_slug = models.CharField(
        max_length=120,
        blank=True,
        help_text="Slug interne Glovo (ex: mr-tacos-tgr) pour la découverte.",
    )
    glovo_enabled = models.BooleanField(
        default=False,
        help_text="Menu synchronisé depuis l'API Glovo (toutes les 2 jours).",
    )
    glovo_synced_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Dernière synchronisation réussie du menu Glovo.",
    )
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
    modifiers_manual = models.BooleanField(
        default=False,
        help_text="Si True, la sync Glovo n'écrase pas les sauces/suppléments édités depuis le panel.",
    )

    class Meta:
        ordering = ["sort_order", "id"]
        unique_together = [("restaurant", "external_id")]
        indexes = [models.Index(fields=["restaurant", "is_available"])]

    def __str__(self):
        return self.name


class MenuItemModifierGroup(models.Model):
    """Groupe d'options personnalisant un produit (taille, sauce, extras…)."""

    menu_item = models.ForeignKey(
        MenuItem, on_delete=models.CASCADE, related_name="modifier_groups"
    )
    name = models.CharField(max_length=120)
    min_selected = models.PositiveSmallIntegerField(default=0)
    max_selected = models.PositiveSmallIntegerField(default=1)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        unique_together = [("menu_item", "name")]
        verbose_name = "groupe d'options"
        verbose_name_plural = "groupes d'options"

    def __str__(self):
        return f"{self.menu_item.name} — {self.name}"


class MenuItemModifierOption(models.Model):
    """Option d'un groupe (ex. « Cheddar +5 MAD »)."""

    group = models.ForeignKey(
        MenuItemModifierGroup, on_delete=models.CASCADE, related_name="options"
    )
    external_id = models.CharField(max_length=40, blank=True)
    name = models.CharField(max_length=120)
    price_impact = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        unique_together = [("group", "name")]
        verbose_name = "option"
        verbose_name_plural = "options"

    def __str__(self):
        return self.name


class RestaurantOffer(models.Model):
    """Offres promotionnelles d'un restaurant."""

    class OfferType(models.TextChoices):
        PERCENTAGE = "percentage", "Réduction %"
        BUY_GET_FREE = "buy_get_free", "Acheté X, offert Y"
        MIN_SPEND = "min_spend", "Montant minimum"

    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name="offers",
    )
    offer_type = models.CharField(max_length=20, choices=OfferType.choices)
    title = models.CharField(max_length=150, help_text="Ex: -50% sur tout le menu")
    description = models.TextField(blank=True)

    # percentage type
    discount_percent = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Pourcentage de réduction (1-100)",
    )

    # buy_get_free type
    buy_quantity = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Quantité à acheter (ex: 2)",
    )
    get_quantity = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Quantité offerte (ex: 1)",
    )
    free_item_name = models.CharField(
        max_length=200, blank=True,
        help_text="Nom de l'article offert (ex: Boisson 33cl)",
    )

    # min_spend type
    min_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Montant minimum de la commande en MAD",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Catégories ciblées (IDs MenuCategory). Liste vide = pas de filtre catégorie.
    category_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="IDs de MenuCategory concernées. Vide = pas de filtre catégorie.",
    )
    # Plats ciblés (IDs MenuItem). Liste vide = pas de filtre plat.
    # Si category_ids et item_ids sont vides → tout le menu.
    item_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="IDs de MenuItem concernés. Vide = pas de filtre plat.",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Offre restaurant"
        verbose_name_plural = "Offres restaurants"

    def __str__(self):
        return f"{self.restaurant.name} — {self.title}"


class GlovoSyncLog(models.Model):
    """Historique des synchronisations de menu Glovo (verrou + audit)."""

    class Status(models.TextChoices):
        RUNNING = "running", "En cours"
        OK = "ok", "Réussi"
        ERROR = "error", "Erreur"
        UP_TO_DATE = "up_to_date", "Déjà à jour"
        DISABLED = "disabled", "Désactivé"

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="glovo_sync_logs",
    )
    slug = models.CharField(max_length=120, db_index=True)
    started_at = models.DateTimeField(db_index=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RUNNING)
    dry_run = models.BooleanField(default=False)
    stats = models.JSONField(default=dict, blank=True)
    error = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]
        verbose_name = "log synchro Glovo"
        verbose_name_plural = "logs synchro Glovo"

    def __str__(self):
        return f"{self.slug} — {self.status} [{self.started_at:%Y-%m-%d %H:%M}]"
