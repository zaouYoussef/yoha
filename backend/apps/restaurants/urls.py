from django.urls import path

from .admin_views import AdminRestaurantCreateView, AdminRestaurantDeleteView, AdminRestaurantListView
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
)

urlpatterns = [
    path("", RestaurantListView.as_view(), name="restaurant-list"),
    path("youssef/", AdminRestaurantListView.as_view(), name="admin-restaurant-list"),
    path("youssef/create/", AdminRestaurantCreateView.as_view(), name="admin-restaurant-create"),
    path("youssef/<int:pk>/", AdminRestaurantDeleteView.as_view(), name="admin-restaurant-delete"),
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
    path("<slug:slug>/", RestaurantDetailView.as_view(), name="restaurant-detail"),
]
