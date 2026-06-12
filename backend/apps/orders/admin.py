from django.contrib import admin

from .models import CourierProfile, Order, OrderLine, OrderStatusHistory


class OrderLineInline(admin.TabularInline):
    model = OrderLine
    extra = 0
    readonly_fields = ("item_name", "unit_price_mad", "quantity", "line_total_mad")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("public_id", "client", "restaurant", "status", "total_mad", "created_at")
    list_filter = ("status", "restaurant", "client")
    search_fields = ("public_id", "customer_name", "customer_email", "client__email")
    inlines = [OrderLineInline]
    readonly_fields = ("profit_mad", "net_mad", "version")


@admin.register(CourierProfile)
class CourierAdmin(admin.ModelAdmin):
    list_display = ("display_name", "is_active", "rating", "vehicle")
