"""Synchronisation des pharmacies de garde (scraper → PostgreSQL/SQLite).

Une pharmacie connue n'est jamais recréée : `update_or_create` sur le slug.
Une ligne `PharmacyDuty` est créée pour le jour courant (idempotent grâce à la
contrainte unique pharmacy+date).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from apps.pharmacy.models import Pharmacy, PharmacyDuty

SOURCE = "infopoint"


@dataclass
class SyncReport:
    city: str = "tanger"
    total: int = 0
    created: int = 0
    updated: int = 0
    duties: int = 0
    errors: int = 0
    messages: list[str] = field(default_factory=list)

    def summary(self) -> str:
        return (
            f"[pharmacies] {self.city} — {self.total} pharmacies, "
            f"{self.created} créées, {self.updated} mises à jour, "
            f"{self.duties} gardes, {self.errors} erreurs"
        )


def sync_pharmacies(data: dict, duty_date: date | None = None) -> SyncReport:
    """Insère/actualise les pharmacies + crée la garde du jour.

    En cas d'échec du scraper en amont, ne rien appeler ici : les données de la
    veille restent en base (l'API sert toujours le dernier état connu).
    """
    report = SyncReport(city=data.get("city", "tanger"))
    duty_date = duty_date or date.today()

    for item in data.get("pharmacies", []):
        report.total += 1
        try:
            pharmacy, created = Pharmacy.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item.get("name", ""),
                    "name_ar": item.get("name_ar", ""),
                    "address": item.get("address", ""),
                    "address_ar": item.get("address_ar", ""),
                    "phone": item.get("phone", ""),
                    "city": item.get("city", report.city),
                    "latitude": item.get("latitude"),
                    "longitude": item.get("longitude"),
                    "website": item.get("website", ""),
                    "source": SOURCE,
                    "is_active": True,
                },
            )
            if created:
                report.created += 1
            else:
                report.updated += 1

            _, duty_created = PharmacyDuty.objects.get_or_create(
                pharmacy=pharmacy,
                date=duty_date,
                defaults={
                    "guard_type": data.get("guard_type", "24h"),
                    "hours_label": data.get("hours_label", ""),
                    "source": SOURCE,
                },
            )
            if duty_created:
                report.duties += 1
        except Exception as exc:  # noqa: BLE001 — une ligne ne doit pas bloquer le lot
            report.errors += 1
            report.messages.append(f"{item.get('name', '?')}: {exc}")

    return report
