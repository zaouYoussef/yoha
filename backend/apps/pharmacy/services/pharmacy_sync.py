"""Synchronisation des pharmacies de garde (scraper → PostgreSQL/SQLite).

Une pharmacie connue n'est jamais recréée : `update_or_create` sur le slug.
Une ligne `PharmacyDuty` est créée/mise à jour pour le jour courant : la garde
est rafraîchie à chaque exécution (le libellé horaire change pendant la journée,
surtout le week-end avec les sections « jour » et « 24h »).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date

from apps.pharmacy.models import Pharmacy, PharmacyDuty

SOURCE = "infopoint"

# Mois français dans les libellés Infopoint (ex. « Garde 24h de 02 août 13:00 … »).
_FR_MONTHS = {
    "janvier": 1, "février": 2, "mars": 3, "avril": 4, "mai": 5, "juin": 6,
    "juillet": 7, "août": 8, "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12,
}
_LABEL_DATE_RE = re.compile(
    r"\b(\d{1,2})\s+(" + "|".join(sorted(_FR_MONTHS, key=len, reverse=True)) + r")"
)


def label_date(label: str, default: date | None = None) -> date | None:
    """Extrait la date de début de garde depuis le libellé (ex. « 02 août »).

    Retourne `default` (ou None) si aucune date n'est trouvée. La date réelle
    de la garde prime sur `date.today()` : la source publie parfois la garde
    du lendemain alors que le serveur est encore la veille (ou inversement).
    """
    if not label:
        return default
    m = _LABEL_DATE_RE.search(label)
    if not m:
        return default
    try:
        return date(default.year if default else 1900, _FR_MONTHS[m.group(2)], int(m.group(1)))
    except ValueError:
        return default


@dataclass
class SyncReport:
    city: str = "tanger"
    total: int = 0
    created: int = 0
    updated: int = 0
    duties_created: int = 0
    duties_updated: int = 0
    duties_removed: int = 0
    errors: int = 0
    messages: list[str] = field(default_factory=list)

    def summary(self) -> str:
        return (
            f"[pharmacies] {self.city} — {self.total} pharmacies, "
            f"{self.created} créées, {self.updated} mises à jour, "
            f"{self.duties_created} gardes créées, {self.duties_updated} gardes rafraîchies, "
            f"{self.duties_removed} gardes périmées retirées, {self.errors} erreurs"
        )


def sync_pharmacies(data: dict, duty_date: date | None = None) -> SyncReport:
    """Insère/actualise les pharmacies + crée ou rafraîchit les gardes du jour.

    `data` doit contenir une liste `sections` (une par bandeau de garde :
    jour / nuit / 24h) avec chacune `guard_type`, `hours_label` et `pharmacies`.
    Le format plat historique (`pharmacies` + `guard_type` + `hours_label`)
    est accepté et traité comme une seule section.

    En cas d'échec du scraper en amont, ne rien appeler ici : les données de la
    veille restent en base (l'API sert toujours le dernier état connu).
    """
    report = SyncReport(city=data.get("city", "tanger"))
    duty_date = duty_date or date.today()

    sections = data.get("sections")
    if not sections:
        sections = [
            {
                "guard_type": data.get("guard_type", "24h"),
                "hours_label": data.get("hours_label", ""),
                "pharmacies": data.get("pharmacies", []),
            }
        ]

    duty_ids: dict[date, set[int]] = {}

    for section in sections:
        guard_type = section.get("guard_type", "24h")
        hours_label = section.get("hours_label", "")
        section_date = label_date(hours_label, duty_date) or duty_date
        seen = duty_ids.setdefault(section_date, set())

        for item in section.get("pharmacies", []):
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

                duty, duty_created = PharmacyDuty.objects.update_or_create(
                    pharmacy=pharmacy,
                    date=section_date,
                    defaults={
                        "guard_type": guard_type,
                        "hours_label": hours_label,
                        "start_time": section.get("start_time"),
                        "end_time": section.get("end_time"),
                        "start_time_2": section.get("start_time_2"),
                        "end_time_2": section.get("end_time_2"),
                        "source": SOURCE,
                    },
                )
                if duty_created:
                    report.duties_created += 1
                else:
                    report.duties_updated += 1
                seen.add(duty.pk)
            except Exception as exc:  # noqa: BLE001 — une ligne ne doit pas bloquer le lot
                report.errors += 1
                report.messages.append(f"{item.get('name', '?')}: {exc}")

    for duty_date, seen in duty_ids.items():
        stale = PharmacyDuty.objects.filter(date=duty_date).exclude(pk__in=seen)
        report.duties_removed += stale.count()
        stale.delete()

    return report
