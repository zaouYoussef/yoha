from django.contrib import admin

from .models import EmailUnsubscribe, PromoCampaignState, PromoEmailLog


@admin.register(PromoCampaignState)
class PromoCampaignStateAdmin(admin.ModelAdmin):
    list_display = ("rotation_index", "last_run_at", "last_restaurant_slug", "last_campaign_key")
    readonly_fields = ("last_run_at",)


@admin.register(PromoEmailLog)
class PromoEmailLogAdmin(admin.ModelAdmin):
    list_display = ("email", "campaign_key", "restaurant_slug", "sent_at")
    list_filter = ("campaign_key",)
    search_fields = ("email",)


@admin.register(EmailUnsubscribe)
class EmailUnsubscribeAdmin(admin.ModelAdmin):
    list_display = ("email", "created_at")
    search_fields = ("email",)
