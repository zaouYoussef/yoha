from django.db import models


class Pharmacy(models.Model):
    """Une pharmacie, créée une seule fois et réutilisée à chaque garde."""

    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    name = models.CharField(max_length=255, db_index=True)
    name_ar = models.CharField(max_length=255, blank=True, default="")
    address = models.TextField(blank=True, default="")
    address_ar = models.TextField(blank=True, default="")
    phone = models.CharField(max_length=50, blank=True, default="")
    city = models.CharField(max_length=100, default="Tanger", db_index=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    website = models.URLField(blank=True, default="")
    source = models.CharField(max_length=50, default="infopoint")
    source_url = models.URLField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Pharmacie"
        verbose_name_plural = "Pharmacies"

    def __str__(self):
        return self.name


class PharmacyDuty(models.Model):
    """Une ligne = une garde (jour donné) d'une pharmacie."""

    GUARD_TYPES = [
        ("day", "Jour"),
        ("night", "Nuit"),
        ("24h", "24h"),
    ]

    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name="duties",
    )
    date = models.DateField(db_index=True)
    guard_type = models.CharField(max_length=10, choices=GUARD_TYPES, default="24h")
    # Libellé brut affiché par la source (ex. « Garde 24h de 31 juillet 13:00 à 16:00
    # et de 20:00 à 09:00 du lendemain »).
    hours_label = models.CharField(max_length=255, blank=True, default="")
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    start_time_2 = models.TimeField(null=True, blank=True)
    end_time_2 = models.TimeField(null=True, blank=True)
    source = models.CharField(max_length=50, default="infopoint")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date"]
        verbose_name = "Garde"
        verbose_name_plural = "Gardes"
        constraints = [
            models.UniqueConstraint(fields=["pharmacy", "date"], name="unique_pharmacy_duty_per_day"),
        ]

    def __str__(self):
        return f"{self.pharmacy.name} — {self.date} ({self.guard_type})"
