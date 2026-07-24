from django.urls import path

from .views import (
    AdminPromoDetailView,
    AdminPromoListView,
    RestaurantPromoListCreateView,
    RestaurantPromoDetailView,
    UnsubscribeView,
    ValidatePromoView,
)

urlpatterns = [
    path("unsubscribe/", UnsubscribeView.as_view(), name="marketing-unsubscribe"),
    path("promos/validate/", ValidatePromoView.as_view(), name="marketing-promo-validate"),
    path("promos/", AdminPromoListView.as_view(), name="marketing-promos"),
    path("promos/<int:pk>/", AdminPromoDetailView.as_view(), name="marketing-promo-detail"),
    path("restaurant-promos/", RestaurantPromoListCreateView.as_view(), name="restaurant-promo-list"),
    path("restaurant-promos/<int:pk>/", RestaurantPromoDetailView.as_view(), name="restaurant-promo-detail"),
]
