from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "target_type", "target_id", "actor", "ip_address", "created_at")
    list_filter = ("action", "target_type")
    search_fields = ("target_id", "action")
    readonly_fields = (
        "id",
        "actor",
        "action",
        "target_type",
        "target_id",
        "ip_address",
        "user_agent",
        "metadata",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
