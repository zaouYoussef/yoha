from django.db import models
from django.conf import settings


class CourierLocation(models.Model):
    """
    Modèle de géolocalisation en temps réel pour livreurs YoHa (Campus CHU & Tanger).
    Enregistre les coordonnées GPS précises, le cap (heading) et l'ordre associé.
    """
    courier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='locations',
        verbose_name='Livreur'
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='geo_locations',
        verbose_name='Commande active'
    )

    latitude = models.DecimalField(max_digits=9, decimal_places=6, verbose_name='Latitude')
    longitude = models.DecimalField(max_digits=9, decimal_places=6, verbose_name='Longitude')
    heading = models.FloatField(default=0.0, verbose_name='Cap (Degrés 0-360)')
    speed = models.FloatField(default=0.0, verbose_name='Vitesse (km/h)')
    timestamp = models.DateTimeField(auto_now=True, verbose_name='Dernière mise à jour')

    class Meta:
        verbose_name = 'Position Livreur'
        verbose_name_plural = 'Positions Livreurs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['courier', '-timestamp']),
            models.Index(fields=['order', '-timestamp']),
        ]

    def __str__(self):
        return f"Livreur #{self.courier_id} ({self.latitude}, {self.longitude}) à {self.timestamp.strftime('%H:%M:%S')}"
