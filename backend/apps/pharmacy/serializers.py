from rest_framework import serializers

from .models import Pharmacy, PharmacyDuty


class PharmacySerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(source="latitude", read_only=True)
    lng = serializers.FloatField(source="longitude", read_only=True)

    class Meta:
        model = Pharmacy
        fields = [
            "id",
            "slug",
            "name",
            "name_ar",
            "address",
            "address_ar",
            "phone",
            "city",
            "lat",
            "lng",
            "website",
        ]


class PharmacyDutySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="pharmacy.id", read_only=True)
    slug = serializers.CharField(source="pharmacy.slug", read_only=True)
    name = serializers.CharField(source="pharmacy.name", read_only=True)
    name_ar = serializers.CharField(source="pharmacy.name_ar", read_only=True)
    phone = serializers.CharField(source="pharmacy.phone", read_only=True)
    address = serializers.CharField(source="pharmacy.address", read_only=True)
    address_ar = serializers.CharField(source="pharmacy.address_ar", read_only=True)
    lat = serializers.FloatField(source="pharmacy.latitude", read_only=True)
    lng = serializers.FloatField(source="pharmacy.longitude", read_only=True)
    guard = serializers.CharField(source="guard_type", read_only=True)

    class Meta:
        model = PharmacyDuty
        fields = [
            "id",
            "slug",
            "name",
            "name_ar",
            "phone",
            "address",
            "address_ar",
            "lat",
            "lng",
            "guard",
            "hours_label",
        ]
