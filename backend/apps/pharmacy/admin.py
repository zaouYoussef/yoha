from django.contrib import admin

from .models import Pharmacy, PharmacyDuty


@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "phone", "latitude", "longitude", "is_active")
    list_filter = ("city", "is_active")
    search_fields = ("name", "name_ar", "address", "phone")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(PharmacyDuty)
class PharmacyDutyAdmin(admin.ModelAdmin):
    list_display = ("pharmacy", "date", "guard_type", "source")
    list_filter = ("date", "guard_type", "source")
    search_fields = ("pharmacy__name", "pharmacy__address")
    raw_id_fields = ("pharmacy",)
