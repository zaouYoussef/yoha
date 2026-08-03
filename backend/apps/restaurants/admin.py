from django.contrib import admin

from .models import (
    MenuCategory,
    MenuItem,
    MenuItemModifierGroup,
    MenuItemModifierOption,
    Restaurant,
)


class ModifierOptionInline(admin.TabularInline):
    model = MenuItemModifierOption
    extra = 0


class MenuItemModifierGroupInline(admin.TabularInline):
    model = MenuItemModifierGroup
    extra = 0


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
    inlines = [MenuItemModifierGroupInline]


@admin.register(MenuItemModifierGroup)
class MenuItemModifierGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "menu_item", "min_selected", "max_selected")
    search_fields = ("name", "menu_item__name")
    inlines = [ModifierOptionInline]


@admin.register(MenuItemModifierOption)
class MenuItemModifierOptionAdmin(admin.ModelAdmin):
    list_display = ("name", "group", "price_impact")
    search_fields = ("name", "group__name")
