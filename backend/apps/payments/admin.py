from django.contrib import admin

from .models import LedgerEntry, Payment, PayoutBatch


class LedgerInline(admin.TabularInline):
    model = LedgerEntry
    extra = 0
    readonly_fields = ("entry_type", "amount_mad", "metadata", "created_at")

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "amount_mad", "method", "status", "created_at")
    list_filter = ("status", "method")
    inlines = [LedgerInline]
    readonly_fields = ("idempotency_key", "created_at", "captured_at")


@admin.register(PayoutBatch)
class PayoutBatchAdmin(admin.ModelAdmin):
    list_display = ("beneficiary_type", "total_mad", "status", "created_at")
