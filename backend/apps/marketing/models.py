from django.db import models


class PromoCampaignState(models.Model):
    """État de rotation des campagnes promo (singleton)."""

    rotation_index = models.PositiveIntegerField(default=0)
    last_run_at = models.DateTimeField(null=True, blank=True)
    last_campaign_key = models.CharField(max_length=40, blank=True)
    last_restaurant_slug = models.CharField(max_length=120, blank=True)

    class Meta:
        verbose_name = "État campagne promo"

    @classmethod
    def singleton(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class PromoEmailLog(models.Model):
    """Trace les envois pour éviter les doublons."""

    email = models.EmailField(db_index=True)
    campaign_key = models.CharField(max_length=40, db_index=True)
    restaurant_slug = models.CharField(max_length=120, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("email", "campaign_key")]
        indexes = [models.Index(fields=["campaign_key", "sent_at"])]


class EmailUnsubscribe(models.Model):
    """Désinscription des e-mails marketing."""

    email = models.EmailField(unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class PromoCode(models.Model):
    SECTION_CHOICES = [
        ("all", "Toutes les sections"),
        ("restaurant", "Restaurants"),
        ("patisserie", "Pâtisseries"),
        ("pharmacy", "Pharmacies"),
        ("parapharmacy", "Parapharmacies"),
        ("supermarket", "Supermarchés"),
        ("shop", "Magasins"),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount = models.PositiveIntegerField(help_text="Remise en % (1-100)")
    section = models.CharField(max_length=20, choices=SECTION_CHOICES, default="all")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Code promo"
        verbose_name_plural = "Codes promo"

    def __str__(self):
        return f"{self.code} (-{self.discount}%)"
