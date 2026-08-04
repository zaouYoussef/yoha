from django.urls import path

from .admin_views import AdminRestaurantCreateView, AdminRestaurantDeleteView, AdminRestaurantListView, AdminRestaurantUpdateView
from .glovo_views import AddGlovoStoreView, GlovoLogsView, GlovoStoresView, GlovoSyncNowView
from .owner_views import (
    MenuCategoryDetailView,
    MenuCategoryListCreateView,
    MenuItemDetailView,
    MenuItemImageUploadView,
    MenuItemListCreateView,
    MyRestaurantCreateView,
    MyRestaurantView,
    RestaurantDetailView,
    RestaurantListView,
    RestaurantMediaUploadView,
    RestaurantOfferListCreateView,
    RestaurantOfferDetailView,
)

urlpatterns = [
    path("", RestaurantListView.as_view(), name="restaurant-list"),
    # Outils admin internes (anciens chemins add-glovo/* conservés en alias).
    path("catalog-import/store/", AddGlovoStoreView.as_view(), name="catalog-import-store"),
    path("catalog-import/stores/", GlovoStoresView.as_view(), name="catalog-import-stores"),
    path("catalog-import/logs/", GlovoLogsView.as_view(), name="catalog-import-logs"),
    path("catalog-import/sync/", GlovoSyncNowView.as_view(), name="catalog-import-sync"),
    path("add-glovo/store/", AddGlovoStoreView.as_view(), name="add-glovo-store"),
    path("add-glovo/stores/", GlovoStoresView.as_view(), name="add-glovo-stores"),
    path("add-glovo/logs/", GlovoLogsView.as_view(), name="add-glovo-logs"),
    path("add-glovo/sync/", GlovoSyncNowView.as_view(), name="add-glovo-sync"),
    path("youssef/", AdminRestaurantListView.as_view(), name="admin-restaurant-list"),
    path("youssef/create/", AdminRestaurantCreateView.as_view(), name="admin-restaurant-create"),
    path("youssef/<int:pk>/", AdminRestaurantDeleteView.as_view(), name="admin-restaurant-delete"),
    path("youssef/<int:pk>/update/", AdminRestaurantUpdateView.as_view(), name="admin-restaurant-update"),
    path("me/", MyRestaurantView.as_view(), name="restaurant-me"),
    path("me/create/", MyRestaurantCreateView.as_view(), name="restaurant-me-create"),
    path("me/media/", RestaurantMediaUploadView.as_view(), name="restaurant-me-media"),
    path("me/menu/categories/", MenuCategoryListCreateView.as_view(), name="restaurant-menu-categories"),
    path(
        "me/menu/categories/<int:pk>/",
        MenuCategoryDetailView.as_view(),
        name="restaurant-menu-category-detail",
    ),
    path("me/menu/items/", MenuItemListCreateView.as_view(), name="restaurant-menu-items"),
    path("me/menu/items/<int:pk>/", MenuItemDetailView.as_view(), name="restaurant-menu-item-detail"),
    path(
        "me/menu/items/<int:pk>/image/",
        MenuItemImageUploadView.as_view(),
        name="restaurant-menu-item-image",
    ),
    path("me/offers/", RestaurantOfferListCreateView.as_view(), name="restaurant-offers"),
    path("me/offers/<int:pk>/", RestaurantOfferDetailView.as_view(), name="restaurant-offer-detail"),
    path("<slug:slug>/", RestaurantDetailView.as_view(), name="restaurant-detail"),
]
