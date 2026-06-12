from django.contrib import admin

from .models import MenuCategory, MenuItem, Restaurant


class MenuItemInline(admin.TabularInline):
    model = MenuItem
    extra = 0


class MenuCategoryInline(admin.TabularInline):
    model = MenuCategory
    extra = 0


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "cuisine", "is_active")
    list_filter = ("cuisine", "is_active")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [MenuCategoryInline]


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("name", "restaurant", "price_mad", "is_available")
    list_filter = ("restaurant", "is_available")
