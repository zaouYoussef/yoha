from datetime import date

from django.db.models import Q
from rest_framework import generics, permissions

from .models import Pharmacy, PharmacyDuty
from .serializers import PharmacyDutySerializer, PharmacySerializer


class DutyPharmacyListView(generics.ListAPIView):
    """Pharmacies de garde du jour. Public, sans pagination (liste complète)."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PharmacyDutySerializer
    pagination_class = None

    def get_queryset(self):
        duty_date = self.request.query_params.get("date") or date.today()
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
