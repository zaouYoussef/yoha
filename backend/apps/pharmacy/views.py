from datetime import date, timedelta

from django.db.models import Q
from django.utils.dateparse import parse_date
from rest_framework import generics, permissions

from .models import Pharmacy, PharmacyDuty
from .serializers import PharmacyDutySerializer, PharmacySerializer


def resolve_active_duty_date(requested: str | None = None) -> date:
    """Date de garde à servir — miroir Infopoint (garde overnight jusqu'au lendemain matin).

    Infopoint publie « Garde … de 03 août … à 09:00 du lendemain » : en base la
    date reste le 03, alors que `date.today()` peut déjà être le 04 → filtre trop
    strict = liste vide. On sert donc la dernière date de garde ≤ aujourd'hui.
    """
    if requested:
        parsed = parse_date(str(requested).strip())
        if parsed:
            return parsed

    today = date.today()
    latest = (
        PharmacyDuty.objects.filter(date__lte=today)
        .order_by("-date")
        .values_list("date", flat=True)
        .first()
    )
    if latest:
        return latest
    # Filet de sécurité : veille si rien d'autre
    yesterday = today - timedelta(days=1)
    if PharmacyDuty.objects.filter(date=yesterday).exists():
        return yesterday
    return today


class DutyPharmacyListView(generics.ListAPIView):
    """Pharmacies de garde actives (jour courant / nuit overnight). Public."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PharmacyDutySerializer
    pagination_class = None

    def get_queryset(self):
        duty_date = resolve_active_duty_date(self.request.query_params.get("date"))
        return (
            PharmacyDuty.objects.filter(date=duty_date, pharmacy__is_active=True)
            .select_related("pharmacy")
            .order_by("pharmacy__name")
        )


class PharmacyDetailView(generics.RetrieveAPIView):
    """Détail d'une pharmacie (par slug ou id). Public."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PharmacySerializer
    queryset = Pharmacy.objects.all()
    lookup_field = "slug"


class PharmacySearchView(generics.ListAPIView):
    """Recherche de pharmacie : /api/v1/pharmacies/search/?q=arrabie."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PharmacySerializer

    def get_queryset(self):
        q = (self.request.query_params.get("q") or "").strip()
        if not q:
            return Pharmacy.objects.none()
        return Pharmacy.objects.filter(
            Q(name__icontains=q)
            | Q(name_ar__icontains=q)
            | Q(address__icontains=q)
            | Q(address_ar__icontains=q)
            | Q(phone__icontains=q)
        ).order_by("name")
